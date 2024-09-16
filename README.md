<div align="center">
<img src="https://github.com/user-attachments/assets/4a9e6998-480c-4dcb-ab71-e4d304a16fce" alt="APKPure Logo" width="70" style="style: block; margin: 0 auto; border-radius: 15px;"/>

# apkpure-downloader

</div>

**Search and download from [apkpure.com](https://apkpure.com/) in a better way**

[![npm version](https://img.shields.io/npm/v/apkpure)](https://www.npmjs.com/package/apkpure)
![Last Commit](https://img.shields.io/github/last-commit/lfsaga/apkpure-downloader)

- Mass download.
- Smoothy CLI tool.
- Can group `.apk` files by release date.



Requirements
-
- `node`, `npm`.
-  [nvm (recommended)](https://github.com/nvm-sh/nvm).
- Only tested on Linux.

⬇️ Installation
-
- With `npm`:

```bash
npm install -g apkpure
```


**Manually:**
- `git clone <repository-url>` and `npm install` on it.
- Use `~/.bashrc` alias like:
```bash
alias apkpure='cd /path/to/project && npm run start -- "$@"'
```
- Remove: 
```bash
npm uninstall -g apkpure 
npm cache clean --force
```

🔨 Usage
-
```bash
# download 3 last version from all favorites
apkpure --yes --last 3 --threads 4
```

```bash
# multi search to add new favorites
apkpure --search netflix --search whatsapp --search tiktok
```


**Help**
-
```bash
Usage: apkpure [flag] [flag] ...

Manage apps

  --apps [?editor]                    Print or edit favorite apps (apkpure.com url)
  --search [string]                   Search (multiple) apps to add to favorite
  --symlink [path]                    Symlink output directory
  --help                              Print this help
  
Download

  No flags                            Evaluate favorite apps
  --yes                               Evaluate favorite apps (skip confirmation)
  --choose                            Select multiple from favorite apps
  --last [n]                          Number of versions to download (default: all)
  --threads [n]                       Enable parallel downloads (max: 10)
  
  *unattended: use --yes, --last and --threads 
```

📳 APK Files
-

- **Link output directory with `apkpure --symlink ~/Desktop/apks-output`.**
- Running `which apkpure` on Linux might help figuring out your installation directory.
- Get something similar to:

<img style="style: block; margin: 0 auto; border-radius: 15px;" src="https://github.com/user-attachments/assets/18edea26-7d18-4e1c-a004-3f2ec61d0622" alt="APKPure Logo" width="450"/>


.env File
-

| Variable         | Example |Description |
|------------------|-------------|-------------|
| `OUTPUT_PATH`        |`/home/$USER/Downloads`| Overrides downloads output path. |
| `OUTPUT_RELEASE_MONTH`   |`false`| Output files grouped by APK release month. |
| `FORCE_LAST`         |`10`| Overrides number of versions to download. |
| `FORCE_THREADS`         |`5`| Overrides threads to run. |
| `EXECUTABLE_PATH`   |`/usr/bin/chrome-browser`| Overrides puppeteer executable path. |
| `HEADLESS`          |`false`| Overrides puppeteer headless mode (running headful might consume resources). |

Regardless
-

- I started writing a quick utility script, then I built this CLI tool with few use cases.

- This utility helped me so far and I would be very happy if it do the trick also for you!

- Any suggestions, improvements or bug fixes would be greatly appreciated.