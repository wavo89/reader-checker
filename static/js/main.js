let isTransitioning = false;

window.addEventListener("popstate", function (event) {
  console.log("popstate event triggered. Current state:", history.state);

  const urlParams = new URLSearchParams(window.location.search);
  const sceneId = urlParams.get("scene");
  if (sceneId) {
    loadScene(sceneId, false);
  }
});

const originalPushState = history.pushState;
history.pushState = function () {
  console.log("pushState called:", ...arguments);
  return originalPushState.apply(history, arguments);
};

function navigateToChoice(buttonElement) {
  const sceneLink = buttonElement.getAttribute("data-link");
  resetUIAfterTransition();
  loadScene(sceneLink, true);
}

function resetUIAfterTransition() {
  document.getElementById("recordButton").innerText = "Record";
  document.getElementById("transcriptResult").innerText = "Recording: ";
  document.getElementById("accuracyResult").innerHTML =
    "Accuracy:&nbsp;&nbsp;----";
  const choiceButtons = document.querySelectorAll("#choiceButtons button");
  choiceButtons.forEach((button) => {
    button.style.border = "none";
  });
}

function loadScene(sceneId, updateURL = false) {
  isTransitioning = true;
  const choiceButtons = document.querySelectorAll("#choiceButtons button");
  choiceButtons.forEach((button) => {
    button.disabled = true;
  });
  document.getElementById("recordButton").disabled = true;

  const contentWrapper = document.getElementById("contentWrapper");
  contentWrapper.classList.add("fadeOutAnimation");
  contentWrapper.classList.remove("fadeInAnimation");
  contentWrapper.style.opacity = "0";

  fetch(`/get-scene?scene=${sceneId}`)
    .then((response) => response.json())
    .then((scene) => {
      setTimeout(() => {
        document.getElementById("sceneText").innerText = scene.text;
        const choiceButtons = document.querySelectorAll(
          "#choiceButtons button",
        );
        choiceButtons.forEach((button, index) => {
          if (scene.choices && scene.choices[index]) {
            button.innerText = scene.choices[index].text;
            button.setAttribute("data-link", scene.choices[index].link);
          } else {
            button.style.display = "none";
          }
        });

        resetUIAfterTransition();

        contentWrapper.style.opacity = "1";
        contentWrapper.classList.remove("fadeOutAnimation");
        contentWrapper.classList.add("fadeInAnimation");
        choiceButtons.forEach((button) => {
          button.disabled = false;
        });
        document.getElementById("recordButton").disabled = false;

        isTransitioning = false;
      }, 500);

      if (updateURL) {
        history.pushState(null, "", `/?scene=${sceneId}`);
      }
    });
}

document.addEventListener("DOMContentLoaded", function () {
  isTransitioning = true;
  const choiceButtons = document.querySelectorAll("#choiceButtons button");
  choiceButtons.forEach((button) => {
    button.disabled = true;
  });
  document.getElementById("recordButton").disabled = true;
  document.getElementById("contentWrapper").style.opacity = "0";

  const sceneIdElement = document.getElementById("sceneId");
  const sceneId = sceneIdElement
    ? sceneIdElement.getAttribute("data-scene-id")
    : null;
  if (sceneId) {
    const lowResImageURL =
      "https://storyscenes.blob.core.windows.net/background-small/" +
      sceneId +
      ".jpg";
    const lowQualityImage = new Image();
    lowQualityImage.src = lowResImageURL;
    lowQualityImage.onload = function () {
      document.getElementById("contentWrapper").style.opacity = "1";
    };
  }

  document.querySelectorAll("#choiceButtons button").forEach((button) => {
    button.addEventListener("click", function () {
      const sceneLink = button.getAttribute("data-link");
      navigateToChoice(button);
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
});
