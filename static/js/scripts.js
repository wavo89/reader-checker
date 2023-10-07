// Create a new Image object to load the low-quality image.
const lowQualityImage = new Image();

// This will log when the low-quality image starts loading.
console.log("Starting to load the low-quality image...");

// Hide the body initially
document.body.style.display = "none";

// Add an onload handler for the low-quality image.
lowQualityImage.onload = function () {
  console.log("Low-quality image has finished loading!");

  // Once the low-quality image is fully loaded, fade in the contentWrapper.
  const contentWrapper = document.getElementById("contentWrapper");
  contentWrapper.style.opacity = "1"; // This will fade in the contentWrapper using the CSS transition

  // Now start loading the high-res image
  loadHighResImage();
};

// ... Rest of the existing code ...

// ... Previous code ...

function fadeOutBeforeNavigationChoice(sceneLink) {
  const url = "/?scene=" + sceneLink;
  fadeOutBeforeNavigation(url);
}

// Add the fade-out animation
const style = document.createElement("style");
style.innerHTML = `
  @keyframes blurAndFadeToWhite {
    0% {
      backdrop-filter: blur(0%);
      background-color: rgba(255, 255, 255, 0);
      opacity: 0;
    }
    100% {
      backdrop-filter: blur(10px);
      background-color: rgba(255, 255, 255, 1);
      opacity: 1;
    }
  }
`;
document.head.appendChild(style);

// ... Rest of the existing code ...

// ... Rest of the existing code ...

// Start by loading the low-quality image immediately when the script runs.
const sceneIdElement = document.getElementById("sceneId");
const sceneId = sceneIdElement.getAttribute("data-scene-id");
const lowResImageURL =
  "https://storyscenes.blob.core.windows.net/background-small/" +
  sceneId +
  ".jpg";
lowQualityImage.src = lowResImageURL;

function loadHighResImage() {
  // Create a new Image object to load the high-quality image.
  const highQualityImage = new Image();

  // This will log when the high-quality image starts loading.
  console.log("Starting to load the high-quality image...");

  // Add an onload handler for this image.
  highQualityImage.onload = function () {
    console.log("High-quality image has finished loading!");
    // Once the high-quality image is fully loaded, set it as the background.
    document.body.style.backgroundImage = "url(" + highQualityImage.src + ")";
  };

  // Add an onerror handler in case the high-quality image fails to load.
  highQualityImage.onerror = function () {
    console.error("Error loading the high-quality image.");
  };

  // Load the high-quality image.
  highQualityImage.src =
    "https://storyscenes.blob.core.windows.net/background-normal/" +
    sceneId +
    ".jpg";
}

document.addEventListener("keydown", function (event) {
  if (event.code === "Space") {
    const recordButton = document.getElementById("recordButton");
    if (recordButton.innerText === "Continue") {
      navigateToHighlightedChoice();
    } else {
      toggleRecording();
    }
    event.preventDefault();
  }
});

document.getElementById("recordButton").addEventListener("click", function () {
  if (this.innerText === "Continue") {
    navigateToHighlightedChoice();
  }
});

let mediaRecorder;
let audioChunks = [];
let isRecording = false;
let recordingTimer;

function toggleRecording() {
  isRecording ? stopAndTranscribe() : startRecording();
}

function startRecording() {
  navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
    initializeMediaRecorder(stream);
    mediaRecorder.start();
    updateUIForRecording();
    recordingTimer = setTimeout(() => {
      if (isRecording) {
        alert("Reached 25 seconds limit! Stopping recording.");
        cancelRecording();
      }
    }, 25000);
  });
}

function fadeOutBeforeNavigation(url) {
  // Check if the blurOverlay is already present (to prevent double blur)
  if (document.getElementById("outgoingBlurOverlay")) return;

  const blurOverlay = document.createElement("div");
  blurOverlay.id = "outgoingBlurOverlay";
  blurOverlay.style.position = "fixed";
  blurOverlay.style.top = "0";
  blurOverlay.style.left = "0";
  blurOverlay.style.width = "100vw";
  blurOverlay.style.height = "100vh";
  blurOverlay.style.backdropFilter = "blur(0%)";
  blurOverlay.style.zIndex = "9999";
  blurOverlay.style.pointerEvents = "none";
  blurOverlay.style.opacity = "0";
  blurOverlay.style.animation = "blurFadeIn 1s forwards";

  document.body.appendChild(blurOverlay);
  window.location.href = url;
}

