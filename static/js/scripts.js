let isTransitioning = false;
let allowClick = true; // Default to true
let choiceScenesViewed = {};
// let choiceScenesViewed = { hex2: true, hex3: false };
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

// Function to update choice buttons
function updateChoiceButtons() {
  // Get all choice buttons
  let choiceButtons = document.querySelectorAll("[data-link]");

  // Iterate through each button
  choiceButtons.forEach((button) => {
    // Get data-link value
    let linkValue = button.getAttribute("data-link");

    console.log(`Processing button with linkValue: ${linkValue}`);

    // Check choiceScenesViewed for corresponding value
    if (choiceScenesViewed[linkValue]) {
      console.log(`Scene ${linkValue} has been viewed.`);
      // Prepend a check mark to the button text
      button.innerText = "✅ " + button.innerText;
    } else {
      console.log(`Scene ${linkValue} has not been viewed.`);
      // Ensure no check mark is prepended
      button.innerText = button.innerText.replace(/^✅ /, "");
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

// New function to handle checking viewed scenes
function checkViewedScenes(scene, username, callback) {
  if (scene.choices) {
    if (!username) {
      // Handle not logged in scenario (e.g., show login prompt)
      console.log("No viewed choice, user not logged in");
      callback(null); // Call the callback with null to indicate an error or no data
      return;
    }
    const choice_scene_ids = scene.choices.map((choice) => choice.link);
    fetch("/check-viewed-scenes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username,
        choice_scene_ids,
      }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok " + response.statusText);
        }
        return response.json();
      })
      .then((data) => {
        console.log("checkChoiceView: ", data);
        choiceScenesViewed = data.choice_viewed_status; // Store the data globally
        callback(data.choice_viewed_status); // Call the callback with the data
      })
      .catch((error) => {
        console.error(
          "There has been a problem with your fetch operation:",
          error,
        );
        callback(null); // Call the callback with null to indicate an error
      });
  } else {
    callback(null); // Call the callback with null if there are no choices
  }
}

function updateViewedScenes(username, sceneId) {
  fetch("/update-viewed-scenes", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      username: username,
      scene_id: sceneId,
    }),
  })
    .then((response) => response.json())
    .then((responseData) => {
      if (responseData.success) {
        console.log("Viewed scenes updated successfully.");
      } else {
        console.error("Error updating viewed scenes:", responseData.error);
      }
    })
    .catch((error) => {
      console.error("Error updating viewed scenes:", error);
    });
}

async function loadScene(sceneId, updateURL = false) {
  console.log("loadScene called with:", sceneId, "updateURL:", updateURL);

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
  let allowClick = false;
  if (username) {
    updateViewedScenes(username, sceneId);
    allowClick = await checkAllowClick(username);
    // Enable or disable the choice buttons based on allow_click status
    choiceButtons.forEach((button) => {
      button.disabled = !allowClick;
    });
  }

  try {
    const highResUrl = await preloadImage(sceneId, "high");
    // Replace the background image with the high-res image.
    document.body.style.backgroundImage = `url(${highResUrl})`;
    const response = await fetch(`/get-scene?scene=${sceneId}`);
    const scene = await response.json();

    checkViewedScenes(scene, username, function (viewedStatus) {
      setTimeout(() => {
        // This code will run after checkViewedScenes has finished
        if (viewedStatus !== null) {
          // If viewedStatus is not null, it means checkViewedScenes succeeded
          updateChoiceButtons(); // <-- Updated line
        }
        // ... (any other code you want to run after checkViewedScenes)

        // Fade in the updated content after a slight delay (to ensure the image transition is smooth)
        // ... (rest of your code remains unchanged)
      }, 500);
    });

    // Fade in the updated content after a slight delay (to ensure the image transition is smooth)
    setTimeout(() => {
      // Update scene text and choices text here

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
      await Promise.all(
        scene.choices.map((choice) => preloadImage(choice.link, "high")),
      );
      nextSceneImagesPreloaded = true; // Update the status once all images are preloaded
    }
  } catch (error) {
    console.error("Error loading scene:", error);
  }
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

function getSceneInfo(sceneId, username, callback) {
  // Fetch scene info
  fetch(`/get-scene?scene=${sceneId}`)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok " + response.statusText);
      }
      return response.json();
    })
    .then((scene) => {
      // Call the callback with the fetched scene
      callback(null, scene);
    })
    .catch((error) => {
      console.error(
        "There has been a problem with your fetch operation:",
        error,
      );
      callback(error); // Call the callback with error to indicate an error
    });
}

