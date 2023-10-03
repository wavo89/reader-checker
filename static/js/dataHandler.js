// dataHandler.js

export function sendAudioForTranscription() {
  const audioBlob = new Blob(audioChunks);
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
