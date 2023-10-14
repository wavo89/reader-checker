from flask import (
    Flask,
    request,
    jsonify,
    render_template,
    send_from_directory,
    redirect,
    url_for,
)
import openai
import os
import subprocess
import pathlib
from utils.calculate_accuracy import calculate_accuracy, preprocess_text
import json

from utils.inspect_transcript import inspect_transcript

# from supabase_py import create_client

# import psycopg2

from supabase import create_client, Client

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(url, key)
# data = (
#     supabase.table("countries")
#     .update({"country": "Indonesia", "capital_city": "Jakarta"})
#     .eq("id", 1)
#     .execute()
# )


app = Flask(__name__)
openai.api_key = os.getenv("OPENAI_API_KEY")
# SUPABASE_URL = os.environ.get("SUPABASE_URL")
# SUPABASE_KEY = os.environ.get("SUPABASE_KEY")
# supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
# connection = psycopg2.connect(os.environ.get("POSTGRES_URI"))

# @app.route("/")
# def index():
#     scene_id = request.args.get("scene", "hex1")
#     username = request.args.get(
#         "username"
#     )  # Assume username is passed as a URL parameter
#     if "scene" not in request.args:
#         return redirect(url_for("index", scene=scene_id))
#     with open("scenes/scenes.json", "r") as f:
#         scenes = json.load(f)
#         scene = scenes.get(scene_id, scenes["hex1"])

#     # Fetch the viewed_scenes array for the user
#     response = (
#         supabase.table("user")
#         .select("viewed_scenes")
#         .eq("username", username)
#         .limit(1)
#         .execute()
#     )
#     data = response.get("data", [])
#     error = response.get("error", None)

#     if error:
#         viewed_scenes = []  # or handle error in some other way
#     elif data:
#         viewed_scenes = data[0].get("viewed_scenes", [])
#     else:
#         viewed_scenes = []  # User not found, or handle this case in some other way

#     return render_template(
#         "index.html", scene=scene, scene_id=scene_id, viewed_scenes=viewed_scenes
#     )


@app.route("/")
def index():
    scene_id = request.args.get("scene", "hex1")
    if "scene" not in request.args:
        return redirect(url_for("index", scene=scene_id))
    with open("scenes/scenes.json", "r") as f:
        scenes = json.load(f)
        scene = scenes.get(scene_id, scenes["hex1"])
    return render_template("index.html", scene=scene, scene_id=scene_id)


@app.route("/update-viewed-scenes", methods=["POST"])
def update_viewed_scenes():
    print("hi")
    username = request.form.get("username")
    scene_id = request.form.get("scene_id")
    print("username + sceneid: ", username, scene_id)
    # Fetch the current viewed_scenes array and user id for the user
    response = (
        supabase.table("user")
        .select("id, viewed_scenes")  # Modify this line to also select 'id'
        .eq("username", username)
        .limit(1)
        .execute()
    )
    print("response", response)
    data = response.data[0]
    # error = response.get("error", None)
    print("update scene data: ", data)
    # if error:
    #     return jsonify(success=False, error=str(error))

    if data:
        user_id = data["id"]
        viewed_scenes = data["viewed_scenes"]
        print("Type of viewed scenes 1: ", type(viewed_scenes))
        print("viewed scenes: ", viewed_scenes)
    else:
        return jsonify(success=False, error="User not found.")

    # Update the viewed_scenes array if the scene_id is not already in it
    if scene_id not in viewed_scenes:
        print("scenid not in viewed")
        viewed_scenes.append(scene_id)
        print("updated viewed scenes: ", viewed_scenes)
        print("Type of viewed scenes 2: ", type(viewed_scenes))
        response = (
            supabase.table("user")
            .update({"viewed_scenes": viewed_scenes})
            .eq("id", user_id)
            .execute()
        )
        # try:
        #     with connection.cursor() as cursor:
        #         # Prepare the query and the data
        #         query = """
        #             UPDATE "user"
        #             SET viewed_scenes = %s
        #             WHERE id = %s;
        #         """
        #         data = (viewed_scenes, user_id)

        #         # Execute the query
        #         cursor.execute(query, data)

        #     # Commit the transaction
        #     connection.commit()

        # except Exception as e:
        #     # Rollback the transaction in case of error
        #     connection.rollback()
        #     print(f"An error occurred: {e}")
        #     return jsonify(success=False, error=str(e))

        print("response viewed updated: ", response)
        # error = response.get("error", None)
        # if error:
        #     return jsonify(success=False, error=str(error))

    return jsonify(success=True)