document.addEventListener("DOMContentLoaded", function () {
  const username = localStorage.getItem("username"); // Get username from local storage
  if (username) {
    // getSceneInfo(sceneId, username, function (error, scene) {
    //   if (error) {
    //     // Handle error
    //     console.error("Failed to get scene info:", error);
    //     return;
    //   }

    //   checkViewedScenes(scene, username, function (viewedStatus) {
    //     setTimeout(() => {
    //       // This code will run after checkViewedScenes has finished
    //       if (viewedStatus !== null) {
    //         // If viewedStatus is not null, it means checkViewedScenes succeeded
    //         updateChoiceButtons(); // <-- Updated line
    //       }
    //       // ... (any other code you want to run after checkViewedScenes)

    //       // Fade in the updated content after a slight delay (to ensure the image transition is smooth)
    //       // ... (rest of your code remains unchanged)
    //     }, 500);
    //   });
    // });

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

  // const username = localStorage.getItem("username");
  if (username) {
    getSceneInfo(sceneId, username, function (error, scene) {
      if (error) {
        // Handle error
        console.error("Failed to get scene info:", error);
        return;
      }

      checkViewedScenes(scene, username, function (viewedStatus) {
        setTimeout(() => {
          // This code will run after checkViewedScenes has finished
          if (viewedStatus !== null) {
            // If viewedStatus is not null, it means checkViewedScenes succeeded
            updateChoiceButtons(); // <-- Updated line
          }
          // ... (any other code you want to run after checkViewedScenes)

          // Fade in the updated content after a slight delay (to ensure the image transition is smooth)
          // ... (rest of your code remains unchanged)
        }, 500);
      });
    });
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

// Function to add eye icon
// function removeEyeIcon() {
//   // Get all eye icons
//   let eyeIcons = document.querySelectorAll(".eye-icon");

//   // Iterate through each eye icon
//   eyeIcons.forEach((icon) => {
//     // Get data-link value from the parent button
//     let linkValue = icon.previousSibling.getAttribute("data-link");

//     // Check choiceScenesViewed for corresponding value
//     if (!choiceScenesViewed[linkValue]) {
//       // Hide eye icon element if the scene has not been viewed
//       icon.style.display = "none";
//     }
//   });
// }

// function setEyeIcon() {
//   // Get all choice buttons
//   let choiceButtons = document.querySelectorAll("[data-link]");

//   // Iterate through each button
//   choiceButtons.forEach((button) => {
//     // Get data-link value
//     let linkValue = button.getAttribute("data-link");

//     // Find the existing icon span, if any, using a querySelector
//     let iconSpan = button.parentNode.querySelector(".icon-span");

//     console.log(`Processing button with linkValue: ${linkValue}`);
//     console.log(`Existing icon span: ${iconSpan}`);

//     // Check choiceScenesViewed for corresponding value
//     if (choiceScenesViewed[linkValue]) {
//       console.log(`Scene ${linkValue} has been viewed.`);
//       // If the icon span doesn't exist, create and append it
//       if (!iconSpan) {
//         console.log(`Creating new icon span for ${linkValue}`);
//         iconSpan = document.createElement("span");
//         iconSpan.className = "icon-span";
//         button.parentNode.insertBefore(iconSpan, button.nextSibling);
//       }
//       iconSpan.textContent = "✅"; // Set text content to check mark
//     } else {
//       console.log(`Scene ${linkValue} has not been viewed.`);
//       // If the icon span exists, set its text content to an empty string
//       if (iconSpan) {
//         iconSpan.textContent = ""; // Set text content to empty string
//       }
//     }
//   });
// }

// Call the function to add eye icons
// setEyeIcon();
