let isTransitioning = false;
let allowClick = true; // Default to true

// let isFirstLoad = true;
window.addEventListener("popstate", function (event) {
  // if (isFirstLoad) {
  //   isFirstLoad = false;
  //   return;
  // }
  console.log("popstate event triggered. Current state:", history.state);

  const urlParams = new URLSearchParams(window.location.search);
  const sceneId = urlParams.get("scene");
  if (sceneId) {
    loadScene(sceneId, false); // Note the `false` here, this means we don't push the state again.
  }
});

const originalPushState = history.pushState;
history.pushState = function () {
  console.log("pushState called:", ...arguments);
  return originalPushState.apply(history, arguments);
};

function checkAllowClick(username) {
  // If the user is not logged in, set allow_click to true and exit early.
  if (!username) {
    console.log("Allow Click Status: true (not logged in)");
    return Promise.resolve(true); // Resolve immediately with true.
  }

  // Otherwise, proceed with the existing logic for logged-in users.
  return fetch(`/check-allow-click?username=${username}`)
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        console.log("Allow Click Status:", data.allow_click);
        allowClick = data.allow_click; // Update the global variable
        return data.allow_click;
      } else {
        console.error(data.error);
        return null;
      }
    });
}

function loginUser() {
  const username = document.getElementById("loginUsername").value;
  const password = document.getElementById("loginPassword").value;
  fetch("/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        const loginArea = document.getElementById("loginArea");
        loginArea.style.display = "none";
        const userDisplay = document.getElementById("userDisplay");
        userDisplay.innerHTML = `${username}<span id="logoutLink" style="cursor:pointer;"> | logout</span>`;
        userDisplay.style.display = "block";
        document
          .getElementById("logoutLink")
          .addEventListener("click", logoutUser);
        localStorage.setItem("loggedIn", "true"); // Save login status to local storage
        localStorage.setItem("username", username); // Save username to local storage
        checkAllowClick(username); // Check allow_click status after login
      } else {
        const errorMessage = document.getElementById("loginError");
        errorMessage.innerText = data.error;
        errorMessage.style.display = "block";
      }
    });
}

