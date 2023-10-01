let mediaRecorder;
let audioChunks = [];
let isRecording = false;

// Load the first scene's text when the page loads
window.onload = function () {
  fetch("/static/scenes.json")
    .then((response) => response.json())
    .then((data) => {
      let firstSceneKey = Object.keys(data)[0];
      let firstScene = data[firstSceneKey];
      document.getElementById("sceneText").innerText = firstScene.text;
    });
};

function toggleRecording() {
  if (isRecording) {
    stopRecording();
  } else {
    startRecording();
  }
}

function startRecording() {
  navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
    audioChunks = [];
    mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.ondataavailable = (event) => {
      audioChunks.push(event.data);
    };
    mediaRecorder.start();
    document.getElementById("recordButton").innerText = "Stop Recording";
    isRecording = true;
  });
}

function stopRecording() {
  mediaRecorder.stop();
  // Explicitly release the microphone
  let tracks = mediaRecorder.stream.getTracks();
  tracks.forEach((track) => track.stop());

  document.getElementById("recordButton").innerText = "Start Recording";
  isRecording = false;
  console.log("Recording stopped");
}

function transcribeAudio() {
  const audioBlob = new Blob(audioChunks);
  console.log("Sending audio for transcription...");

  const formData = new FormData();
  formData.append("audio", audioBlob);

  fetch("/transcribe-audio", {
    method: "POST",
    body: formData,
  })
    .then((response) => response.json())
    .then((data) => {
      document.getElementById(
        "transcriptResult",
      ).innerText = `Transcript: ${data.transcript}`;
      console.log("Transcript from Whisper:", data.transcript);
    });
}

function checkAccuracy() {
  const formData = new FormData();
  formData.append(
    "originalText",
    document.getElementById("sceneText").innerText,
  );
  formData.append(
    "transcript",
    document.getElementById("transcriptResult").innerText,
  );

  fetch("/check-accuracy", {
    method: "POST",
    body: formData,
  })
    .then((response) => response.json())
    .then((data) => {
      document.getElementById(
        "accuracyResult",
      ).innerText = `Accuracy: ${data.accuracy}%`;
    });
}
