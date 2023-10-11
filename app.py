from flask import Flask, request, jsonify, render_template, send_from_directory
import openai
import os
import subprocess
import pathlib
from utils.calculate_accuracy import calculate_accuracy, preprocess_text
import json

from utils.inspect_transcript import inspect_transcript
from supabase_py import create_client

app = Flask(__name__)
openai.api_key = os.getenv("OPENAI_API_KEY")
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)


@app.route("/")
def index():
    scene_id = request.args.get("scene", "hex1")
    with open("scenes/scenes.json", "r") as f:
        scenes = json.load(f)
        scene = scenes.get(scene_id, scenes["hex1"])
    return render_template("index.html", scene=scene, scene_id=scene_id)


@app.route("/login", methods=["POST"])
def login():
    data = request.json
    username = data.get("username")
    provided_password = data.get("password")

    # Updated the syntax here:
    print("login with username: ", username, " ", provided_password)
    response = (
        supabase.table("user")
        .select("password")
        .eq("username", username)
        .limit(1)
        .execute()
    )
    # response = supabase.table("account").select("*").execute()

    print("Full response:", response)
    data = response.get("data", [])
    print("data: ", data)
    error = response.get("error", None)

    if error:
        print(error)
        return jsonify(success=False, error=str(error))

    if data and "password" in data[0]:
        stored_password = data[0].get("password")
    else:
        return jsonify(success=False, error="User not found")

    print("provided pw: ", provided_password)
    print("stored pw: ", stored_password)

    if provided_password == stored_password:
        return jsonify(success=True)
    else:
        return jsonify(success=False, error="That combination doesn't work. Try again.")


@app.route("/get-scene")
def get_scene():
    scene_id = request.args.get("scene", "hex1")
    with open("scenes/scenes.json", "r") as f:
        scenes = json.load(f)
        scene = scenes.get(scene_id, scenes["hex1"])
    return jsonify(scene)


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

    try:
        with open(converted_filename, "rb") as f:
            response = openai.Audio.transcribe("whisper-1", f)
            transcribed_text = response["text"]
            print("Transcription completed:", transcribed_text)
    except Exception as e:
        print(f"Error during transcription: {e}")
        transcribed_text = "Error"

    # Preprocess the transcribed_text
    transcribed_text = preprocess_text(transcribed_text)

    # Compare the transcribed audio with each choice
    accuracies = {}
    for key in request.form.keys():
        if key.startswith("choice_"):
            choice_text = request.form.get(key)
            accuracy = calculate_accuracy(choice_text, transcribed_text)
            accuracies[key] = accuracy
            print(
                f"Comparing with {choice_text}"
            )  # <-- This line prints the choice text
            print(f"Calculated Accuracy for {key}: {accuracy}")

    # Determine which choice is closer to the transcription
    closest_choice = max(accuracies, key=accuracies.get)
    closest_choice_accuracy = accuracies[closest_choice]
    print(f"Closest Choice: {closest_choice}")

    if not inspect_transcript(transcribed_text):
        transcribed_text = "Error"

    return jsonify(
        {
            "transcript": transcribed_text,
            "accuracies": accuracies,
            "closest_choice_id": closest_choice,  # Return the ID of the button element
            "closest_choice_accuracy": closest_choice_accuracy,
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
