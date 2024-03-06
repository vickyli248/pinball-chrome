$(document).ready(function() {
    let isDragging = false;
    let doneDragging = false;
    let startX, startY, endX, endY;
    const selectionBox = $('#selectionBox');
    const screenshotArea = $('#screenshotArea');
    const hiddenDiv = $('#inputArea');
    const hiddenInput = $('#inputField');

    function updateSelectionBox() {
        if (isDragging) {
            let width = endX - startX;
            let height = endY - startY;
            selectionBox.css({
                left: startX + 'px',
                top: startY + 'px',
                width: width + 'px',
                height: height + 'px',
                display: 'block'
            });
            return;
        } 
    }

    screenshotArea.on('mousedown', function(e) {
        const targetTagName = e.target.tagName.toLowerCase();
        if (targetTagName === 'input' || targetTagName === 'button') {
            return;
        }
        if (hiddenDiv.is(':visible') && !$(e.target).closest('#hiddenDiv').length) {
            hiddenDiv.hide();
        }
        if (!$(e.target).closest('input, button').length) {
            isDragging = false;
            updateSelectionBox();
            hiddenDiv.hide();
        }
        isDragging = true;
        selectionBox.removeClass('selectionBox-hidden');
        startX = e.pageX - $(this).offset().left;
        startY = e.pageY - $(this).offset().top;
        updateSelectionBox();
    });

    screenshotArea.on('mousemove', function(e) {
        if (!isDragging) return;
        endX = e.pageX - $(this).offset().left;
        endY = e.pageY - $(this).offset().top;
        updateSelectionBox();
    });

    screenshotArea.on('mouseup', function() {
        console.log('mouse up')
        isDragging = false;
        doneDragging = true;
        updateSelectionBox();
        hiddenDiv.show();
        hiddenInput.focus();
    });

    chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
      if (message.command === "takeScreenshot") {
        console.log('worked')
        // Capture the entered text
        const inputText = hiddenInput.val().trim();

        // Calculate the dimensions and position of the selection box
        const selectionBox = document.getElementById('selectionBox');
        const rect = selectionBox.getBoundingClientRect();

        // Capture only the section within the selection box area
        html2canvas(document.body, {
            x: rect.left,
            y: rect.top,
            width: rect.width,
            height: rect.height
        }).then(canvas => {
            // Set the maximum width of the captured canvas to 200px
            const maxWidth = 200;
            const scaleFactor = maxWidth / canvas.width;

            // Create a new canvas with the scaled dimensions
            const scaledCanvas = document.createElement('canvas');
            scaledCanvas.width = maxWidth;
            scaledCanvas.height = canvas.height * scaleFactor;

            // Scale and draw the original canvas onto the scaled canvas
            const ctx = scaledCanvas.getContext('2d');
            ctx.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, maxWidth, scaledCanvas.height);

            // Draw buttons on the scaled canvas
            drawButtons(ctx, inputText);

            // Create an object to hold the screenshot and text
            const screenshotData = {
                canvas: scaledCanvas,
                text: inputText
            };

            // Send the screenshot URL back to the popup
            chrome.runtime.sendMessage({command: "updateScreenshot", screenshotUrl: screenshotData.canvas.toDataURL()});
            
            // Reset the selection box
            selectionBox.css({
                width: '0',
                height: '0',
                display: 'none',
                top: '0',
                left: '0'
            }).addClass('selectionBox-hidden');
        });
      }
    });

    function drawButtons(ctx, inputText) {
        // Draw buttons on the canvas
        const buttonWidth = 50;
        const buttonHeight = 30;
        const padding = 10;

        // Draw cancel button
        ctx.fillStyle = "#FF0000";
        ctx.fillRect(padding, padding, buttonWidth, buttonHeight);
        ctx.fillStyle = "#FFFFFF";
        ctx.fillText("Cancel", padding + 5, padding + 20);

        // Draw capture button
        ctx.fillStyle = "#008000";
        ctx.fillRect(scaledCanvas.width - padding - buttonWidth, padding, buttonWidth, buttonHeight);
        ctx.fillStyle = "#FFFFFF";
        ctx.fillText("Capture", scaledCanvas.width - padding - buttonWidth + 5, padding + 20);
    }

});
