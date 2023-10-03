def calculate_accuracy(original_text, transcript):
    completion = openai.ChatCompletion.create(
        model="gpt-3.5-turbo",
        messages=[
            {
                "role": "system",
                "content": "Your task is to evaluate the accuracy of a spoken transcript compared to the original text. The focus is on phonics and word recognition. Disregard differences in capitalization, punctuation, and minor sound additions or omissions. The meaning of the sentence is not the primary concern; instead, focus on the exactness of the words. Rate the accuracy on a scale of 1 to 3: \n\n1: The transcript has many errors and deviates significantly from the original.\n2: The transcript has some errors but retains parts of the original content.\n3: The transcript is nearly identical or matches the original text closely.\n\nPlease provide a rating based on the given scale.",
            },
            {
                "role": "user",
                "content": f"Original: {original_text}. Transcript: {transcript}. Based on the criteria, how accurate is the transcript?",
            },
        ],
    )

    response_content = completion.choices[0].message.content.strip()

    # Validate the response
    if response_content not in ["1", "2", "3"]:
        raise ValueError("Unexpected response from the model.")

    return int(response_content)