//

function initializeMediaRecorder(stream) {
  audioChunks = [];
  mediaRecorder = new MediaRecorder(stream);
  mediaRecorder.ondataavailable = (event) => {
    audioChunks.push(event.data);
  };
}

function updateUIForRecording() {
  document.getElementById("recordButton").innerText = "Stop Recording";
  isRecording = true;
}

function stopAndTranscribe() {
  clearTimeout(recordingTimer);
  mediaRecorder.onstop = processTranscription;
  mediaRecorder.stop();
  cleanupMediaRecorder();
}

function cancelRecording() {
  clearTimeout(recordingTimer);
  cleanupMediaRecorder();
  document.getElementById("recordButton").innerText = "Record";
  isRecording = false;
}

function cleanupMediaRecorder() {
  let tracks = mediaRecorder.stream.getTracks();
  tracks.forEach((track) => track.stop());
}

function processTranscription() {
  document.getElementById("recordButton").innerText = "Transcribing...";
  isRecording = false;

  sendAudioForTranscription().then((data) => {
    displayTranscriptionResults(data);
  });
}

function sendAudioForTranscription() {
  const audioBlob = new Blob(audioChunks);
  console.log("Sending audio for transcription...");

  const formData = new FormData();
  formData.append("audio", audioBlob);

  // Extracting choices from the rendered scene
  const choiceButtons = document.querySelectorAll("#choiceButtons button");
  choiceButtons.forEach((button, index) => {
    formData.append(`choice_${index + 1}`, button.innerText);
  });

  return fetch("/transcribe-audio", {
    method: "POST",
    body: formData,
  }).then((response) => response.json());
}

function displayTranscriptionResults(data) {
  document.getElementById(
    "transcriptResult",
  ).innerText = `Recording: ${data.transcript}`;
  console.log("Transcript from Whisper:", data.transcript);

  // Reset borders for all choices
  const choiceButtons = document.querySelectorAll("#choiceButtons button");
  choiceButtons.forEach((button) => {
    button.style.border = "none";
  });

  // Highlight the closest choice with a neon green border only if accuracy is not red
  console.log(data.closest_choice_id);
  if (data.closest_choice_accuracy !== 1) {
    const closestChoiceButton = document.getElementById(data.closest_choice_id);
    if (closestChoiceButton) {
      closestChoiceButton.style.border = "3px solid #39FF14"; // Neon
    }
  }

  let accuracyResult = document.getElementById("accuracyResult");
  accuracyResult.innerHTML = `Accuracy:&nbsp;&nbsp;${getAccuracyEmoji(
    data.closest_choice_accuracy,
  )}`;

  // Update the Record button's text based on the accuracy
  const recordButton = document.getElementById("recordButton");
  if (
    data.closest_choice_accuracy === 3 ||
    data.closest_choice_accuracy === 2
  ) {
    recordButton.innerText = "Continue";
    recordButton.onclick = function () {
      navigateToHighlightedChoice();
    };
  } else {
    recordButton.innerText = "Record";
    recordButton.onclick = function () {
      toggleRecording();
    };
  }
}

function navigateToHighlightedChoice() {
  const closestChoiceButton = document.querySelector(
    "#choiceButtons button[style='border: 3px solid rgb(57, 255, 20);']",
  );
  if (closestChoiceButton) {
    const sceneLink = closestChoiceButton.getAttribute("data-link");
    fadeOutBeforeNavigationChoice(sceneLink);
  }
}

// Add event listeners to the choice buttons to handle navigation
document.querySelectorAll("#choiceButtons button").forEach((button) => {
  button.addEventListener("click", function () {
    const sceneLink = button.getAttribute("data-link");
    fadeOutBeforeNavigationChoice(sceneLink);
  });
});
window.addEventListener("load", function () {
  setTimeout(function () {
    const blurOverlay = document.getElementById("blurOverlay");
    if (blurOverlay) {
      blurOverlay.remove();
    }
  }, 1000); // 1 second
});

// Add event listeners to the choice buttons to handle navigation
document.querySelectorAll("#choiceButtons button").forEach((button) => {
  button.addEventListener("click", function () {
    const targetURL = `/?scene=${button.getAttribute("data-link")}`;
    fadeOutBeforeNavigation(targetURL);
  });
});

function getAccuracyEmoji(accuracy) {
  if (accuracy === 3) return "🟢";
  if (accuracy === 2) return "🟡";
  return "🔴";
}
