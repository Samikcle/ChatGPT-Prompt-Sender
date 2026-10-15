const DEFAULT_MESSAGE = "Explain what machine learning is.";

// Display the extension badge
async function setBadge(tabId, text, color) {
  const target = tabId == null ? {} : { tabId };

  await chrome.action.setBadgeText({
    ...target,
    text
  });

  await chrome.action.setBadgeBackgroundColor({
    ...target,
    color
  });
}

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
    await setBadge(null, "ERR", "#C62828");
  }
});

// Find the active tab and execute the prompt
async function runPrompt(message, shouldSend = false) {
  let tabId;

  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true
    });

    tabId = tab?.id;

    if (tabId == null) {
      throw new Error("Active browser tab not found.");
    }

    if (typeof message !== "string" || !message.trim()) {
      throw new Error("Message is empty.");
    }

    if (!tab.url?.startsWith("https://chatgpt.com/")) {
      throw new Error("Please open a ChatGPT tab first.");
    }

    const results = await chrome.scripting.executeScript({
      target: { tabId },
      func: insertMessage,
      args: [message, shouldSend]
    });

    const result = results[0]?.result;

    if (!result) {
      throw new Error("No result returned.");
    }

    if (!result.success) {
      throw new Error(result.message);
    }

    await setBadge(tabId, "OK", "#16803C");

    return result.message;

  } catch (error) {
    await setBadge(tabId, "ERR", "#C62828");

    console.error("Prompt automation failed:", error);

    return `Error: ${error.message}`;
  }
}

// Runs inside the ChatGPT webpage
function insertMessage(message, shouldSend) {
  try {
    const editor = document.querySelector(
      '#mobile-composer-prompt, ' +
      '#prompt-textarea, ' +
      '[contenteditable="true"][aria-label="Ask ChatGPT"]'
    );

    if (!editor) {
      throw new Error("ChatGPT message box not found.");
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
        throw new Error("Could not insert text into the editor.");
      }
    } else {
      throw new Error("Unsupported message editor.");
    }

    if (!shouldSend) {
      return {
        success: true,
        message: "Message inserted successfully."
      };
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
      throw new Error("Message inserted, but Send button not found.");
    }

    if (
      sendButton.disabled ||
      sendButton.getAttribute("aria-disabled") === "true"
    ) {
      throw new Error("Message inserted, but Send button is disabled.");
    }

    sendButton.click();

    return {
      success: true,
      message: "Send button clicked."
    };

  } catch (error) {
    return {
      success: false,
      message: error.message
    };
  }
}

// Receive requests from popup.js
chrome.runtime.onMessage.addListener(
  (request, sender, sendResponse) => {
    if (request.type !== "RUN_PROMPT") return;

    runPrompt(request.message, request.shouldSend)
      .then(result => sendResponse({ result }))
      .catch(async (error) => {
        await setBadge(null, "ERR", "#C62828");

        sendResponse({
          result: `Error: ${error.message}`
        });
      });

    return true;
  }
);
