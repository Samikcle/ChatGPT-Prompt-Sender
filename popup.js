const messageInput = document.getElementById("message");
const insertButton = document.getElementById("insertButton");
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

    status.textContent = response.result;

  } catch (error) {
    status.textContent = error.message;
  }
});

loadMessage();
