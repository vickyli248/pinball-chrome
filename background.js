// worker stuff, fancy functions, throws messages back to popup.js

chrome.runtime.onInstalled.addListener(() => {
    console.log('Extension installed');
});

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    if (message.command === "takeScreenshot") {
      chrome.tabs.captureVisibleTab(function(screenshotUrl) {
        chrome.runtime.sendMessage({command: "updateScreenshot", screenshotUrl: screenshotUrl});
      });
    }
  });  