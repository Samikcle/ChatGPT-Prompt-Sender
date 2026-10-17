
# ChatGPT Prompt Sender

A lightweight Chrome extension that allows users to insert and send messages to ChatGPT using keyboard shortcuts.

The extension supports an editable main message and up to three additional predefined messages, each with its own keyboard shortcut.

It works directly within your existing Chrome browser session, without requiring the OpenAI API, browser automation frameworks, or a separate login session.

## Features

- **Keyboard Shortcuts** — Send messages to ChatGPT using configurable Chrome extension shortcuts.
- **Main Message** — Edit and save a message directly from the extension popup.
- **Three Predefined Messages** — Configure up to three additional messages, each assigned to a separate shortcut.
- **Settings Page** — Manage predefined messages through a dedicated configuration page.
- **Prompt Previews** — View your saved predefined messages directly in the extension popup.
- **Automatic Submission** — Automatically inserts and attempts to send the selected message.
- **Local Storage** — Saves messages using `chrome.storage.local`.
- **Status Badges** — Displays `OK` or `ERR` on the extension icon based on the operation result.
- **Existing Browser Session** — Uses your current ChatGPT session without accessing or transferring authentication cookies.
- **Multiple Editor Support** — Supports ChatGPT's textarea and contenteditable message editors.

## Project Structure

```text
ChatGPT-Prompt-Sender/
├── manifest.json       # Extension configuration, permissions, and shortcuts
├── popup.html          # Main extension popup interface
├── popup.js            # Popup interactions and message previews
├── background.js       # Keyboard shortcuts and ChatGPT automation
├── options.html        # Predefined message configuration page
├── options.js          # Loading and saving predefined messages
└── README.md           # Project documentation
```

## Installation

1. Download or clone this repository.
2. Open Google Chrome.
3. Navigate to `chrome://extensions/`.
4. Enable **Developer mode**.
5. Click **Load unpacked**.
6. Select the `ChatGPT-Prompt-Sender` folder.
7. The extension is now installed.

No additional dependencies, API keys, or build steps are required.

## Usage

### 1. Main Message

The extension popup contains a main text box for quickly entering and modifying a message.

