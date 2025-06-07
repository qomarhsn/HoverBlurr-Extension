# HoverBlurr

A browser extension that blurs images on web pages. Hover over blurred images to reveal them.

## What it does

- Automatically blurs images on websites
- Reveal images by hovering over them
- Customizable blur intensity and speed
- Whitelist sites to exclude from blurring

## Installation

### Chrome/Edge

1. Download the `.crx` file from the [Releases](https://github.com/qomarhsn/HoverBlurr-Extension/releases) page
2. Open `chrome://extensions/`
3. Enable "Developer mode"
4. Drag and drop the downloaded `.crx` file into the extensions page

### Firefox

Currently trying to publish on Firefox Add-ons Store. Once published, the installation link will be added here.

For now, you can install it temporarily:
1. Download this repository (click "Code" > "Download ZIP") and extract it, or clone it using `git clone`
2. Open `about:debugging#/runtime/this-firefox`
3. Click "Load Temporary Add-on"
4. Select `manifest.json` from the extracted/cloned folder

## Usage

1. Click the HoverBlurr icon in your browser toolbar
2. Toggle the extension on/off
3. Adjust settings as needed
4. Visit any website - images will be blurred automatically

## Keyboard Shortcuts

- `Alt+B` - Toggle blur on/off for current site

## License

MIT License - see [LICENSE](LICENSE) file for details

[Blur icons created by Icon mania - Flaticon](https://www.flaticon.com/free-icons/blur)
