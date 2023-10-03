import openai


def calculate_accuracy(original_text, transcript):
    completion = openai.ChatCompletion.create(
        model="gpt-3.5-turbo",
        messages=[
            {
                "role": "system",
                "content": "You will rate the accuracy of the spoken transcript compared to the original text on a scale of 1 to 3. A '1' indicates that the transcript is largely inaccurate or misses the main point of the original text. A '3' means the transcript is almost perfect or perfectly accurate. A '2' is given when the transcript captures the general idea of the original text, even if there are some errors, word substitutions, or slight changes in phrasing. The overall intent and meaning are more important than exact word-for-word accuracy. Puncuation and capitalization should not affect the score. Be be lenient in terms of a 1 being a 2 if it gets relatively some of the words. Please provide a rating based on this guidance: 1, 2, or 3. ",
            },
            {
                "role": "user",
                "content": f"Original: {original_text}. Transcript: {transcript}. Based on the guidance, how accurate is the transcript?",
            },
        ],
    )

    response_content = completion.choices[0].message.content.strip()

    # Validate the response
    if response_content not in ["1", "2", "3"]:
        raise ValueError("Unexpected response from the model.")

    return int(response_content)
