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
  try {
    let message;

    if (command === "send-prompt") {
      // Original shortcut: use the popup textbox
      const data = await chrome.storage.local.get(
        "savedMessage"
      );

      message = data.savedMessage ?? DEFAULT_MESSAGE;

    } else if (
      command === "send-prompt-1" ||
      command === "send-prompt-2" ||
      command === "send-prompt-3"
    ) {
      // Convert command name into array index
      const index = Number(command.at(-1)) - 1;

      const { predefinedMessages = [] } =
        await chrome.storage.local.get(
          "predefinedMessages"
        );

      message = predefinedMessages[index] ?? "";

    } else {
      return;
    }

    const result = await runPrompt(message, true);
    console.log(`${command}: ${result}`);

  } catch (error) {
    console.error("Shortcut failed:", error);

    try {
      await setBadge(null, "ERR", "#C62828");
    } catch (badgeError) {
      console.error("Badge update failed:", badgeError);
    }
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
      throw new Error("Message is empty or not configured.");
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
    console.error("Prompt automation failed:", error);

    try {
      await setBadge(tabId, "ERR", "#C62828");
    } catch (badgeError) {
      console.error("Badge update failed:", badgeError);
    }

    return `Error: ${error.message}`;
  }
}

// Runs inside the ChatGPT webpage
async function insertMessage(message, shouldSend) {
  try {
    // Find supported ChatGPT editors
    const editors = document.querySelectorAll(
      '#mobile-composer-prompt, ' +
      '#prompt-textarea, ' +
      '[contenteditable="true"][aria-label="Ask ChatGPT"]'
    );

    // Only consider visible editors
    const visibleEditors = [...editors].filter((element) => {
      const style = window.getComputedStyle(element);

      return (
        element.getClientRects().length > 0 &&
        style.visibility !== "hidden" &&
        style.display !== "none"
      );
    });

    // Prefer the last visible composer
    const editor = visibleEditors.at(-1);

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

    // Verify the text was inserted
    const insertedText =
      editor instanceof HTMLTextAreaElement
        ? editor.value
        : editor.innerText;

    if (insertedText.trim() !== message.trim()) {
      throw new Error("Message insertion could not be verified.");
    }

    // Popup button: insert only
    if (!shouldSend) {
      return {
        success: true,
        message: "Message inserted successfully."
      };
    }

    // Find the composer containing this editor
    const form = editor.closest("form");

    if (!form) {
      throw new Error("ChatGPT composer form not found.");
    }

    // Wait for Send button to appear and become enabled
    const sendButton = await new Promise((resolve, reject) => {
      const selector =
        'button[aria-label="Send"], ' +
        'button[data-testid="send-button"], ' +
        'button[data-composer-submit]';

      let observer;
      let timeoutId;

      function cleanup() {
        observer?.disconnect();
        clearTimeout(timeoutId);
      }

      function checkButton() {
        const buttons = form.querySelectorAll(selector);

        for (const button of buttons) {
          const style = window.getComputedStyle(button);

          if (
            button.getClientRects().length > 0 &&
            style.visibility !== "hidden" &&
            style.display !== "none" &&
            !button.disabled &&
            button.getAttribute("aria-disabled") !== "true"
          ) {
            cleanup();
            resolve(button);
            return;
          }
        }
      }

      observer = new MutationObserver(checkButton);

      observer.observe(form, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: [
          "disabled",
          "aria-disabled",
          "hidden",
          "style",
          "class",
          "aria-label"
        ]
      });

      timeoutId = setTimeout(() => {
        cleanup();
        reject(new Error("Send button not available."));
      }, 3000);

      checkButton();
    });

    // Click the Send button
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
