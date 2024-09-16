import { createRequire } from 'module';
import path from 'path';
import ora from 'ora';
import Files from './fs.mjs';

import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
puppeteer.use(StealthPlugin());

const require = createRequire(import.meta.url);
const cheerio = require('cheerio');

const green = '\x1b[32m';
const yellow = '\x1b[33m';
const reset = '\x1b[0m';

const getUrlData = (inputUrl) => {
    const regex = /https:\/\/apkpure\.com\/([^\/]+)\/([^\/]+)\/download\/(.+)/;
    return {
        beautyName: inputUrl.match(regex)[1],
        packageName: inputUrl.match(regex)[2],
        version: inputUrl.match(regex)[3]
    };
};

const getApkParams = (input) => {
    return input.split('&').reduce((acc, param) => {
        const [key, value] = param.split('=');
        acc[key] = decodeURIComponent(value);
        return acc;
    }, {});
};

const getUpdatedAt = (input) => {
    const parts = input.split(' ');
    return `${parts[0].toLowerCase()}${parts[2]}`;
};

async function downloadApk({ browser, downloadUrl, downloadPath }) {
    const downloadPage = await browser.newPage();
    await setBlockResources({ page: downloadPage });
    await setDownloadBehavior({ page: downloadPage, downloadPath });
    await downloadPage.goto(downloadUrl, { waitUntil: 'networkidle2' });
    await waitDownloadToBeCompleted({ page: downloadPage });
    await downloadPage.close();
}

async function waitDownloadToBeCompleted({ page }) {
    return new Promise((resolve, reject) => {
        page._client().on('Page.downloadProgress', e => {
            if (e.state === 'completed') resolve(true);
            else if (e.state === 'canceled') reject(new Error('Download canceled'));
        });
    });
}

async function setDownloadBehavior({ page, downloadPath }) {
    await Files.createDirectory({ dirPath: downloadPath });
    await (await page.target().createCDPSession()).send('Browser.setDownloadBehavior', {
        behavior: 'allow',
        downloadPath
    });
}

async function setBlockResources({ page }) {
    await page.setRequestInterception(true);
    page.on('request', (request) => {
        const resourceType = request.resourceType();
        if (['stylesheet', 'image', 'font', 'media', 'texttrack', 'websocket'].includes(resourceType)) {
            request.abort();
        } else {
            request.continue();
        }
    });
}

const searchApps = ({ strings, browserBin, headless }) =>
    new Promise(async (resolve, reject) => {
        let browser, page;

        if (typeof strings === 'string') { strings = [strings]; }
        const spinner = ora({
            spinner: 'aesthetic',
            hideCursor: false,
            discardStdin: false
        }).start(`Searching on apkpure.com ...`);

        try {
            browser = await puppeteer.launch({
                headless,
                executablePath: browserBin,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });

            page = await browser.newPage();

            const apps = new Set();
            for (const string of strings) {
                await page.goto(`https://apkpure.com/search?q=${string}`, { waitUntil: 'networkidle2' });

                const content = await page.content();
                const $ = cheerio.load(content);

                $('a').each((_, element) => {
                    const href = $(element).attr('href');
                    if (
                        href &&
                        href.match(/^https:\/\/apkpure\.com\/[^\/]+\/[^\/]+\.[^\/]+$/) &&
                        !href.includes('com.apkpure.aegon')
                    ) apps.add(href);
                });

            }

            await browser.close();
            spinner.stop();
            resolve(apps);
        } catch (err) {
            if (browser) await browser.close();
            spinner.stop();
            reject(err);
        }
    });

const evaluateApps = ({ apps, last, threads, browserBin, outputDir, headless }) =>
    new Promise(async (resolve, reject) => {
        let browser;

        const spinner = ora({
            spinner: 'aesthetic',
            hideCursor: false,
            discardStdin: false
        }).start(`Searching APK files ...`);

        try {
            const finalThreads = parseInt(threads) || 1;
            const toEvaluate = Array.from(apps);

            browser = await puppeteer.launch({
                headless,
                executablePath: browserBin,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });

            async function evaluateAppVersions({ browserBin, headless, url, outputDir, last }) {
                const browser = await puppeteer.launch({
                    executablePath: browserBin,
                    headless: headless ?? true,
                    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=800,600']
                });

                const page = await browser.newPage();
                await setBlockResources({ page });
                await page.goto((!url.includes('/versions') ? `${url}/versions` : url), { waitUntil: 'networkidle2' });

                const content = await page.content();
                const $ = cheerio.load(content);

                const now = new Date();

                let versions = $('a.ver_download_link');
                if (!isNaN(last)) versions = versions.slice(0, last);

                spinner.text = ''

                for (const versionElement of versions) {
                    const urlData = getUrlData(
                        $(versionElement).attr('href')
                    );

                    const vParams = getApkParams(
                        $(versionElement).attr('dt-params')
                    );

                    const vUpdatedAt = getUpdatedAt(
                        $(versionElement).find('.update-on').text().trim()
                    );

                    const finalPath = process.env.OUTPUT_RELEASE_MONTH === 'false' ?
                        path.join(outputDir, vParams.package_name) :
                        path.join(outputDir, vParams.package_name, vUpdatedAt);

                    const finalFileName = `${vParams.version.replace(' ', '_')}.apk`;
                    const finalFilePath = path.join(finalPath, finalFileName);

                    if (!(await Files.isAccessible({ filePath: finalFilePath }))) {
                        spinner.clear()
                        console.log(`${yellow}[${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}][${vParams.package_name}][${vParams.version}][from ${vUpdatedAt}] Downloading ...`);
                        await downloadApk({
                            browser,
                            downloadUrl: `https://apkpure.com/${urlData.beautyName}/${vParams.package_name}/downloading/${vParams.version}`,
                            downloadPath: finalPath
                        });

                        const downloadFileName = await Files.getLastModifiedFile({ dirPath: finalPath });
                        if (downloadFileName !== finalFileName) {
                            await Files.renameFileOverwrite({
                                oldPath: path.join(finalPath, downloadFileName),
                                newPath: finalFilePath
                            });
                        }
                        spinner.clear()
                        console.log(`${green}[${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}][${vParams.package_name}][${vParams.version}] Stored [${finalFilePath}]${reset}`);
                    } else {
                        spinner.clear()
                        console.log(`${green}[${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}][${vParams.package_name}][${vParams.version}] Exists [${finalFilePath}]${reset}`);
                    }

                    (await Files.listFiles({ dirPath: finalPath })).filter(file => !file.endsWith('.apk'))
                        .forEach(async (file) => await Files.deleteFile({ filePath: path.join(finalPath, file) }));
                }

                await page.close();
                await browser.close();
            }

            const executeWithConcurrency = async () => {
                const chunks = [];
                for (let i = 0; i < toEvaluate.length; i += finalThreads) {
                    chunks.push(toEvaluate.slice(i, i + finalThreads));
                }

                for (const chunk of chunks) {
                    await Promise.all(chunk.map(
                        url => evaluateAppVersions({ browserBin, headless, url, outputDir, last })
                    ));
                }
            };

            await executeWithConcurrency();
            spinner.stop();
            resolve();
        } catch (err) {
            if (browser) await browser.close();
            spinner.stop();
            reject(err);
        }
    });

export { searchApps, evaluateApps };