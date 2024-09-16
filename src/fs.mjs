import fs from 'fs';
import path, { resolve } from 'path';

class Files {
    static async createDirectory({ dirPath, recursive = true }) {
        return new Promise((resolve, reject) => {
            fs.mkdir(dirPath, { recursive }, (err) => {
                if (err) {
                    reject(err);
                }
                resolve();
            });
        });
    }

    static async deleteDirectory({ dirPath }) {
        return new Promise((resolve, reject) => {
            fs.rmdir(dirPath, { recursive: true }, (err) => {
                if (err) {
                    reject(err);
                }
                resolve();
            });
        });
    }

    static async deleteFile({ filePath }) {
        return new Promise((resolve, reject) => {
            fs.unlink(filePath, (err) => {
                if (err) {
                    reject(err);
                }
                resolve();
            });
        });
    }

    static async listFiles({ dirPath }) {
        return new Promise((resolve, reject) => {
            fs.readdir(dirPath, (err, files) => {
                if (err) {
                    reject(err);
                }
                resolve(files);
            });
        });
    }

    static async readFile({ filePath }) {
        return new Promise((resolve, reject) => {
            fs.readFile(filePath, 'utf8', (err, data) => {
                if (err) {
                    reject(err);
                }
                resolve(data);
            });
        });
    }

    static async appendFile({ filePath, data }) {
        return new Promise((resolve, reject) => {
            fs.appendFile(filePath, data, (err) => {
                if (err) {
                    reject(err);
                }
                resolve();
            });
        })
    }

    static async isAccessible({ filePath }) {
        return new Promise((resolve, reject) => {
            fs.access(filePath, fs.constants.F_OK, (err) => {
                if (err) {
                    resolve(false);
                }
                resolve(true);
            });
        })
    }

    static async renameFile({ oldPath, newPath }) {
        return new Promise((resolve, reject) => {
            fs.rename(oldPath, newPath, (err) => {
                if (err) {
                    reject(err);
                }
                resolve();
            });
        });
    }

    static async renameFileOverwrite({ oldPath, newPath }) {
        return new Promise((resolve, reject) => {
            fs.rename(oldPath, newPath, (err) => {
                if (err) {
                    reject(err);
                }
                resolve();
            });
        })
    }

    static async getLastModifiedFile({ dirPath }) {
        return new Promise((resolve, reject) => {
            fs.readdir(dirPath, (err, files) => {
                if (err) {
                    reject(err);
                }

                let lastModifiedFile = null;
                let lastModifiedTime = 0;

                files.forEach((file) => {
                    const filePath = path.join(dirPath, file);
                    const stats = fs.statSync(filePath);
                    if (stats.mtimeMs > lastModifiedTime) {
                        lastModifiedTime = stats.mtimeMs;
                        lastModifiedFile = file;
                    }
                });

                resolve(lastModifiedFile);
            });
        })
    }

    static async createSymlink({ targetDir, symlinkPath }) {
        return new Promise((resolve, reject) => {
            try {
                // Check if the symlinkPath already exists
                if (fs.existsSync(symlinkPath)) {
                    // If it's a symlink, remove it
                    if (fs.lstatSync(symlinkPath).isSymbolicLink()) {
                        fs.unlinkSync(symlinkPath);
                    } else {
                        // If it's a directory or file, handle as needed
                        reject(new Error(`Path already exists and is not a symlink: ${symlinkPath}`));
                        return;
                    }
                }

                // Create the symlink
                fs.symlink(targetDir, symlinkPath, 'dir', (err) => {
                    if (err) {
                        reject(err);
                    }
                    resolve();
                });
            } catch (error) {
                reject(error);
            }
        });
    }


    static async copyFileIfNotExists({ srcPath, destPath }) {
        return new Promise((resolve, reject) => {
            if (!fs.existsSync(destPath)) {
                fs.copyFile(srcPath, destPath, (err) => {
                    if (err) {
                        reject(err);
                    }
                    resolve();
                });
            } else {
                resolve();
            }
        })
    }
}

export default Files;