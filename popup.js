// Define a global variable to store screenshots
var screenshotsList = [];
var doneScreenshotsList = [];

document.addEventListener('DOMContentLoaded', function() {
  var screenshotButton = document.getElementById('captureBtn');
  var inputField = document.getElementById('inputField');
  var clearBtn = document.getElementById('clearBtn');

  inputField.focus();

  screenshotButton.addEventListener('click', function() {
    chrome.runtime.sendMessage({command: "takeScreenshot"});
  });

  clearBtn.addEventListener('click', function() {
    clearData();
  });

  loadStoredScreenshots();
});


chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  if (message.command === "updateScreenshotList") {
    // Grab the screenshot ID
    var screenshotId = Date.now().toString();

    // Grab the screenshotURL
    var screenshotUrl = message.screenshotUrl;

    // Grab the caption text
    var inputValue = document.getElementById('inputField').value.trim();

    // Push the object to the pending screenshot list
    screenshotsList.push({id: screenshotId, url: screenshotUrl, caption: inputValue, checked: false});

    // Save screenshots to local storage 
    saveScreenshotAndCaption(screenshotId, screenshotUrl, inputValue, false, function() {
      // Await saveScreenshot function to resolve to load screenshot
      loadStoredScreenshots();
    });

    console.log("pending list", screenshotsList);
  }
});

function saveScreenshotAndCaption(screenshotId, screenshotUrl, caption, shouldLoadStoredScreenshots = true, callback) {
  chrome.storage.local.get({screenshots: []}, function(data) {
    var screenshots = data.screenshots;
    screenshots.push({id: screenshotId, url: screenshotUrl, caption: caption});
    chrome.storage.local.set({screenshots: screenshots}, function() {
      console.log("Screenshot and caption saved.");
      if (shouldLoadStoredScreenshots) {
        loadStoredScreenshots();
      }
      if (typeof callback === 'function') {
        callback();
      }
    });
  });
}

function loadStoredScreenshots() {
  chrome.storage.local.get({screenshots: []}, function(data) {
    var screenshots = data.screenshots;
    console.log("load screenshot func screenshots", screenshots);
    var yourPins = document.getElementById('yourPins');
    yourPins.innerHTML = ''; // Clear previous content

    screenshotsList = []; // Clear screenshotsList before loading stored screenshots

    screenshots.forEach(function(screenshot) {
      screenshotsList.push({id: screenshot.id, url: screenshot.url, caption: screenshot.caption, checked: screenshot.checked});
      // Display only pending screenshots
      if (!doneScreenshotsList.find(doneScreenshot => doneScreenshot.id === screenshot.id)) {
        var pin = document.createElement('div');
        pin.className = 'pin';

        var pinContent = document.createElement('div');
        pinContent.className = 'pin-content';
        pin.appendChild(pinContent);

        var checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = screenshot.checked; 
        checkbox.className = 'pin-checkbox';
        pinContent.appendChild(checkbox);

        var textElement = document.createElement('p');
        textElement.textContent = screenshot.caption;
        pinContent.appendChild(textElement);

        var img = document.createElement('img');
        img.src = screenshot.url;
        pin.appendChild(img);

        yourPins.appendChild(pin);

        // restoreCheckboxState(screenshot.url);
      }
    });
  });
}

function moveScreenshotToDone(screenshotUrl) {
  var screenshotIndex = screenshotsList.findIndex(function(item) {
    return item.url === screenshotUrl;
  });

  if (screenshotIndex !== -1) {
    var screenshot = screenshotsList[screenshotIndex];
    screenshotsList.splice(screenshotIndex, 1);
    doneScreenshotsList.push(screenshot);

    // Update storage
    chrome.storage.local.set({screenshots: screenshotsList}, function() {
      console.log("Screenshot moved to done.");
      // Reload stored screenshots
      loadStoredScreenshots();
    });
  }
}


function moveScreenshotToPending(screenshotUrl) {
  var screenshotIndex = doneScreenshotsList.findIndex(function(item) {
    return item.url === screenshotUrl;
  });

  if (screenshotIndex !== -1) {
    var screenshot = doneScreenshotsList[screenshotIndex];
    doneScreenshotsList.splice(screenshotIndex, 1);
    screenshotsList.push(screenshot);

    // Update storage
    chrome.storage.local.set({screenshots: screenshotsList}, function() {
      console.log("Screenshot moved back to pending.");
    });
  }
}

function clearData() {
  chrome.storage.local.set({screenshots: []}, function() {
    console.log("Storage cleared.");
  });

  var yourPins = document.getElementById('yourPins');
  yourPins.innerHTML = ''

  // Clear global screenshotsList and doneScreenshotsList
  screenshotsList = [];
  doneScreenshotsList = [];
}

// function saveCheckboxState(screenshotUrl, isChecked) {
//   chrome.storage.local.get({checkboxStates: {}}, function(data) {
//     var checkboxStates = data.checkboxStates;
//     checkboxStates[screenshotUrl] = isChecked;
//     chrome.storage.local.set({checkboxStates: checkboxStates}, function() {
//       console.log("Checkbox state saved.");
//     });
//   });
// }

// function restoreCheckboxState(screenshotUrl) {
//   chrome.storage.local.get({checkboxStates: {}}, function(data) {
//     var checkboxStates = data.checkboxStates;
//     var isChecked = checkboxStates[screenshotUrl];
//     if (isChecked !== undefined) {
//       var checkbox = document.querySelector('img[src="' + screenshotUrl + '"] ~ .pin-checkbox');
//       if (checkbox) {
//         checkbox.checked = isChecked;
//       }
//     }
//   });
// }
