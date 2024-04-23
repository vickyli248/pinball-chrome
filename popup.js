// Define a global variable to store screenshots
var screenshotsList = []
var doneScreenshotsList = []
var showingTrash = false

const captureBtn = document.getElementById('captureBtn')
const inputField = document.getElementById('inputField')
const actionRow = document.getElementById('actionRow')
const clearBtn = document.getElementById('clearBtn')
const successMsg = document.getElementById('successMsg')
const clearConfirmation = document.getElementById('clearConfirmation')
const clearConfirmBtn = document.getElementById('clearConfirmBtn')
const abortClearBtn = document.getElementById('abortClearBtn')
const exportPinsBtn = document.getElementById('exportPinsBtn')
const seeTrashBtn = document.getElementById('seeTrashBtn')
const pinsEmptyState = document.getElementById('pinsEmptyState')
const pinHeaderText = document.getElementById('pinHeaderText')

document.addEventListener('DOMContentLoaded', function () {
    inputField.focus()

    let capturingScreenshot = false

    function takeScreenshot() {
        if (!capturingScreenshot) {
            capturingScreenshot = true
            chrome.tabs.captureVisibleTab(null, {}, function (screenshotUrl) {
                chrome.runtime.sendMessage({ command: 'takeScreenshot' })
                capturingScreenshot = false
            })
        }
    }

    document
        .getElementById('captureBtn')
        .addEventListener('click', takeScreenshot)

    inputField.addEventListener('keydown', function (event) {
        // Check if the pressed key is 'enter' (key code 13)
        if (event.key === 'Enter') {
            takeScreenshot()
        }
    })

    seeTrashBtn.addEventListener('click', function () {
        showingTrash = !showingTrash
        console.log(showingTrash)

        if (showingTrash) {
            loadTrash()
        } else {
            loadStoredScreenshots()
        }
    })

    clearBtn.addEventListener('click', function () {
        clearConfirmation.style.display = 'block'
    })

    abortClearBtn.addEventListener('click', function () {
        clearConfirmation.style.display = 'none'
    })

    clearConfirmBtn.addEventListener('click', function () {
        clearData()
        clearConfirmation.style.display = 'none'
    })

    document
        .getElementById('exportPinsBtn')
        .addEventListener('click', function () {
            exportPins()
        })

    loadStoredScreenshots()
})

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    if (message.command === 'updateScreenshotList') {
        // Grab the screenshot ID
        var screenshotId = Date.now().toString()

        // Grab the screenshotURL
        var screenshotUrl = message.screenshotUrl

        // Grab the caption text
        var inputValue = ''

        if (document.getElementById('inputField').value.trim()) {
            inputValue = document.getElementById('inputField').value.trim()
        } else {
            inputValue = 'we saved this screenshot for you <3'
        }

        // Push the object to the pending screenshot list
        screenshotsList.push({
            id: screenshotId,
            url: screenshotUrl,
            caption: inputValue,
            checked: false,
        })

        // Save screenshots to local storage
        saveScreenshotAndCaption(
            screenshotId,
            screenshotUrl,
            inputValue,
            false,
            function () {
                // Await saveScreenshot function to resolve to load screenshot
                loadStoredScreenshots()
            },
        )

        console.log('pending list', screenshotsList)

        inputField.value = ''
        inputField.focus()
    }
})

function saveScreenshotAndCaption(
    screenshotId,
    screenshotUrl,
    caption,
    callback,
) {
    chrome.storage.local.get({ screenshots: [] }, function (data) {
        var screenshots = data.screenshots
        screenshots.push({
            id: screenshotId,
            url: screenshotUrl,
            caption: caption,
        })
        chrome.storage.local.set({ screenshots: screenshots }, function () {
            console.log('Screenshot and caption saved.')
            loadStoredScreenshots()

            if (typeof callback === 'function') {
                callback()
            }
        })
    })
}

// Function to save the edited content
function saveEditedContent(screenshotId, editedContent) {
    chrome.storage.local.get({ screenshots: [] }, function (data) {
        var screenshots = data.screenshots

        // Find the screenshot with the specified ID
        var screenshotIndex = screenshots.findIndex(function (item) {
            return item.id === screenshotId
        })

        if (screenshotIndex !== -1) {
            // Update the caption of the screenshot
            screenshots[screenshotIndex].caption = editedContent

            // Save the updated list of screenshots back to the local storage
            chrome.storage.local.set({ screenshots: screenshots }, function () {
                console.log(
                    'Edited content saved for screenshot with ID:',
                    screenshotId,
                )
            })
        } else {
            console.log('Screenshot with ID', screenshotId, 'not found.')
        }
    })

    // Implement your save functionality here
    console.log('Edited content saved for screenshot with ID:', screenshotId)
}

