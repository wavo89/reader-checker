from flask import Flask, request, jsonify, render_template
import openai
import os
import subprocess
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

        # Save the audio file temporarily
        temp_filename = "temp_audio"
        audio_file.save(temp_filename)

        # Convert the audio file to WAV format using ffmpeg
        converted_filename = "converted_audio.wav"
        subprocess.run(["ffmpeg", "-i", temp_filename, converted_filename])

        with open(converted_filename, "rb") as f:
            response = openai.Audio.transcribe("whisper-1", f)
            transcribed_text = response["text"]
            print("Transcription completed:", transcribed_text)
            os.remove(temp_filename)
            os.remove(converted_filename)
            return jsonify({"transcript": transcribed_text})


@app.route("/check-accuracy", methods=["POST"])
def check_accuracy_route():
    original_text = request.form.get("originalText", "")
    transcript = request.form.get("transcript", "")
    accuracy = calculate_accuracy(original_text, transcript)
    return jsonify({"accuracy": accuracy})


if __name__ == "__main__":
    app.run(debug=True)