function navigateToChoice(buttonElement) {
  console.log("navigateToChoice called");
  console.log("Event target:", event.target);

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
let nextSceneImagesPreloaded = false; // New variable to track next scenes' image preload status

function loadScene(sceneId, updateURL = false) {
  console.log("loadScene called with:", sceneId, "updateURL:", updateURL);
  // const userDisplay = document.getElementById("userDisplay");
  // userDisplay.classList.add("noAnimation"); // Disable animations

  isTransitioning = true; // Set to true when starting to load a scene
  const choiceButtons = document.querySelectorAll("#choiceButtons button");
  choiceButtons.forEach((button) => {
    button.disabled = true;
  });
  document.getElementById("recordButton").disabled = true;

  const contentWrapper = document.getElementById("contentWrapper");

  // Begin by fading out the current content
  contentWrapper.classList.add("fadeOutAnimation");
  contentWrapper.classList.remove("fadeInAnimation");
  contentWrapper.style.opacity = "0"; // Hide the content during the transition
  const username = localStorage.getItem("username");
  if (username) {
    checkAllowClick(username).then((allowClick) => {
      // Enable or disable the choice buttons based on allow_click status
      const choiceButtons = document.querySelectorAll("#choiceButtons button");
      choiceButtons.forEach((button) => {
        button.disabled = !allowClick;
      });
    });
  }

  preloadImage(sceneId, "high")
    .then((highResUrl) => {
      // Replace the background image with the high-res image.
      document.body.style.backgroundImage = `url(${highResUrl})`;
      return fetch(`/get-scene?scene=${sceneId}`);
    })
    .then((response) => response.json())
    .then((scene) => {
      // Fade in the updated content after a slight delay (to ensure the image transition is smooth)
      setTimeout(() => {
        // Update scene text and choices text here
        document.getElementById("sceneText").innerText = scene.text;

        const choiceButtons = document.querySelectorAll(
          "#choiceButtons button",
        );
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

        contentWrapper.style.opacity = "1";
        contentWrapper.classList.remove("fadeOutAnimation");
        contentWrapper.classList.add("fadeInAnimation");
        choiceButtons.forEach((button) => {
          button.disabled = !allowClick; // Use the global allowClick variable here
        });
        document.getElementById("recordButton").disabled = false;

        isTransitioning = false; // Set to false after the fade-in transition
      }, 500);

      if (updateURL) {
        history.pushState(null, "", `/?scene=${sceneId}`);
      }

      // Preload images for the next possible scenes
      if (scene.choices) {
        Promise.all(
          scene.choices.map((choice) => preloadImage(choice.link, "high")),
        ).then(() => {
          nextSceneImagesPreloaded = true; // Update the status once all images are preloaded
        });
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

function logoutUser() {
  localStorage.removeItem("loggedIn"); // Remove login status from local storage
  localStorage.removeItem("username"); // Remove login status from local storage

  const userDisplay = document.getElementById("userDisplay");
  userDisplay.style.display = "none";
  const loginArea = document.getElementById("loginArea");
  loginArea.style.display = "block";
}

document.addEventListener("DOMContentLoaded", function () {
  const username = localStorage.getItem("username"); // Get username from local storage
  if (username) {
    checkAllowClick(username).then((allowClick) => {
      console.log("Initial allow_click status:", allowClick);
    });
  } else {
    console.log("Initial allow_click status: true (not logged in)");
  }

  const loginForm = document.getElementById("loginForm");

  loginForm.addEventListener("submit", function (event) {
    event.preventDefault(); // Prevent the form from submitting the traditional way
    loginUser(); // Call your loginUser function
  });

  const isLoggedIn = localStorage.getItem("loggedIn") === "true"; // Get login state from local storage
  if (isLoggedIn) {
    const loginArea = document.getElementById("loginArea");
    loginArea.style.display = "none";
    const userDisplay = document.getElementById("userDisplay");
    const username = localStorage.getItem("username"); // Get username from local storage
    userDisplay.innerHTML = `${username}<a href="#" id="logoutLink"> | logout</a>`;
    userDisplay.style.display = "block";
  }

  document.addEventListener("click", function (event) {
    if (event.target.id === "logoutLink") {
      event.preventDefault();
      localStorage.removeItem("loggedIn"); // Clear login state from local storage
      localStorage.removeItem("username"); // Clear username from local storage
      const userDisplay = document.getElementById("userDisplay");
      userDisplay.style.display = "none";
      const loginArea = document.getElementById("loginArea");
      loginArea.style.display = "block";
    }
  });

  // Disable initial interactions
  isTransitioning = true; // Set this flag to true at the start

  const choiceButtons = document.querySelectorAll("#choiceButtons button");
  choiceButtons.forEach((button) => {
    button.disabled = true;
  });
  document.getElementById("recordButton").disabled = true;

  // Initially set contentWrapper opacity to 0
  document.getElementById("contentWrapper").style.opacity = "0";

  // Create a new Image object to load the low-quality image.
  const lowQualityImage = new Image();
  console.log("Starting to load the low-quality image...");
  document.body.style.display = "none";

  lowQualityImage.onload = function () {
    console.log("Low-quality image has finished loading!");
    document.body.style.display = "block";
    // Fade in the contentWrapper
    setTimeout(() => {
      document.getElementById("contentWrapper").style.opacity = "1";
    }, 100);

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

      // Here we preload images for the next possible scenes after the high-res image has loaded
      const choiceButtons = document.querySelectorAll("#choiceButtons button");

      // Ensure all images are preloaded before enabling interactions
      // Ensure all images are preloaded before enabling interactions
      Promise.all(
        Array.from(choiceButtons).map((button) => {
          const nextSceneId = button.getAttribute("data-link");
          return preloadImage(nextSceneId, "high");
        }),
      ).then(() => {
        if (username) {
          checkAllowClick(username).then((allowClick) => {
            // Enable or disable the choice buttons based on allow_click status
            choiceButtons.forEach((button) => {
              button.disabled = !allowClick;
            });
            document.getElementById("recordButton").disabled = false;
            isTransitioning = false; // Set this flag to false here, after the preloading is done
          });
        } else {
          // If not logged in, enable interactions as usual
          choiceButtons.forEach((button) => {
            button.disabled = false;
          });
          document.getElementById("recordButton").disabled = false;
          isTransitioning = false; // Set this flag to false here, after the preloading is done
        }
      });
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
      event.preventDefault(); // Prevent default behavior (i.e., scrolling)

      if (!isTransitioning & !isTranscribing) {
        const recordButton = document.getElementById("recordButton");
        if (recordButton.innerText === "Continue") {
          navigateToHighlightedChoice();
        } else {
          toggleRecording();
        }
      }
    }
  });

  document
    .getElementById("recordButton")
    .addEventListener("click", function () {
      if (!isTransitioning) {
        // Check the isTransitioning flag here
        if (this.innerText === "Continue") {
          navigateToHighlightedChoice();
        } else {
          toggleRecording();
        }
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
          alert("Reached 15 seconds limit! Stopping recording.");
          cancelRecording();
        }
      }, 15000);
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
    document.getElementById("recordButton").disabled = true; // Disable the button here
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
    recordButton.disabled = false; // Re-enable the button here

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
    button.addEventListener("click", function (event) {
      const sceneLink = button.getAttribute("data-link");
      navigateToChoice(button, event); // Pass the event to the function
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

  const loginUsername = document.getElementById("loginUsername");
  const loginPassword = document.getElementById("loginPassword");

  // Define a function to handle the keydown event
  // function handleKeydown(event) {
  //   // Check if the Enter akey was pressed
  //   if (event.key === "Enter" || event.keyCode === 13) {
  //     event.preventDefault(); // Prevent the default action to stop it from submitting the form in a traditional way
  //     loginUser(); // Call your loginUser function
  //   }
  // }

  // Add the keydown event listener to both input fields
  loginUsername.addEventListener("keydown", handleKeydown);
  loginPassword.addEventListener("keydown", handleKeydown);
}); // End of DOMContentLoaded
