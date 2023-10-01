let mediaRecorder;
let audioChunks = [];
let isRecording = false;

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
    mediaRecorder = new MediaRecorder(stream); // Removed MIME type specification
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
  document.getElementById("recordButton").innerText = "Start Recording";
  isRecording = false;
  console.log("Recording stopped");
}

function transcribeAudio() {
  const audioBlob = new Blob(audioChunks); // No MIME type specified
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
    document.getElementById("originalText").value,
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
