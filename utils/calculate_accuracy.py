import openai


def calculate_accuracy(original_text, transcript):
    completion = openai.ChatCompletion.create(
        model="gpt-3.5-turbo",
        messages=[
            {
                "role": "system",
                "content": "You will rate the accuracy of the transcript compared to the original text on a scale of 1 to 3. 1 being the least accurate and 3 being the most accurate. Please respond with only a number: 1, 2, or 3.",
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