function loadStoredScreenshots() {
    chrome.storage.local.get({ screenshots: [] }, function (data) {
        var screenshots = data.screenshots
        console.log('load screenshot func screenshots', screenshots)
        var yourPins = document.getElementById('yourPins')
        yourPins.innerHTML = '' // Clear previous content

        screenshotsList = [] // Clear screenshotsList before loading stored screenshots

        for (let i = screenshots.length - 1; i >= 0; i--) {
            const screenshot = screenshots[i]
            screenshotsList.push({
                id: screenshot.id,
                url: screenshot.url,
                caption: screenshot.caption,
                checked: screenshot.checked,
            })

            // Display only pending screenshots
            var pin = document.createElement('div')
            pin.className = 'pin'
            pin.id = 'pin-' + screenshot.id

            var pinContent = document.createElement('div')
            pinContent.className = 'pin-content'
            pinContent.style.width = '100%'
            pin.appendChild(pinContent)

            var checkbox = document.createElement('input')
            checkbox.type = 'checkbox'
            checkbox.checked = screenshot.checked
            checkbox.className = 'pin-checkbox'
            pinContent.appendChild(checkbox)

            checkbox.addEventListener('change', function () {
                if (this.checked) {
                    removeScreenshotAndCaption(screenshot.id)
                    document.getElementById('actionRow').style.display = 'flex'
                }
            })

            var textWrapper = document.createElement('div')
            textWrapper.style.display = 'flex' // Set display flex for the text and edit button
            textWrapper.style.alignItems = 'center' // Align items in the center
            textWrapper.style.width = '100%'
            pinContent.appendChild(textWrapper)

            var textElement = document.createElement('p')
            textElement.textContent = screenshot.caption
            if (screenshot.caption === 'we saved this screenshot for you <3') {
                textElement.style.color = '#9c9c9c'
            }
            textElement.style.marginRight = 'auto'
            textWrapper.appendChild(textElement)

            // Add event listener for keydown event on the editable text element
            textElement.addEventListener('keydown', function (event) {
                // Check if the Enter key is pressed
                if (event.keyCode === 13) {
                    // Prevent the default behavior of the Enter key (avoid line breaks)
                    event.preventDefault()
                    // Save the edited content
                    saveEditedContent(screenshot.id, textElement.textContent)
                    // Make the text content non-editable again
                    textElement.contentEditable = false
                }
            })

            var editButton = document.createElement('button')
            editButton.className = 'edit-button'
            editButton.style.backgroundColor = '#ffffff'
            editButton.style.border = 'none'
            editButton.style.cursor = 'pointer'
            editButton.onclick = function () {
                // Make text content editable
                textElement.contentEditable = true
                // Focus on the text element to allow editing
                textElement.focus()
                // Implement your edit functionality here
                console.log('Edit button clicked for:', screenshot.caption)
            }
            textWrapper.appendChild(editButton)

            var editIcon = document.createElement('img')
            editIcon.src = 'edit-icon.svg' // Replace 'edit-icon.png' with the path to your icon image
            editIcon.alt = 'Edit'
            editIcon.style.border = 'none'
            editIcon.style.borderRadius = '0'
            editIcon.style.width = '15px'
            editIcon.style.height = '15px'
            editIcon.style.fill = 'red'
            editButton.appendChild(editIcon)

            var img = document.createElement('img')
            img.src = screenshot.url
            pin.appendChild(img)

            yourPins.appendChild(pin)
        }
        if (screenshotsList.length > 0) {
            pinsEmptyState.style.display = 'none'
        } else {
            pinsEmptyState.style.display = 'flex'
        }
        seeTrashBtn.textContent = 'See resolved pins'
        if (screenshotsList.length === 1) {
            pinHeaderText.textContent = `You have ${screenshotsList.length} open pin`
        } else {
            pinHeaderText.textContent = `You have ${screenshotsList.length} open pins`
        }
        pinsEmptyState.textContent = "hmmm nothing yet... let's get pinning!"
        showingTrash = false
    })
}

function loadTrash() {
    seeTrashBtn.textContent = 'See open pins'
    pinHeaderText.textContent = 'You got these done!'
    pinsEmptyState.textContent =
        'You have nothing here! Go complete something. Unless you already deleted them, in which case, good work!'
    showingTrash = true

    chrome.storage.local.get({ trash: [] }, function (data) {
        var trashes = data.trash
        console.log('load trash', trashes)
        var yourPins = document.getElementById('yourPins')
        yourPins.innerHTML = '' // Clear previous content

        trashList = [] // Clear trashList before loading stored screenshots

        for (let i = trashes.length - 1; i >= 0; i--) {
            const trash = trashes[i]
            console.log('test trash', i, trashes[i])
            trashList.push({
                id: trash.id,
                url: trash.url,
                caption: trash.caption,
                checked: trash.checked,
            })

            // Display only pending trashes
            var pin = document.createElement('div')
            pin.className = 'pin'
            pin.id = 'pin-' + trash.id

            var pinContent = document.createElement('div')
            pinContent.className = 'pin-content'
            pin.appendChild(pinContent)

            var deletePinBtn = document.createElement('button')
            deletePinBtn.id = 'deletePinBtn'
            deletePinBtn.textContent = 'x'
            pinContent.appendChild(deletePinBtn)

            deletePinBtn.addEventListener('click', function () {
                console.log('detlte here')
                deleteForever(trash.id)
            })

            var textElement = document.createElement('p')
            textElement.textContent = trash.caption
            if (trash.caption === 'we saved this screenshot for you <3') {
                textElement.style.color = '#9c9c9c'
            }
            pinContent.appendChild(textElement)

            var img = document.createElement('img')
            img.src = trash.url
            pin.appendChild(img)

            yourPins.appendChild(pin)
        }
        if (trashList.length > 0) {
            pinsEmptyState.style.display = 'none'
        } else {
            pinsEmptyState.style.display = 'flex'
        }
    })
}

