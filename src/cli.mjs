#!/usr/bin/env node

import { argv } from 'zx';
import Files from './fs.mjs';
import { spawn } from 'child_process';
import dotenv from 'dotenv';
import { executablePath } from 'puppeteer';
import { createRequire } from 'module';
import { evaluateApps, searchApps } from './index.mjs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const require = createRequire(import.meta.url);
const { prompt } = require('enquirer');

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const basePath = dirname(__dirname);
const appsPath = join(basePath, 'favorites.txt');
const outputDir = process.env.OUTPUT_PATH ?? join(basePath, 'output');

try {
    await Files.copyFileIfNotExists({
        srcPath: join(basePath, '.env.example'),
        destPath: join(basePath, '.env')
    });

    await Files.copyFileIfNotExists({
        srcPath: join(basePath, 'favorites.example.txt'),
        destPath: appsPath
    });
} catch (err) {
    console.error('Error setting up environment files:', err.message);
    process.exit(1);
}

const getMenuLabelFromUrl = (url) => {
    return `${url.split('/')[3].replace(/-/g, ' ')} | ${url.split('/')[4]}`;
};

const help = () => {
    console.log(`
Usage: apkpure [flag] [flag] ...

Manage apps

  --apps [?editor]                    Print or edit favorite apps (apkpure.com url)
  --search [string] [string]          Search multiple to add new favorite apps 
  --symlink [path]                    Symlink output directory
  --help                              Print this help
  
Download

  No flags                            Evaluate favorite apps
  --yes                               Evaluate favorite apps (skip confirmation)
  --choose                            Select multiple from favorite apps
  --last [n]                          Number of versions to download (default: all)
  --threads [n]                       Enable parallel downloads (max: 10)
  
  *unattended: use --yes, --last and --threads 

GitHub Repository: https://github.com/lfsaga/apkpure-downloader
  `);
};

const symlink = (linkPath) => {
    return new Promise(async (resolve, reject) => {
        if (!linkPath.match(/^(\/|~)/)) { reject(new Error('Invalid symlink path')); }

        await Files.createSymlink({ targetDir: outputDir, symlinkPath: linkPath });
        console.log(`Symlinked ${outputDir} to ${linkPath}`);
        resolve();
    })
};

const readApps = async () => {
    try {
        const data = await Files.readFile({ filePath: appsPath, encoding: 'utf8' });
        return new Set(data.split('\n').filter(Boolean).filter(url => url.match(/https:\/\/apkpure\.com\//)));
    } catch (err) {
        console.error('Failed to read apps:', err.message);
        process.exit(1);
    }
};

const edit = (editor) => {
    return new Promise((resolve, reject) => {
        const cmd = {
            gnometexteditor: 'gnome-text-editor',
            gedit: 'gedit',
            nano: 'nano',
            vi: 'vi',
            code: 'code'
        }[editor] || 'nano';

        console.log(`Opening ${appsPath} with ${cmd} ...`);
        const editorProcess = spawn(cmd, [appsPath], { stdio: 'inherit' });
        editorProcess.on('error', (err) => { reject(err); });
    })
};

const promptLastAndThreads = async () => {
    const last = argv.last ??
        process.env.FORCE_LAST ??
        (await prompt({ type: 'input', name: 'last', message: 'Number of versions to download ', default: 'all' })).last;

    const threads = argv.threads ??
        process.env.FORCE_THREADS ??
        (await prompt({ type: 'input', name: 'threads', message: `Threads to run`, default: 1 })).threads;

    if (threads > 10) {
        throw new Error('Threads cannot exceed 10. Please choose 10 or fewer threads.');
    }

    return { last, threads };
};

const choose = () => {
    return new Promise(async (resolve, reject) => {
        let apps = new Set();
        while (apps.size === 0) {
            const selectedApps = await prompt({
                type: 'select',
                name: 'choose',
                multiple: true,
                message: 'Choose apps to evaluate (choose at least one)',
                choices: Array.from(await readApps()).map(url => ({
                    message: getMenuLabelFromUrl(url),
                    value: url
                }))
            });

            apps = new Set(selectedApps.choose);

            if (apps.size === 0) {
                console.log('Please select at least one app.');
            }
        }

        if (apps.size === 1) {
            argv.threads = 1;
        }

        const { last, threads } = await promptLastAndThreads();
        await evaluateApps({
            last,
            threads,
            apps,
            browserBin: process.env.EXECUTABLE_PATH ?? executablePath(),
            outputDir,
            headless: process.env.HEADLESS?.toLowerCase() !== 'false' ? 'new' : false
        }).then(() => {
            process.exit(0);
        }).catch((err) => {
            console.error('Evaluation error:', err.message);
            process.exit(1);
        });
    });
};

try {
    const apps = await readApps();

    if (argv.help) {
        help();
    } else if (argv.apps) {
        if (typeof argv.apps === 'string' && ['nano', 'code', 'gedit', 'vi'].includes(argv.apps)) {
            await edit(argv.apps);
        } else {
            console.log(`Path: ${appsPath}\n`);
            console.log(`Content:\n`);
            console.log(Array.from(await readApps()).join('\n'));
        }
    } else if (argv.edit) {
        await edit(typeof argv.edit === 'string' ? argv.edit : null);
    } else if (argv.symlink) {
        await symlink(argv.symlink);
    } else if (argv.search) {
        await searchApps({
            strings: argv.search,
            browserBin: process.env.EXECUTABLE_PATH ?? executablePath(),
            headless: process.env.HEADLESS?.toLowerCase() !== 'false' ? 'new' : false
        }).then(async (newApps) => {
            let appsToAppend = new Set();

            while (appsToAppend.size === 0) {
                const selectedApps = await prompt({
                    type: 'select',
                    name: 'search',
                    multiple: true,
                    message: 'Add new apps (choose at least one)',
                    choices: Array.from(newApps).map(newUrl => ({
                        message: getMenuLabelFromUrl(newUrl),
                        value: newUrl,
                        disabled: Array.from(apps).includes(newUrl) ? '(already added)' : false
                    }))
                });

                appsToAppend = new Set(selectedApps.search);

                if (appsToAppend.size === 0) {
                    console.log('Please select at least one app.');
                }
            }

            await Files.appendFile({ filePath: appsPath, data: `\n${Array.from(appsToAppend).join('\n')}` });
            await choose();
        }).catch((err) => {
            console.error('Search error:', err.message);
            process.exit(1);
        });
    } else if (argv.choose) {
        await choose();
    } else {
        if (!argv.yes) {
            console.log(`Remember to use --help to see all available options`);
            console.log(`Cntl+C to exit`);
            const confirm = await prompt({
                type: 'confirm',
                name: 'confirm',
                message: `Evaluate all apps? (${apps.size})`,
                default: true
            });

            if (!confirm.confirm) {
                await choose();
            }
        }

        if (apps.size === 1) {
            argv.threads = 1;
        }

        const { last, threads } = await promptLastAndThreads();
        await evaluateApps({
            last,
            threads,
            apps,
            browserBin: process.env.EXECUTABLE_PATH ?? executablePath(),
            outputDir,
            headless: process.env.HEADLESS?.toLowerCase() !== 'false' ? 'new' : false
        }).then(() => {
            process.exit(0);
        }).catch((err) => {
            console.error('Evaluation error:', err.message);
            process.exit(1);
        });
    }
} catch (err) {
    console.error('CLI error:', err.message);
    process.exit(1);
}

process.exit(0);