@app.route("/check-viewed-scenes", methods=["POST"])
def check_viewed_scenes():
    print("check viewed")
    request_data = request.get_json()
    username = request_data.get("username")
    choice_scene_ids = request_data.get("choice_scene_ids", [])

    if not username:
        return jsonify(success=False, error="Username is required.")

    choice_viewed_status, error = get_choice_viewed_status(username, choice_scene_ids)

    if error:
        return jsonify(success=False, error=error)

    return jsonify(success=True, choice_viewed_status=choice_viewed_status)


def get_choice_viewed_status(username, choice_scene_ids):
    # Fetch the viewed_scenes array for the user
    response = (
        supabase.table("user")
        .select("viewed_scenes")
        .eq("username", username)
        .limit(1)
        .execute()
    )
    print("howdy response: ", response)
    data = response.data
    # error = response.get("error", None)

    # if error:
    #     return None, str(error)

    if data:
        viewed_scenes = data[0].get("viewed_scenes", [])
    else:
        return None, "User not found."

    # Check if the choice scenes have been viewed
    choice_viewed_status = {
        scene_id: scene_id in viewed_scenes for scene_id in choice_scene_ids
    }

    return choice_viewed_status, None


@app.route("/login", methods=["POST"])
def login():
    data = request.json
    username = data.get("username")
    provided_password = data.get("password")

    # Updated the syntax here:
    print(f"login with username: {username} {provided_password}")
    response = (
        supabase.table("user")
        .select("password, allow_click")
        .eq("username", username)
        .limit(1)
        .execute()
    )

    print("Full response:", response)
    data = response.data[0]
    print("data: ", data)
    # error = response.get("error", None)

    # if error:
    #     print(error)
    #     return jsonify(success=False, error=str(error))

    if data and "password" in data:
        stored_password = data["password"]
        allow_click = data["allow_click"]
    else:
        return jsonify(success=False, error="User not found.")

    print("provided pw: ", provided_password)
    print("stored pw: ", stored_password)

    if provided_password == stored_password:
        return jsonify(success=True, allow_click=allow_click)
    else:
        return jsonify(success=False, error="That combination doesn't work. Try again.")


@app.route("/check-allow-click", methods=["GET"])
def check_allow_click():
    username = request.args.get("username")
    if not username:
        return jsonify(success=False, error="Username not provided.")

    response = (
        supabase.table("user")
        .select("allow_click")
        .eq("username", username)
        .limit(1)
        .execute()
    )

    print("check response data: ", response)
    data = response.data[
        0
    ]  # assuming response.data is a list and you're interested in the first item
    count = response.count
    print("test count: ", count)
    # error = response.error

    # if error:
    #     print("error response data: ", response)
    #     # print("test error: " + error)
    #     return jsonify(success=False, error=str(error))

    if data:
        allow_click = data.get("allow_click", False)  # Default to False if not found
        return jsonify(success=True, allow_click=allow_click)
    else:
        return jsonify(success=False, error="User not found.")


@app.route("/toggle-allow-click", methods=["GET"])
def toggle_allow_click():
    # Get the value of the 'allow' parameter from the URL query string
    allow = request.args.get("allow", "false").lower() == "true"

    print(f"Allow: {allow}")  # Log the allow value
    # Fetch all ids from the 'user' table
    response = supabase.table("user").select("id").execute()
    ids = [item["id"] for item in response.data[0]]  # Extract ids from response data
    print(f"User IDs: {ids}")  # Log the user IDs

    # Check for any errors in the response
    error = response.error
    if error:
        print(f"Error fetching user IDs: {error}")  # Log any error fetching user IDs
        return jsonify(success=False, error=str(error))

    # If no errors, loop through each id and update the 'allow_click' field
    for user_id in ids:
        response = (
            supabase.table("user")
            .update({"allow_click": allow})
            .eq("id", user_id)
            .execute()
        )
        error = response.error
        print(response)
        if error:
            print(
                f"Error updating user {user_id}: {error}"
            )  # Log any error updating a user
            return jsonify(
                success=False, error=str(error)
            )  # Return error if any update fails

    # If all updates succeed, return a success response
    return jsonify(success=True, message="Updated allow_click for all users.")


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
