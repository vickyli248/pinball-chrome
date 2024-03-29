// Define a global variable to store screenshots
var screenshotsList = [];
var doneScreenshotsList = [];

const screenshotButton = document.getElementById('captureBtn');
const inputField = document.getElementById('inputField');
const actionRow = document.getElementById('actionRow');
const clearBtn = document.getElementById('clearBtn');
const successMsg = document.getElementById('successMsg');
const clearConfirmation = document.getElementById('clearConfirmation');
const clearConfirmBtn = document.getElementById('clearConfirmBtn');
const abortClearBtn = document.getElementById('abortClearBtn');
const exportPinsBtn = document.getElementById('exportPinsBtn');

document.addEventListener('DOMContentLoaded', function() {
  inputField.focus();

  function takeScreenshot() {

    // Take the screenshot
    chrome.runtime.sendMessage({command: "takeScreenshot"});

    // // Calculate position for the popup
    // const buttonRect = captureBtn.getBoundingClientRect();
    // successMsg.style.top = buttonRect.bottom + 5 + 'px';
    // successMsg.style.right = buttonRect.top + 8 + 'px';

    // // Show the successMsg
    // successMsg.classList.remove('hidden');

    // // Hide the successMsg after 2 seconds
    // setTimeout(function() {
    //   successMsg.classList.add('hidden');
    // }, 2000);

  }

  screenshotButton.addEventListener('click', function() {
    takeScreenshot();
  });

  inputField.addEventListener('keydown', function(event) {

    // Check if the pressed key is 'enter' (key code 13)
    if (event.key === 'Enter') {
      takeScreenshot();
    }
  
  });

  clearBtn.addEventListener('click', function() {
    clearConfirmation.style.display = 'block';
  });

  abortClearBtn.addEventListener('click', function() {
    clearConfirmation.style.display = 'none';
  });

  clearConfirmBtn.addEventListener('click', function() {
    clearData();
    clearConfirmation.style.display = 'none';
  });

  document.getElementById('exportPinsBtn').addEventListener('click', function() {
    const pins = document.body;
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0'); // Month is zero-based
    const day = String(today.getDate()).padStart(2, '0');
    const hours = today.getHours() % 12 || 12; // Convert to 12-hour format
    const minutes = String(today.getMinutes()).padStart(2, '0');
    const ampm = today.getHours() >= 12 ? 'PM' : 'AM'; // Determine AM/PM
    const filename = `yourPins_${year}${month}${day}_${hours}${minutes}${ampm}.pdf`;  

    window.scrollTo(0, 0);
    setTimeout(() => {
      html2pdf().from(pins).set({
        // Remove headers and footers
        headers: null,
        footers: null,
        // Set html2canvas options to capture the entire content of the element
        html2canvas: {
          scrollY: -window.scrollY
        }
      }).save(filename);
    }, 300);

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
    var inputValue = '';

    if (document.getElementById('inputField').value.trim()) {
      inputValue = document.getElementById('inputField').value.trim();
    } else {
      inputValue = 'we saved this screenshot for you <3';
    }

    // Push the object to the pending screenshot list
    screenshotsList.push({id: screenshotId, url: screenshotUrl, caption: inputValue, checked: false});

    // Save screenshots to local storage 
    saveScreenshotAndCaption(screenshotId, screenshotUrl, inputValue, false, function() {
      // Await saveScreenshot function to resolve to load screenshot
      loadStoredScreenshots();
    });

    console.log("pending list", screenshotsList);

    inputField.value = ""; 
    inputField.focus();
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

    for (let i = screenshots.length - 1; i >= 0; i--) {
      const screenshot = screenshots[i];
      screenshotsList.push({id: screenshot.id, url: screenshot.url, caption: screenshot.caption, checked: screenshot.checked});
      
      // Display only pending screenshots
      if (!doneScreenshotsList.find(doneScreenshot => doneScreenshot.id === screenshot.id)) {
        var pin = document.createElement('div');
        pin.className = 'pin';
        pin.id = 'pin-' + screenshot.id;
    
        var pinContent = document.createElement('div');
        pinContent.className = 'pin-content';
        pin.appendChild(pinContent);
    
        var checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = screenshot.checked; 
        checkbox.className = 'pin-checkbox';
        pinContent.appendChild(checkbox);

        checkbox.addEventListener('change', function() {
          if (this.checked) {

            removeScreenshotAndCaption(screenshot.id);
            document.getElementById('actionRow').style.display = 'flex';

          }
        });
    
        var textElement = document.createElement('p');
        textElement.textContent = screenshot.caption;
        if (screenshot.caption === 'we saved this screenshot for you <3') {
          textElement.style.color = '#9c9c9c'
        }
        pinContent.appendChild(textElement);
    
        var img = document.createElement('img');
        img.src = screenshot.url;
        pin.appendChild(img);
    
        yourPins.appendChild(pin);
      }
    }
    if (screenshotsList.length > 0) {
      actionRow.style.display = 'flex';
    } else {
      actionRow.style.display = 'none';
    }
  });
}

function removeScreenshotAndCaption(screenshotId) {

  // Remove the pin element from the DOM
  var pinToRemove = document.getElementById('pin-' + screenshotId);
  if (pinToRemove) {
    pinToRemove.parentNode.removeChild(pinToRemove);
  }

  // Remove from local storage
  chrome.storage.local.get({screenshots: []}, function(data) {
    var updatedScreenshots = data.screenshots.filter(function(screenshot) {
      return screenshot.id !== screenshotId;
    });

    chrome.storage.local.set({screenshots: updatedScreenshots}, function() {
      console.log("Screenshot and caption removed.");
    });

    loadStoredScreenshots();
  });

  inputField.focus();

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

  loadStoredScreenshots();
  inputField.focus();
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
