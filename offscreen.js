chrome.runtime.onMessage.addListener(
  (request, sender, sendResponse) => {
    if (
      request.target !== "offscreen" ||
      request.type !== "READ_CLIPBOARD"
    ) {
      return;
    }

    (async () => {
      try {
        const buffer = document.getElementById(
          "clipboardBuffer"
        );

        buffer.value = "";
        buffer.focus();
        buffer.select();

        const success = document.execCommand("paste");

        if (!success) {
          throw new Error(
            "Browser did not permit clipboard paste."
          );
        }

        sendResponse({
          success: true,
          text: buffer.value
        });

      } catch (error) {
        sendResponse({
          success: false,
          error: error.message
        });
      }
    })();

    return true;
  }
);
