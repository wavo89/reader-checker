import openai


def calculate_accuracy(original_text, transcript):
    completion = openai.ChatCompletion.create(
        model="gpt-3.5-turbo",
        messages=[
            {
                "role": "system",
                "content": "Ignore all meaning of original and transcript, we are only looking at word similarity. A '3' means 90-100 percent of the words match nearly exactly, a '2' means 40-21 percent of the words match, and a '1' means less than 20 percent of the words match. Disregard differences in capitalization and punctuation. Your focus is solely on the accuracy of individual words. Respond with a single number: 1, 2, or 3. Do not penalize if the meaning of the wrong word is far off, that has no affect outside of being wrong.",
            },
            {
                "role": "user",
                "content": f"Original: {original_text}. Transcript: {transcript}. How accurate is the transcript?",
            },
        ],
    )

    response_content = completion.choices[0].message.content.strip()

    # Validate the response
    if response_content not in ["1", "2", "3"]:
        raise ValueError("Unexpected response from the model.")

    return int(response_content)
