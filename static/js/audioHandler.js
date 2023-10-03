// audioHandler.js

let audioChunks = [];

export function startRecording(stream) {
  initializeMediaRecorder(stream);
  mediaRecorder.start();
}

export function initializeMediaRecorder(stream) {
  audioChunks = [];
  mediaRecorder = new MediaRecorder(stream);
  mediaRecorder.ondataavailable = (event) => {
    audioChunks.push(event.data);
  };
}

export function stopAndTranscribe() {
  mediaRecorder.onstop = processTranscription;
  mediaRecorder.stop();
  cleanupMediaRecorder();
}

export function cleanupMediaRecorder() {
  let tracks = mediaRecorder.stream.getTracks();
  tracks.forEach((track) => track.stop());
}
