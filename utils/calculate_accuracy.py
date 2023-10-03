import string


def calculate_accuracy(original_text, transcript):
    # Remove punctuation from the texts
    translator = str.maketrans("", "", string.punctuation)
    original_text = original_text.translate(translator)
    transcript = transcript.translate(translator)

    # Tokenize both texts by spaces to get individual words
    original_words = original_text.split()
    transcript_words = transcript.split()

    # Calculate word accuracy
    matching_words = sum(1 for o, t in zip(original_words, transcript_words) if o == t)
    total_words = len(original_words)

    # Calculate word order accuracy
    order_matches = 0
    for i in range(min(len(original_words), len(transcript_words))):
        if original_words[i] == transcript_words[i]:
            order_matches += 1

    # Calculate overall accuracy percentage
    overall_accuracy = (matching_words + order_matches) / (2 * total_words)

    # Return a score based on the accuracy percentage
    if 0 <= overall_accuracy <= 0.20:
        return 1
    elif 0.21 <= overall_accuracy <= 0.84:
        return 2
    else:
        return 3
