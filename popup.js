// For shit that listens to and changes the popup html contents

document.addEventListener('DOMContentLoaded', function() {
  var screenshotButton = document.getElementById('captureBtn');
  screenshotButton.addEventListener('click', function() {
    chrome.runtime.sendMessage({command: "takeScreenshot"});
  });
});

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  if (message.command === "updateScreenshot") {
    var screenshotUrl = message.screenshotUrl;
    var yourPins = document.getElementById('yourPins');
    var img = document.createElement('img');
    img.src = screenshotUrl;
    yourPins.appendChild(img);

        // Get the input field value
        var inputValue = document.getElementById('inputField').value.trim();

        // Append the input field value as text below the screenshot
        var textElement = document.createElement('p');
        textElement.textContent = inputValue;
        yourPins.appendChild(textElement);
    
  }
});
