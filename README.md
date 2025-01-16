<div align="center">
<img src="https://github.com/user-attachments/assets/4a9e6998-480c-4dcb-ab71-e4d304a16fce" alt="apkpure-downloader" width="100" style="style: block; margin: 0 auto; border-radius: 15px;"/>

# apkpure-downloader

</div>

**search and download from apkpure.com in a better way**

[![npm version](https://img.shields.io/npm/v/apkpure)](https://www.npmjs.com/package/apkpure)
![Last Commit](https://img.shields.io/github/last-commit/lfsaga/apkpure-downloader)

- smoothy menu.
- download multiple to filesystem.
- group `.apk` files by yearMonth release format directories.
- includes command to install `.xapk` files (needs `adb` in PATH)

## requirements

- `node`, `npm`, `adb` in PATH.
- Tested on Linux so far.

## ⬇️ install

- Install the command with `npm`

```bash
npm install -g apkpure
```

- Uninstall:

```bash
npm uninstall -g apkpure
npm cache clean --force
```

## 🔨 use cases

- **alias explanation** : it's possible to internally alias from `com.github.android` to `github` or `gh`, **it must be set when searching**.

```bash
apkpure init # required

# interactive
# search on apkpure to track/show them versions
apkpure search fb,ig,tiktok

# manage packages. go interactive
apkpure show
apkpure pull
apkpure untrack

# unattended
apkpure pull fb,ig,tiktok --last 1
apkpure pull fb --last 5 --threads 2
apkpure show all --last 3 # tip: "all" is reserved
apkpure show fb,ig,tiktok --last 1

# apkpure-adb command (required adb in PATH)
apkpure-adb install /path/to/package.xapk
```

## contribute

1. `git clone https://github.com/lfsaga/apkpure-downloader`
2. `cd apkpure-downloader`
3. `npm install`
4. `npm install -g .`
5. `apkpure init` (manually installed)

## help output

```bash
Usage: apkpure [options] [command]

https://github.com/lfsaga/apkpure-downloader

Options:
  -V, --version         print apkpure-downloader version
  -h, --help            display help for command

Commands:
  init                  initialize in working directory
  search [terms]        search new packages (track or pull them)
  show [options] [ids]  show info about tracked packages
  pull [options] [ids]  pull APK files for tracked packages
  untrack [ids]         no track a package anymore
  help [command]        display help for command
```
