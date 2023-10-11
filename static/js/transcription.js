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
  document.getElementById("recordButton").disabled = true;
  isRecording = false;

  sendAudioForTranscription().then((data) => {
    displayTranscriptionResults(data);
  });
}

function sendAudioForTranscription() {
  const audioBlob = new Blob(audioChunks);
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
  console.log("Transcript from Whisper:", data.transcript);

  const choiceButtons = document.querySelectorAll("#choiceButtons button");
  choiceButtons.forEach((button) => {
    button.style.border = "none";
  });

  if (data.closest_choice_accuracy !== 1) {
    const closestChoiceButton = document.getElementById(data.closest_choice_id);
    if (closestChoiceButton) {
      closestChoiceButton.style.border = "3px solid #39FF14";
    }
  }

  let accuracyResult = document.getElementById("accuracyResult");
  accuracyResult.innerHTML = `Accuracy: ${getAccuracyEmoji(
    data.closest_choice_accuracy,
  )}`;

  const recordButton = document.getElementById("recordButton");
  recordButton.disabled = false;

  if (
    data.closest_choice_accuracy === 3 ||
    data.closest_choice_accuracy === 2
  ) {
    recordButton.innerText = "Continue";
  } else {
    recordButton.innerText = "Record";
  }
}

function getAccuracyEmoji(accuracy) {
  if (accuracy === 3) return "🟢";
  if (accuracy === 2) return "🟡";
  return "🔴";
}
