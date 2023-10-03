import openai


def calculate_accuracy(original_text, transcript):
    completion = openai.ChatCompletion.create(
        model="gpt-3.5-turbo",
        messages=[
            {
                "role": "system",
                "content": "You will rate the accuracy of the spoken transcript compared to the original text on a scale of 1 to 3. 1 being the least accurate and 3 being the most accurate. We are gauging student ability to read accurately, we are basically testing for phonics and word recognition. A 3 means they got 90-100 percent of words right, a 2 means they got 40-89 percent right, and a 1 means they got under 39 percent. Thats a rough guide. Ignore any differneces in capitalization or punctuation and small errors such as adding or missing a sound should not significantly affect the score unless it occurs a lot. If a word has a meaning that does not belong, do not take away more points, it should affect the score the same whether it makes sense or not if its wrong either way. Please respond with only a number: 1, 2, or 3.",
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
