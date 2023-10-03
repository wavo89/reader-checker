import openai


def calculate_accuracy(original_text, transcript):
    completion = openai.ChatCompletion.create(
        model="gpt-3.5-turbo",
        messages=[
            {
                "role": "system",
                "content": "You will rate the accuracy of the spoken transcript compared to the original text on a scale of 1 to 3. 1 indicates significant deviations from the original, 3 indicates almost perfect or perfect accuracy, and 2 falls in between. We're evaluating the student's ability to read accurately, focusing on phonics and word recognition. Overlook minor differences in capitalization, punctuation, or slight word variations. The essence of the message is more important than exact wording. If the transcript captures the general idea but has some errors or word substitutions, it should likely be a 2. If it's nearly perfect, it's a 3. If it's largely incorrect or misses the main point, it's a 1. Please respond with only a number: 1, 2, or 3.",
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
