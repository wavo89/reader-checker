// main.js

import {
  updateUIForRecording,
  displayTranscriptionResults,
} from "./uiHandler.js";
import { startRecording, stopAndTranscribe } from "./audioHandler.js";
import { sendAudioForTranscription } from "./dataHandler.js";

let mediaRecorder;
let isRecording = false;

function toggleRecording() {
  isRecording ? stopAndTranscribe() : startRecording();
}
