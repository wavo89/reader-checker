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

    // Start the timer to automatically stop recording after 25 seconds
    recordingTimer = setTimeout(() => {
      if (isRecording) {
        alert("Reached 25 seconds limit! Stopping recording.");
        stopAndTranscribe();
      }
    }, 25000); // 25 seconds
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
  clearTimeout(recordingTimer); // Clear the timer
  mediaRecorder.onstop = processTranscription;
  mediaRecorder.stop();
  cleanupMediaRecorder();
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
  const audioDuration =
    audioBlob.size / (audioBlob.type === "audio/wav" ? 16000 : 96000); // Approximate duration in seconds

  if (audioDuration > 25) {
    console.error(
      "Audio is longer than 25 seconds. Not sending for transcription.",
    );
    alert("Audio is too long! Please record for 25 seconds or less.");
    document.getElementById("recordButton").innerText = "Record"; // Revert the button state
    return;
  }

  console.log("Sending audio for transcription...");

  const formData = new FormData();
  formData.append("audio", audioBlob);
  formData.append(
    "originalText",
    document.getElementById("sceneText").innerText,
  );

  return fetch("/transcribe-audio", {
    method: "POST",
    body: formData,
  }).then((response) => response.json());
}

function displayTranscriptionResults(data) {
  document.getElementById("recordButton").innerText = "Record";
  document.getElementById(
    "transcriptResult",
  ).innerText = `Your Recording: ${data.transcript}`;
  console.log("Transcript from Whisper:", data.transcript);

  let accuracyResult = document.getElementById("accuracyResult");
  accuracyResult.innerHTML = `Accuracy:&nbsp;&nbsp;${getAccuracyEmoji(
    data.accuracy,
  )}`;
}

function getAccuracyEmoji(accuracy) {
  if (accuracy === 3) return "🟢";
  if (accuracy === 2) return "🟡";
  return "🔴";
}
