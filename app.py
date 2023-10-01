from flask import Flask, request, jsonify, render_template
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


@app.route("/transcribe-audio", methods=["POST"])
def transcribe_audio():
    audio_file = request.files.get("audio")

    if audio_file:
        print("Audio received. Processing...")

        # Determine the next available filename in the audio-input directory
        audio_dir = pathlib.Path("audio-input")
        audio_dir.mkdir(exist_ok=True)  # Create the directory if it doesn't exist
        existing_files = list(audio_dir.glob("*.wav"))
        next_file_num = len(existing_files) + 1
        temp_filename = audio_dir / f"audio_{next_file_num}.wav"

        # Save the audio file
        audio_file.save(temp_filename)

        # Convert the audio file to WAV format using ffmpeg (if needed)
        converted_filename = audio_dir / f"converted_audio_{next_file_num}.wav"
        subprocess.run(["ffmpeg", "-i", str(temp_filename), str(converted_filename)])

        with open(converted_filename, "rb") as f:
            response = openai.Audio.transcribe("whisper-1", f)
            transcribed_text = response["text"]
            print("Transcription completed:", transcribed_text)
            # No need to remove the file if you want to keep it
            return jsonify({"transcript": transcribed_text})


@app.route("/check-accuracy", methods=["POST"])
def check_accuracy_route():
    original_text = request.form.get("originalText", "")
    transcript = request.form.get("transcript", "")
    accuracy = calculate_accuracy(original_text, transcript)
    return jsonify({"accuracy": accuracy})


if __name__ == "__main__":
    app.run(debug=True)
