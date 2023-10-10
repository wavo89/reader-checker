import openai


def inspect_transcript(transcript):
    """
    Checks if the given transcript contains any inappropriate content using GPT-3.5.
    Returns 0 if any inappropriate content is found, otherwise returns 1.
    """
    # Create a prompt for GPT-3.5
    prompt = f"Review this text for any inappropriate or innuendo content: '{transcript}'. Is it inappropriate?"

    # Use openai.ChatCompletion (as shown in the example) to get a response from GPT-3.5
    response = openai.ChatCompletion.create(
        model="gpt-3.5-turbo", messages=[{"role": "user", "content": prompt}]
    )

    # Extract the GPT-3.5 response
    gpt_response = response["choices"][0]["message"]["content"]
    print("GPT response:", gpt_response)
    # gpt_response = response["choices"][0]["message"]["content"].strip().lower()

    # Check the response and return the appropriate value
    # if "yes" in gpt_response or "inappropriate" in gpt_response:
    #     print("GPT response: 0")
    #     return 0
    # else:
    #     print("GPT response: 1")
    #     return 1
