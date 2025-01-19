<div align="center">
<img src="https://github.com/user-attachments/assets/4a9e6998-480c-4dcb-ab71-e4d304a16fce" alt="apkpure-downloader" width="100" style="style: block; margin: 0 auto; border-radius: 15px;"/>

# apkpure-downloader

</div>

search and download from apkpure.com in a better way

[![npm version](https://img.shields.io/npm/v/apkpure)](https://www.npmjs.com/package/apkpure)
![Last Commit](https://img.shields.io/github/last-commit/lfsaga/apkpure-downloader)

- **parallel download into filesystem**
- **group `apk|xapk` files by release month directories**
- **super smoothy menu**
  - all commands could be interactive or unattended

## requirements

- `node`, `npm`.
- Tested only with POSIX Linux.

## 🔨 use cases

- **alias explanation** : when tracking a new package, an alias must be set to name from `com.twitter.android` to `x` internally (use package name anycase).
- it's possible to use `--all` or `-a` to refer all tracked packages.

```bash
# search packages interactively
# then you can pull files or add to tracked
apkpure search x

# list, show info or pull from tracked packages
apkpure ls
apkpure info
apkpure pull
apkpure untrack

# unatteneded
apkpure info x --last 5
apkpure pull x --last 5 --threads 2
apkpure pull x -l 5 -t 2 # it's the same BUT short flags
apkpure pull -a -l 1 # equals to use `--all`
```

## ⬇️ install

- Install the command with `npm`

```bash
npm install -g apkpure
```

- Uninstall:

```bash
npm uninstall -g apkpure
npm cache clean --force
rm -rf ~/.apkpure # check this folder for apks file may be relevant for you
```

## contribute

1. `git clone https://github.com/lfsaga/apkpure-downloader`
2. `cd apkpure-downloader`
3. `npm install`
4. test a dev command `npm run dev -- command args`
5. Build
   - test `apkpure` command directly with `npm install -g .`
   - each changes requires a build `npm run build`

## help output

```bash
Usage: apkpure [options] [command]

https://github.com/lfsaga/apkpure-downloader

Options:
  -V, --version                  output the version number
  -h, --help                     display help for command

Commands:
  list|ls                        list-only tracked packages
  search|s [terms]               search and interact with results
  info|i [options] [aliases]     print details from tracked packages
  pull|p [options] [aliases]     pull last files from packages
  untrack|u [options] [aliases]  untrack packages
  clear-cache                    clear untracked files
  help                           show help
```

## the `xapk` problem

You may find that many apps offered by APKPure are bundled and distributed as `.xapk` rather than the typical `.apk`. While installing an `.apk` file is the standard method on Android devices, `.xapk` files require additional steps. Below is a Bash script for installing `.xapk` files from your local filesystem using ADB (which requires a connected Android device).

- [**xapk-install.sh**](docs/xapk-install.sh)
