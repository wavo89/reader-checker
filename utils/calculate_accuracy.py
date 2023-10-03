import openai


def calculate_accuracy(original_text, transcript):
    completion = openai.ChatCompletion.create(
        model="gpt-3.5-turbo",
        messages=[
            {
                "role": "system",
                "content": "You will rate the accuracy of the transcript compared to the original text on a scale of 1 to 3. 1 being the least accurate and 3 being the most accurate.",
            },
            {
                "role": "user",
                "content": f"Original: {original_text}. Transcript: {transcript}. How accurate is the transcript?",
            },
        ],
    )
    response_content = completion.choices[0].message.content
    # Extract the number from the response
    accuracy = int("".join(filter(str.isdigit, response_content.split()[-1])))

    return accuracy
