const promptInputs = [
  document.getElementById("prompt1"),
  document.getElementById("prompt2"),
  document.getElementById("prompt3")
];

const saveButton = document.getElementById("saveButton");
const status = document.getElementById("status");

// Load previously saved predefined messages
async function loadPredefinedMessages() {
  try {
    const { predefinedMessages = [] } =
      await chrome.storage.local.get("predefinedMessages");

    for (let i = 0; i < 3; i++) {
      promptInputs[i].value = predefinedMessages[i] || "";
    }
  } catch (error) {
    status.textContent = `Error: ${error.message}`;
  }
}

// Save all three predefined messages
saveButton.addEventListener("click", async () => {
  const predefinedMessages = promptInputs.map(
    input => input.value
  );

  try {
    await chrome.storage.local.set({
      predefinedMessages
    });

    status.textContent = "Messages saved successfully.";
  } catch (error) {
    status.textContent = `Error: ${error.message}`;
  }
});

// Load saved messages when the page opens
loadPredefinedMessages();
