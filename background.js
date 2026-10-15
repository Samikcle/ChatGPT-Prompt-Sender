const DEFAULT_MESSAGE = "Explain what machine learning is.";

// Listen for keyboard shortcuts
chrome.commands.onCommand.addListener(async (command) => {
  if (command !== "send-prompt") return;

  try {
    const { savedMessage } = await chrome.storage.local.get(
      "savedMessage"
    );

    const message = savedMessage ?? DEFAULT_MESSAGE;

    const result = await runPrompt(message, true);
    console.log(result);
  } catch (error) {
    console.error("Shortcut failed:", error);
  }
});

// Find the active tab and execute the prompt
async function runPrompt(message, shouldSend = false) {
  if (!message.trim()) {
    return "Message is empty.";
  }

  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true
  });

  if (!tab?.id || !tab.url?.startsWith("https://chatgpt.com/")) {
    return "Please open a ChatGPT tab first.";
  }

  const results = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: insertMessage,
    args: [message, shouldSend]
  });

  return results[0]?.result ?? "No result returned.";
}

// Runs inside the ChatGPT webpage
function insertMessage(message, shouldSend) {
  const editor = document.querySelector(
    '#mobile-composer-prompt, ' +
    '#prompt-textarea, ' +
    '[contenteditable="true"][aria-label="Ask ChatGPT"]'
  );

  if (!editor) {
    return "ChatGPT message box not found.";
  }

  editor.focus();

  // Handle textarea
  if (editor instanceof HTMLTextAreaElement) {
    const setter = Object.getOwnPropertyDescriptor(
      HTMLTextAreaElement.prototype,
      "value"
    ).set;

    setter.call(editor, message);

    editor.dispatchEvent(
      new Event("input", { bubbles: true })
    );

  // Handle contenteditable editor
  } else if (editor.isContentEditable) {
    const selection = window.getSelection();
    const range = document.createRange();

    range.selectNodeContents(editor);
    selection.removeAllRanges();
    selection.addRange(range);

    const inserted = document.execCommand(
      "insertText",
      false,
      message
    );

    if (!inserted) {
      return "Could not insert text into the editor.";
    }
  } else {
    return "Unsupported message editor.";
  }

  if (!shouldSend) {
    return "Message inserted successfully.";
  }

  // Find ChatGPT's Send button
  const form = editor.closest("form");

  const sendButton = (
    form?.querySelector(
      'button[data-composer-submit], ' +
      'button[data-testid="send-button"]'
    ) ??
    document.querySelector(
      'button[data-testid="send-button"], ' +
      'button[data-composer-submit]'
    )
  );

  if (!sendButton) {
    return "Message inserted, but Send button not found.";
  }

  if (
    sendButton.disabled ||
    sendButton.getAttribute("aria-disabled") === "true"
  ) {
    return "Message inserted, but Send button is disabled.";
  }

  sendButton.click();

  return "Send button clicked.";
}

// Receive requests from popup.js
chrome.runtime.onMessage.addListener(
  (request, sender, sendResponse) => {
    if (request.type !== "RUN_PROMPT") return;

    runPrompt(request.message, request.shouldSend)
      .then(result => sendResponse({ result }))
      .catch(error => sendResponse({
        result: `Error: ${error.message}`
      }));

    return true;
  }
);
