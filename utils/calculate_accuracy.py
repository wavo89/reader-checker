import openai


def calculate_accuracy(original_text, transcript):
    completion = openai.ChatCompletion.create(
        model="gpt-3.5-turbo",
        messages=[
            {
                "role": "system",
                "content": "Ignore all meaning of original and transcript, we are only looking at word similarity. You are to evaluate the accuracy of the transcript's wording in relation to the original text, strictly based on word presence and order. Use this scale: A '3' means 90-100 percent of the words match exactly, a '2' means 40-89 percent of the words match, and a '1' means less than 39 percent of the words match. Disregard differences in capitalization, punctuation, and the overall meaning conveyed by the transcript. Your focus is solely on the accuracy of individual words. Respond with a single number: 1, 2, or 3. Ignore all meaning of original and transcript.",
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