function removeScreenshotAndCaption(screenshotId) {
    // Remove the pin element from the DOM
    var pinToRemove = document.getElementById('pin-' + screenshotId)
    if (pinToRemove) {
        pinToRemove.parentNode.removeChild(pinToRemove)
    }

    // Remove from local storage
    chrome.storage.local.get({ screenshots: [], trash: [] }, function (data) {
        var updatedScreenshots = data.screenshots.filter(function (screenshot) {
            return screenshot.id !== screenshotId
        })

        // Move the screenshot to the trash list
        var trashItem = data.screenshots.find(function (screenshot) {
            return screenshot.id === screenshotId
        })

        // Add the screenshot to the trash list
        data.trash.push(trashItem)
        console.log('trash', data.trash)

        chrome.storage.local.set(
            { screenshots: updatedScreenshots, trash: data.trash },
            function () {
                console.log('Screenshot moved to trash.')
            },
        )

        loadStoredScreenshots()
    })
}

function deleteForever(trashId) {
    // Remove the pin element from the DOM
    var pinToRemove = document.getElementById('pin-' + trashId)
    if (pinToRemove) {
        pinToRemove.parentNode.removeChild(pinToRemove)
    }

    // Remove from local storage
    chrome.storage.local.get({ trash: [] }, function (data) {
        var updatedTrash = data.trash.filter(function (trash) {
            return trash.id !== trashId
        })

        chrome.storage.local.set({ trash: updatedTrash }, function () {
            console.log('Screenshot deleted forever.')
        })

        loadTrash()
    })

    inputField.focus()
}

function moveScreenshotToDone(screenshotUrl) {
    var screenshotIndex = screenshotsList.findIndex(function (item) {
        return item.url === screenshotUrl
    })

    if (screenshotIndex !== -1) {
        var screenshot = screenshotsList[screenshotIndex]
        screenshotsList.splice(screenshotIndex, 1)
        doneScreenshotsList.push(screenshot)

        // Update storage
        chrome.storage.local.set({ screenshots: screenshotsList }, function () {
            console.log('Screenshot moved to done.')
            // Reload stored screenshots
            loadStoredScreenshots()
        })
    }
}

function moveScreenshotToPending(screenshotUrl) {
    var screenshotIndex = doneScreenshotsList.findIndex(function (item) {
        return item.url === screenshotUrl
    })

    if (screenshotIndex !== -1) {
        var screenshot = doneScreenshotsList[screenshotIndex]
        doneScreenshotsList.splice(screenshotIndex, 1)
        screenshotsList.push(screenshot)

        // Update storage
        chrome.storage.local.set({ screenshots: screenshotsList }, function () {
            console.log('Screenshot moved back to pending.')
        })
    }
}

function clearData() {
    chrome.storage.local.set({ screenshots: [] }, function () {
        console.log('Storage cleared.')
    })

    var yourPins = document.getElementById('yourPins')
    yourPins.innerHTML = ''

    // Clear global screenshotsList and doneScreenshotsList
    screenshotsList = []
    doneScreenshotsList = []

    loadStoredScreenshots()
    inputField.focus()
}

function exportPins() {
    const pins = document.body
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0') // Month is zero-based
    const day = String(today.getDate()).padStart(2, '0')
    const hours = today.getHours() % 12 || 12 // Convert to 12-hour format
    const minutes = String(today.getMinutes()).padStart(2, '0')
    const ampm = today.getHours() >= 12 ? 'PM' : 'AM' // Determine AM/PM
    const filename = `yourPins_${year}${month}${day}_${hours}${minutes}${ampm}.pdf`

    window.scrollTo(0, 0)
    setTimeout(() => {
        html2pdf()
            .from(pins)
            .set({
                // Remove headers and footers
                headers: null,
                footers: null,
                // Set html2canvas options to capture the entire content of the element
                html2canvas: {
                    scrollY: -window.scrollY,
                },
            })
            .save(filename)
    }, 300)
}