1. Open [ChatGPT](https://chatgpt.com/) in Chrome.
2. Click the ChatGPT Prompt Sender extension icon.
3. Enter your message in the text box.
4. Click **Insert Message** to insert the text into ChatGPT without sending it.
5. Review and manually submit the message.

The message is automatically saved when modified and restored the next time the popup is opened.

Alternatively, use the original keyboard shortcut to insert and attempt to send the saved message automatically.

### 2. Predefined Messages

The extension supports up to three additional predefined messages.

To configure them:

1. Open the extension popup.
2. Click **Configure Predefined Messages**.
3. A separate settings page will open.
4. Enter the desired text for Message 1, Message 2, and Message 3.
5. Click **Save Messages**.

The messages are stored locally and remain available after restarting Chrome.

Each predefined message can be sent independently through its assigned keyboard shortcut.

Empty predefined messages are allowed, but attempting to send an unconfigured message will produce an error.

### 3. Keyboard Shortcuts

The extension defines four keyboard commands:

| Shortcut | Action |
|----------|--------|
| `Ctrl + Shift + R` | Send the saved main message |
| `Ctrl + Shift + 1` | Send predefined message 1 |
| `Ctrl + Shift + 2` | Send predefined message 2 |
| `Ctrl + Shift + 3` | Send predefined message 3 |

To use a shortcut:

1. Open ChatGPT in the active browser tab.
2. Ensure the intended message has been saved.
3. Press the corresponding keyboard shortcut.
4. The extension inserts the selected message and attempts to submit it automatically.

**Important:** Some shortcuts may conflict with Chrome's built-in shortcuts. For example, `Ctrl + Shift + R` is commonly used for hard refresh.

Chrome may reject conflicting shortcuts or leave them unassigned.

To check or modify the shortcuts:

1. Navigate to `chrome://extensions/shortcuts`.
2. Find **ChatGPT Prompt Sender**.
3. Verify or modify the keyboard shortcuts.

The configured Chrome shortcuts take precedence over the suggested combinations listed above.

### 4. Message Previews

The popup displays all three predefined messages below the main text box.

Each preview includes:

- The message number.
- Its suggested keyboard shortcut.
- A shortened preview of the saved message.

If a message has not been configured, the popup displays `Not configured`.

The previews are updated when the saved predefined messages change.

### 5. Status Badges

The extension displays status badges on its toolbar icon.

| Badge | Color | Meaning |
|-------|-------|---------|
| `OK` | Green | Message insertion succeeded or the Send button was clicked |
| `ERR` | Red | An error occurred during the operation |

Possible errors include:

- No active browser tab.
- Active tab is not ChatGPT.
- Empty or unconfigured message.
- ChatGPT message editor not found.
- Message insertion failure.
- Composer form not found.
- Send button not found or unavailable.
- JavaScript execution failure.

The status badge remains visible until updated or cleared by Chrome.

**Note:** An `OK` badge indicates that the extension completed the requested browser interaction. It does not guarantee that ChatGPT successfully received or processed the message.

## How It Works

The extension is built using Chrome's Manifest V3 architecture.

### manifest.json

Defines the extension's metadata, permissions, background service worker, popup interface, settings page, and keyboard commands.

Required permissions:

- `activeTab` — Provides temporary access to the active tab following an extension invocation.
- `scripting` — Allows JavaScript execution inside the ChatGPT webpage.
- `storage` — Stores and retrieves saved messages.

The manifest also registers `background.js` and `options.html`.

### popup.html

Defines the main extension popup, including:

- The editable main message box.
- The **Insert Message** button.
- The operation status display.
- Three predefined message previews.
- The **Configure Predefined Messages** button.

### popup.js

Handles the popup functionality:

- Loads the previously saved main message.
- Automatically saves changes to the main message.
- Retrieves and displays the three predefined messages.
- Updates previews when extension storage changes.
- Opens the configuration page using `chrome.runtime.openOptionsPage()`.
- Sends insertion requests to the background service worker using `chrome.runtime.sendMessage()`.

### options.html

Defines the separate configuration page containing three editable textareas and a **Save Messages** button.

Each textarea corresponds to one predefined message and its keyboard shortcut.

### options.js

Manages predefined message configuration:

- Loads previously stored predefined messages.
- Populates the three textareas.
- Collects the text from all three inputs.
- Saves the messages as an array using `chrome.storage.local`.
- Displays success or error messages after saving.

The messages are only saved when the user clicks **Save Messages**.

### background.js

Contains the main automation logic.

Its responsibilities include:

1. Listening for registered keyboard shortcuts using `chrome.commands`.
2. Determining which stored message corresponds to the triggered command.
3. Retrieving the message using `chrome.storage.local`.
4. Identifying the active ChatGPT tab.
5. Executing the message insertion function using `chrome.scripting.executeScript()`.
6. Locating a visible ChatGPT message editor.
7. Inserting and verifying the message.
8. Waiting for an enabled Send button when automatic submission is requested.
9. Clicking the Send button.
10. Updating the extension icon badge to indicate success or failure.

All four keyboard commands share the same `runPrompt()` and `insertMessage()` functions.

## Message Storage

The extension uses two separate storage keys.

### Main Message

```javascript
{
  savedMessage: "Explain what machine learning is."
}
```

This stores the content of the original popup text box.

### Predefined Messages

```javascript
{
  predefinedMessages: [
    "Summarize the following text.",
    "Translate the following into Japanese.",
    "Explain this code step by step."
  ]
}
```

The predefined messages are stored as an array.

Their array indexes correspond to the keyboard shortcuts:

| Array Index | Message | Shortcut |
|-------------|---------|----------|
| `0` | Message 1 | Ctrl + Shift + 1 |
| `1` | Message 2 | Ctrl + Shift + 2 |
| `2` | Message 3 | Ctrl + Shift + 3 |

The main message and the three predefined messages are stored independently.

## ChatGPT Automation

### Editor Detection

The extension searches for supported ChatGPT editors using CSS selectors:

```javascript
'#mobile-composer-prompt, ' +
'#prompt-textarea, ' +
'[contenteditable="true"][aria-label="Ask ChatGPT"]'
```

It filters out hidden editors and currently prefers the last visible matching editor.

### Message Insertion

The insertion process depends on the editor type.

**Textarea:**

Uses the native textarea value setter and dispatches an input event.

**Contenteditable:**

Focuses the editor, selects its existing contents, and attempts to insert the message using `document.execCommand("insertText")`.

The extension then checks whether the inserted text matches the intended message.

### Automatic Submission

When submission is requested, the extension:

1. Finds the form containing the selected editor.
2. Searches for a supported Send button.
3. Uses `MutationObserver` to detect changes to the form.
4. Waits for the Send button to become available and enabled.
5. Clicks the Send button.

This is necessary because ChatGPT may display a Voice button when the message editor is empty and change it to Send after text is inserted.

The extension currently waits up to three seconds for the Send button.

## Limitations

- The extension operates on the currently active ChatGPT tab.
- It does not automatically navigate to specific conversations.
- Shortcut availability depends on Chrome and operating system restrictions.
- ChatGPT interface changes may require updates to the CSS selectors.
- The editor-selection strategy may not always select the intended editor when multiple composers are visible.
- Automatic submission depends on ChatGPT responding correctly to programmatic text insertion.
- The extension does not independently verify successful message delivery.
- The extension currently supports a maximum of three additional predefined messages.
- Editing previously submitted messages is not supported.
- `document.execCommand()` is deprecated and may require replacement in the future.
- Some logged-out ChatGPT interactions may require authentication or may behave differently.

## Privacy

- Messages are stored locally using `chrome.storage.local`.
- The extension does not require an OpenAI API key.
- The extension does not intentionally read or export authentication cookies.
- No external backend server is required.
- Messages submitted to ChatGPT are processed according to OpenAI's applicable policies.

## Technologies Used

- JavaScript
- HTML
- CSS
- Chrome Extensions API
- Manifest V3
- Chrome Storage API
- Chrome Commands API
- Chrome Scripting API
- DOM APIs
- MutationObserver

## Disclaimer

The extension interacts with ChatGPT's web interface and may require maintenance when the website changes.
