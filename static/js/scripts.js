function navigateToChoice(buttonElement) {
  const blurOverlay = document.getElementById("blurOverlay");
  if (blurOverlay) {
    blurOverlay.style.animation = "blurFadeIn 1s forwards";
  }
  const sceneLink = buttonElement.getAttribute("data-link");

  resetUIAfterTransition(); // Resetting the UI

  loadScene(sceneLink, true);
}
function resetUIAfterTransition() {
  document.getElementById("recordButton").innerText = "Record";
  document.getElementById("transcriptResult").innerText = "Recording: ";
  document.getElementById("accuracyResult").innerHTML =
    "Accuracy:&nbsp;&nbsp;----"; // Use innerHTML here
  const choiceButtons = document.querySelectorAll("#choiceButtons button");
  choiceButtons.forEach((button) => {
    button.style.border = "none";
  });
}

// ... [The other functions remain unchanged]

// ... [Other functions remain unchanged]

function loadScene(sceneId, updateURL = false) {
  const contentWrapper = document.getElementById("contentWrapper");

  // Begin by fading out the current content
  contentWrapper.classList.add("fadeOutAnimation");
  contentWrapper.classList.remove("fadeInAnimation");
  contentWrapper.style.opacity = "0"; // Hide the content during the transition

  preloadImage(sceneId, "high")
    .then((highResUrl) => {
      // Replace the background image with the high-res image.
      document.body.style.backgroundImage = `url(${highResUrl})`;
      return fetch(`/get-scene?scene=${sceneId}`);
    })
    .then((response) => response.json())
    .then((scene) => {
      document.getElementById("sceneText").innerText = scene.text;

      const choiceButtons = document.querySelectorAll("#choiceButtons button");
      choiceButtons.forEach((button, index) => {
        if (scene.choices && scene.choices[index]) {
          button.innerText = scene.choices[index].text;
          button.setAttribute("data-link", scene.choices[index].link);
        } else {
          button.style.display = "none"; // Hide any extra buttons that are not used in this scene
        }
      });

      // Reset the UI while the container is fully invisible
      resetUIAfterTransition();

      // Fade in the updated content after a slight delay (to ensure the image transition is smooth)
      setTimeout(() => {
        contentWrapper.style.opacity = "1";
        contentWrapper.classList.remove("fadeOutAnimation");
        contentWrapper.classList.add("fadeInAnimation");
      }, 500);

      if (updateURL) {
        history.pushState(null, "", `/?scene=${sceneId}`);
      }
    });
}

function preloadImage(sceneId, quality = "low") {
  return new Promise((resolve, reject) => {
    const imageUrl = `https://storyscenes.blob.core.windows.net/background-${
      quality === "low" ? "small" : "normal"
    }/${sceneId}.jpg`;
    const image = new Image();

    image.onload = () => {
      resolve(imageUrl);
    };

    image.onerror = reject;

    image.src = imageUrl;
  });
}

document.addEventListener("DOMContentLoaded", function () {
  // Create a new Image object to load the low-quality image.
  const lowQualityImage = new Image();
  console.log("Starting to load the low-quality image...");
  document.body.style.display = "none";

  lowQualityImage.onload = function () {
    console.log("Low-quality image has finished loading!");
    document.body.style.display = "block";
    document.getElementById("contentWrapper").style.opacity = "1"; // Show the content once low-res is loaded

    loadHighResImage();
  };

  const sceneIdElement = document.getElementById("sceneId");
  const sceneId = sceneIdElement
    ? sceneIdElement.getAttribute("data-scene-id")
    : null;
  if (sceneId) {
    const lowResImageURL =
      "https://storyscenes.blob.core.windows.net/background-small/" +
      sceneId +
      ".jpg";
    lowQualityImage.src = lowResImageURL;
  }

  function loadHighResImage() {
    const highQualityImage = new Image();
    console.log("Starting to load the high-quality image...");

    highQualityImage.onload = function () {
      console.log("High-quality image has finished loading!");
      document.body.style.backgroundImage = "url(" + highQualityImage.src + ")";
    };

    highQualityImage.onerror = function () {
      console.error("Error loading the high-quality image.");
    };

    if (sceneId) {
      highQualityImage.src =
        "https://storyscenes.blob.core.windows.net/background-normal/" +
        sceneId +
        ".jpg";
    }
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

  document
    .getElementById("recordButton")
    .addEventListener("click", function () {
      if (this.innerText === "Continue") {
        navigateToHighlightedChoice();
      } else {
        toggleRecording();
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

  let isTranscribing = false;

  function processTranscription() {
    document.getElementById("recordButton").innerText = "Transcribing...";
    isTranscribing = true;
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
    isTranscribing = false;
    console.log("Transcript from Whisper:", data.transcript);

    const choiceButtons = document.querySelectorAll("#choiceButtons button");
    choiceButtons.forEach((button) => {
      button.style.border = "none";
    });

    if (data.closest_choice_accuracy !== 1) {
      const closestChoiceButton = document.getElementById(
        data.closest_choice_id,
      );
      if (closestChoiceButton) {
        closestChoiceButton.style.border = "3px solid #39FF14";
      }
    }

    let accuracyResult = document.getElementById("accuracyResult");
    accuracyResult.innerHTML = `Accuracy: ${getAccuracyEmoji(
      data.closest_choice_accuracy,
    )}`;

    const recordButton = document.getElementById("recordButton");
    if (
      data.closest_choice_accuracy === 3 ||
      data.closest_choice_accuracy === 2
    ) {
      recordButton.innerText = "Continue";
    } else {
      recordButton.innerText = "Record";
    }
  }

  function navigateToHighlightedChoice() {
    const closestChoiceButton = document.querySelector(
      "#choiceButtons button[style='border: 3px solid rgb(57, 255, 20);']",
    );
    if (closestChoiceButton) {
      const sceneLink = closestChoiceButton.getAttribute("data-link");
      loadScene(sceneLink, true);
    }
  }

  document.querySelectorAll("#choiceButtons button").forEach((button) => {
    button.addEventListener("click", function () {
      const sceneLink = button.getAttribute("data-link");
      loadScene(sceneLink, true);
      // Preload images for the next scenes
      preloadImage(sceneLink, "high");
    });
  });

  window.addEventListener("load", function () {
    setTimeout(function () {
      const blurOverlay = document.getElementById("blurOverlay");
      if (blurOverlay) {
        blurOverlay.remove();
      }
    }, 1000);
  });

  function getAccuracyEmoji(accuracy) {
    if (accuracy === 3) return "🟢";
    if (accuracy === 2) return "🟡";
    return "🔴";
  }
}); // End of DOMContentLoaded
