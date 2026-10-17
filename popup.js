const messageInput = document.getElementById("message");
const insertButton = document.getElementById("insertButton");
const configureButton = document.getElementById("configureButton");
const status = document.getElementById("status");

// Load the previously saved prompt
async function loadMessage() {
  const { savedMessage } = await chrome.storage.local.get(
    "savedMessage"
  );

  if (savedMessage !== undefined) {
    messageInput.value = savedMessage;
  }
}

// Display the three predefined messages
async function loadPredefinedMessages() {
  const { predefinedMessages = [] } =
    await chrome.storage.local.get("predefinedMessages");

  for (let i = 0; i < 3; i++) {
    const preview = document.getElementById(
      `preview${i + 1}`
    );

    const message = predefinedMessages[i] || "";

    preview.textContent = message.trim()
      ? message
      : "Not configured";
  }
}

// Save the prompt whenever it changes
messageInput.addEventListener("input", async () => {
  await chrome.storage.local.set({
    savedMessage: messageInput.value
  });
});

// Insert message when the popup button is clicked
insertButton.addEventListener("click", async () => {
  const message = messageInput.value.trim();

  if (!message) {
    status.textContent = "Please enter a message.";
    return;
  }

  try {
    await chrome.storage.local.set({
      savedMessage: message
    });

    const response = await chrome.runtime.sendMessage({
      type: "RUN_PROMPT",
      message: message,
      shouldSend: false
    });

    status.textContent = response?.result ?? "No response received.";

  } catch (error) {
    status.textContent = error.message;
  }
});

// Open the settings page in a new browser tab
configureButton.addEventListener("click", async () => {
  try {
    await chrome.runtime.openOptionsPage();
  } catch (error) {
    status.textContent = `Error: ${error.message}`;
  }
});

// Refresh previews when saved prompts change
chrome.storage.onChanged.addListener((changes, area) => {
  if (
    area === "local" &&
    changes.predefinedMessages
  ) {
    loadPredefinedMessages();
  }
});

loadMessage();
loadPredefinedMessages();
