import openai


def calculate_accuracy(original_text, transcript):
    completion = openai.ChatCompletion.create(
        model="gpt-3.5-turbo",
        messages=[
            {
                "role": "system",
                "content": "Ignore all meaning of original and transcript, we are only looking at word similarity. Do not penalize if the meaning of the wrong word is far off, that has no affect outside of being wrong.",
            },
            {
                "role": "user",
                "content": f"Doc1: {original_text}. Doc2: {transcript}. Compare the . Compare doc1 and doc2, ignore differences in capitalization and punctuation. Your focus is solely on the accuracy of individual words and not meaning. If they match almost nearly, give a 3. If they have mostly matching words, give a 2. If barely any words match, give a 1. Ignore the meaning of the words. Be lenient. Respond with a single number: 1, 2, or 3.",
            },
        ],
    )

    response_content = completion.choices[0].message.content.strip()

    # Validate the response
    if response_content not in ["1", "2", "3"]:
        raise ValueError("Unexpected response from the model.")

    return int(response_content)
