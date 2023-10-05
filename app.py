from flask import Flask, request, jsonify, render_template, send_from_directory
import openai
import os
import subprocess
import pathlib
from utils.calculate_accuracy import calculate_accuracy
import json

app = Flask(__name__)
openai.api_key = os.getenv("OPENAI_API_KEY")


@app.route("/")
def index():
    scene_id = request.args.get("scene", "hex1")
    with open("scenes/scenes.json", "r") as f:
        scenes = json.load(f)
        scene = scenes.get(scene_id, scenes["hex1"])
    return render_template("index.html", scene=scene)


@app.route("/scenes/<filename>")
def serve_scene_file(filename):
    return send_from_directory("scenes", filename)


@app.route("/transcribe-audio", methods=["POST"])
def transcribe_audio():
    audio_file = request.files.get("audio")

    if audio_file:
        audio_file_size = len(audio_file.read())
        audio_file.seek(0)
        size_limit = 1 * 1024 * 1024

        if audio_file_size > size_limit:
            return jsonify({"error": "Audio file size exceeds 1MB. Not processing."})

        print("Audio received. Processing...")
        original_audio_dir = pathlib.Path("audio-input/original")
        converted_audio_dir = pathlib.Path("audio-input/converted")
        original_audio_dir.mkdir(parents=True, exist_ok=True)
        converted_audio_dir.mkdir(parents=True, exist_ok=True)

        existing_files = list(original_audio_dir.glob("*.wav"))
        print(f"Existing files in original directory: {existing_files}")
        next_file_num = len(existing_files) + 1
        temp_filename = original_audio_dir / f"audio_{next_file_num}.wav"

        audio_file.save(temp_filename)
        print(f"Saved new audio file as: {temp_filename}")

        converted_filename = (
            converted_audio_dir / f"converted_audio_{next_file_num}.wav"
        )
        result = subprocess.run(
            ["ffmpeg", "-i", str(temp_filename), str(converted_filename)],
            capture_output=True,
            text=True,
        )

        if result.returncode != 0:
            return jsonify({"error": "Audio conversion failed."})

        if not converted_filename.exists():
            return jsonify({"error": "Converted audio file not found."})

        with open(converted_filename, "rb") as f:
            response = openai.Audio.transcribe("whisper-1", f)
            transcribed_text = response["text"]
            print("Transcription completed:", transcribed_text)

            # Compare the transcribed audio with each choice
            accuracies = {}
            for key in request.form.keys():
                if key.startswith("choice_"):
                    choice_text = request.form.get(key)
                    accuracy = calculate_accuracy(choice_text, transcribed_text)
                    accuracies[key] = accuracy
                    print(f"Calculated Accuracy for {key}: {accuracy}")

            # Determine which choice is closer to the transcription
            closest_choice = max(accuracies, key=accuracies.get)
            print(f"Closest Choice: {closest_choice}")

            return jsonify(
                {
                    "transcript": transcribed_text,
                    "accuracies": accuracies,
                    "closest_choice": closest_choice,
                }
            )

    return jsonify({"error": "No audio received."})


@app.route("/check-accuracy", methods=["POST"])
def check_accuracy_route():
    original_text = request.form.get("originalText", "")
    transcript = request.form.get("transcript", "")
    print(f"Original Text: {original_text}")
    print(f"Transcript: {transcript}")
    accuracy = calculate_accuracy(original_text, transcript)
    print(f"Calculated Accuracy: {accuracy}")
    return jsonify({"accuracy": accuracy})


if __name__ == "__main__":
    app.run(debug=True, port=5001)
