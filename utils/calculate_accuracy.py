import openai


def calculate_accuracy(original_text, transcript):
    completion = openai.ChatCompletion.create(
        model="gpt-3.5-turbo",
        messages=[
            {
                "role": "system",
                "content": "You will rate the accuracy of the spoken transcript compared to the original text on a scale of 1 to 3. A '1' indicates that the transcript is largely inaccurate or misses the main point of the original text. A '3' means the transcript is almost perfect or perfectly accurate. A '2' is given when the transcript captures the general idea of the original text, even if there are some errors, word substitutions, or slight changes in phrasing. The overall intent and meaning are more important than exact word-for-word accuracy. Puncuation and capitalization should not affect the score. Over 85 percent correct should be 3, between 20 and 85 percent should be 2, and under 20 percent should be a 1. Semantic meaning should not affect the score, only the accuracy of the words. Only respond with the number for the rating: 1, 2, or 3. ",
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
