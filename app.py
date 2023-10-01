# app.py

from flask import Flask, request, jsonify, render_template, send_from_directory
import openai
import os
import subprocess
import pathlib
from accuracy_checker import calculate_accuracy

app = Flask(__name__)
openai.api_key = os.getenv("OPENAI_API_KEY")


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/scenes/<filename>")
def serve_scene_file(filename):
    return send_from_directory("scenes", filename)


@app.route("/transcribe-audio", methods=["POST"])
def transcribe_audio():
    audio_file = request.files.get("audio")

    if audio_file:
        print("Audio received. Processing...")

        # Directories for original and converted audio files
        original_audio_dir = pathlib.Path("audio-input/original")
        converted_audio_dir = pathlib.Path("audio-input/converted")
        original_audio_dir.mkdir(
            parents=True, exist_ok=True
        )  # Create the directory if it doesn't exist
        converted_audio_dir.mkdir(parents=True, exist_ok=True)

        # Determine the next available filename in the original audio directory
        existing_files = list(original_audio_dir.glob("*.wav"))
        print(
            f"Existing files in original directory: {existing_files}"
        )  # Log existing files
        next_file_num = len(existing_files) + 1
        temp_filename = original_audio_dir / f"audio_{next_file_num}.wav"

        # Save the audio file
        audio_file.save(temp_filename)
        print(f"Saved new audio file as: {temp_filename}")  # Log saved file name

        # Convert the audio file to WAV format using ffmpeg
        converted_filename = (
            converted_audio_dir / f"converted_audio_{next_file_num}.wav"
        )
        subprocess.run(["ffmpeg", "-i", str(temp_filename), str(converted_filename)])
        print(
            f"Converted audio saved as: {converted_filename}"
        )  # Log converted file name

        with open(converted_filename, "rb") as f:
            response = openai.Audio.transcribe("whisper-1", f)
            transcribed_text = response["text"]
            print("Transcription completed:", transcribed_text)
            return jsonify({"transcript": transcribed_text})


@app.route("/check-accuracy", methods=["POST"])
def check_accuracy_route():
    original_text = request.form.get("originalText", "")
    transcript = request.form.get("transcript", "")
    accuracy = calculate_accuracy(original_text, transcript)
    return jsonify({"accuracy": accuracy})


if __name__ == "__main__":
    app.run(debug=True)
