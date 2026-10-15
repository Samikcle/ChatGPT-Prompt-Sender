
# ChatGPT Prompt Sender

A lightweight Chrome extension that allows users to quickly insert or send predefined prompts to ChatGPT using a keyboard shortcut or extension popup.

The extension works directly in an existing Chrome browser session, so there is no need to create a separate browser profile, transfer login cookies, or use the OpenAI API.

## Features

- **Keyboard Shortcut** — Press `Ctrl + Shift + R` to insert and attempt to send your saved prompt.
- **Prompt Storage** — Automatically saves your prompt using Chrome's local extension storage.
- **Popup Interface** — Edit and insert prompts through a simple popup.
- **Automatic Submission** — Attempts to send the saved prompt when the keyboard shortcut is triggered.
- **Existing Browser Session** — Uses your current ChatGPT login without requiring additional authentication.
- **Multiple Editor Support** — Supports different ChatGPT input elements, including textarea and contenteditable editors.

## Installation

1. Download or clone this repository.
2. Open Google Chrome.
3. Navigate to `chrome://extensions/`.
4. Enable **Developer mode** in the top-right corner.
5. Click **Load unpacked**.
6. Select the `ChatGPT-Prompt-Sender` folder.
7. The extension is now installed.

No additional dependencies or build steps are required.

## Usage

### Method 1: Extension Popup

1. Open [ChatGPT](https://chatgpt.com/) in Chrome.
2. Click the ChatGPT Prompt Sender extension icon.
3. Enter your predefined prompt in the text area.
4. Click **Insert Message**.
5. The prompt will be inserted into ChatGPT's message box.
6. Review and manually submit the message.

### Method 2: Keyboard Shortcut

1. Open ChatGPT in the active browser tab.
2. Save a predefined prompt using the extension popup.
3. Press `Ctrl + Shift + R`.
4. The extension retrieves the saved prompt, inserts it into ChatGPT's message box, and attempts to submit it automatically.

**Note:** `Ctrl + Shift + R` is also Chrome's hard-refresh shortcut. Chrome may prevent the extension from using this combination.

To check or change the shortcut:

1. Navigate to `chrome://extensions/shortcuts`.
2. Find **ChatGPT Prompt Sender**.
3. Assign an available keyboard combination to **Send the saved prompt to ChatGPT**.

## How It Works

The extension uses Chrome's Manifest V3 extension APIs.

### manifest.json

Defines the extension's metadata, permissions, popup interface, background service worker, and keyboard shortcut.

Required permissions:

- `activeTab` — Provides temporary access to the active browser tab after an extension invocation.
- `scripting` — Allows JavaScript execution within the ChatGPT webpage.
- `storage` — Saves and retrieves predefined prompts locally.

### popup.html

Provides a simple interface containing:

- A text area for entering a predefined prompt.
- An **Insert Message** button.
- A status message displaying the result.

### popup.js

Handles popup interactions:

- Loads the previously saved prompt.
- Automatically saves changes using `chrome.storage.local`.
- Sends requests to `background.js` using `chrome.runtime.sendMessage()`.

### background.js

Handles the main automation logic:

- Listens for the configured keyboard shortcut using `chrome.commands`.
- Retrieves the saved prompt from local storage.
- Identifies the active ChatGPT tab.
- Executes the message insertion function using `chrome.scripting.executeScript()`.
- Attempts to submit the message when triggered by the keyboard shortcut.
- Processes requests received from `popup.js`.

### Message Insertion

The extension locates ChatGPT's message editor using CSS selectors.

It supports two types of input elements:

1. **Textarea** — Sets the text value and dispatches an input event.
2. **Contenteditable** — Selects existing editor content and inserts the new text.

When automatic submission is enabled, the extension attempts to locate and click ChatGPT's Send button.

## Limitations

- The extension only works when a ChatGPT tab is active.
- It does not currently support selecting conversations automatically.
- ChatGPT interface updates may require changes to the HTML selectors.
- Automatic submission depends on the Send button being available and enabled.
- Clicking Send does not guarantee that ChatGPT successfully received the message.
- The keyboard shortcut may conflict with existing Chrome shortcuts.
- The extension does not currently edit previously submitted messages.
- Automated use must comply with applicable service terms and restrictions.

## Privacy

- Prompts are stored locally using `chrome.storage.local`.
- The extension does not require users to provide passwords or authentication cookies.
- The extension uses the existing browser session to interact with ChatGPT.
- No separate backend server or OpenAI API key is required.

Prompts submitted to ChatGPT are processed according to OpenAI's applicable policies.

## Technologies Used

- JavaScript
- HTML
- CSS
- Chrome Extensions API (Manifest V3)

## Disclaimer

The extension interacts with ChatGPT's web interface and may require maintenance when the website changes.
