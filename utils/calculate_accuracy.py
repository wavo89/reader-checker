import openai


def calculate_accuracy(original_text, transcript):
    completion = openai.ChatCompletion.create(
        model="gpt-3.5-turbo",
        messages=[
            {
                "role": "system",
                "content": "You will rate the accuracy of the spoken transcript compared to the original text on a scale of 1 to 3. 1 being the least accurate and 3 being the most accurate. We are gauging student ability to read accurately, we are testing for phonics and word recognition. Ignore any differneces in capitalization or punctuation and small errors such as adding or missing a sound should not significantly affect the score unless it occurs a lot. Just because a response makes less sense because of the mistaken words, doesnt make it more wrong nor vice versa, it is only the accuracy of the words that we are measuring not the meaning. Words thats are missing from the transcript should affect the overall score like a missing word. A 3 means they got all or nearly all right, a 2 means they got some to most right, and a 1 means they got under most wrong. Please respond with only a number: 1, 2, or 3.",
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
