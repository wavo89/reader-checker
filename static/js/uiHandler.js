// uiHandler.js

export function updateUIForRecording() {
  document.getElementById("recordButton").innerText = "Stop Recording";
}

export function displayTranscriptionResults(data) {
  document.getElementById("recordButton").innerText = "Record";
  document.getElementById(
    "transcriptResult",
  ).innerText = `Transcript: ${data.transcript}`;
  let accuracyBox = document.getElementById("accuracyResult");
  accuracyBox.style.backgroundColor = getAccuracyColor(data.accuracy);
}

export function getAccuracyColor(accuracy) {
  if (accuracy === 3) return "green";
  if (accuracy === 2) return "yellow";
  return "red";
}
