let mediaRecorder;
let audioChunks = [];
let isRecording = false;

window.onload = function () {
  fetch("/scenes/scenes.json")
    .then((response) => response.json())
    .then((data) => {
      let firstSceneKey = Object.keys(data)[0];
      let firstScene = data[firstSceneKey];
      document.getElementById("sceneText").innerText = firstScene.text;
      document.body.style.backgroundImage = `url('/static/images/${firstScene.image}')`;
    });
};

function toggleRecording() {
  if (isRecording) {
    stopAndTranscribe();
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

function stopAndTranscribe() {
  mediaRecorder.onstop = function () {
    // This code will run after the mediaRecorder has fully stopped
    let tracks = mediaRecorder.stream.getTracks();
    tracks.forEach((track) => track.stop());
    document.getElementById("recordButton").innerText = "Transcribing...";
    isRecording = false;

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
        document.getElementById("recordButton").innerText = "Start Recording";
        document.getElementById(
          "transcriptResult",
        ).innerText = `Transcript: ${data.transcript}`;
        console.log("Transcript from Whisper:", data.transcript);
      });
  };

  // Stop the mediaRecorder
  mediaRecorder.stop();
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
