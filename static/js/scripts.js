document.addEventListener("keydown", function (event) {
  if (event.code === "Space") {
    toggleRecording();
    event.preventDefault();
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
  document.getElementById("recordButton").innerText = "Record";
  document.getElementById(
    "transcriptResult",
  ).innerText = `Recording: ${data.transcript}`;
  console.log("Transcript from Whisper:", data.transcript);

  // Reset borders for all choices
  const choiceButtons = document.querySelectorAll("#choiceButtons button");
  choiceButtons.forEach((button) => {
    button.style.border = "none";
  });

  // Highlight the closest choice with a neon green border
  console.log(data.closest_choice);
  const closestChoiceButton = document.getElementById(data.closest_choice);
  if (closestChoiceButton) {
    closestChoiceButton.style.border = "3px solid #39FF14"; // Neon
  }

  let accuracyResult = document.getElementById("accuracyResult");
  accuracyResult.innerHTML = `Accuracy:&nbsp;&nbsp;${getAccuracyEmoji(
    data.closest_choice_accuracy,
  )}`;
}

function getAccuracyEmoji(accuracy) {
  if (accuracy === 3) return "🟢";
  if (accuracy === 2) return "🟡";
  return "🔴";
}
