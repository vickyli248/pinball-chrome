document.addEventListener('DOMContentLoaded', () => {
  console.log('DOMContentLoaded event triggered');
  document.getElementById('captureBtn').addEventListener('click', () => {
    addTestText();
  });
});

function addTestText() {
  // Create a <p> tag with test text
  const pTag = document.createElement('p');
  pTag.textContent = 'Test Text';

  // Find the yourPins div in popup.html and append the <p> tag to it
  const yourPinsDiv = document.getElementById('yourPins');
  if (yourPinsDiv) {
    yourPinsDiv.appendChild(pTag);
  } else {
    console.error('Element with ID "yourPins" not found in the popup HTML.');
  }
}
