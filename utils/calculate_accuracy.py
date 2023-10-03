import string


def calculate_accuracy(original_text, transcript):
    # Convert texts to lowercase
    original_text = original_text.lower()
    transcript = transcript.lower()

    # Remove punctuation from the texts
    translator = str.maketrans("", "", string.punctuation)
    original_text = original_text.translate(translator)
    transcript = transcript.translate(translator)

    # Tokenize both texts by spaces to get individual words
    original_words = original_text.split()
    transcript_words = transcript.split()

    # Calculate word accuracy with adjusted weights
    total_weight = sum(0.25 if len(o) <= 3 else 1 for o in original_words)
    matching_weight = sum(
        0.25 if len(o) <= 3 else 1 for o in original_words if o in transcript_words
    )
    word_accuracy = matching_weight / total_weight

    # Calculate word order accuracy with a penalty for added words
    order_matches = 0
    transcript_index = 0
    for o in original_words:
        if (
            transcript_index < len(transcript_words)
            and o == transcript_words[transcript_index]
        ):
            order_matches += 1
            transcript_index += 1
        elif o in transcript_words[transcript_index:]:
            transcript_index = transcript_words.index(o, transcript_index) + 1
    added_words_penalty = len(transcript_words) - len(original_words)
    order_accuracy = order_matches / (len(original_words) + max(0, added_words_penalty))

    # Calculate overall accuracy percentage
    overall_accuracy = (word_accuracy + order_accuracy) / 2

    # Print the percentages and a summary of the numbers
    print(
        f"Word Accuracy: {word_accuracy*100:.2f}% (Weighted Matching Words: {matching_weight:.2f}/{total_weight})"
    )
    print(
        f"Order Accuracy: {order_accuracy*100:.2f}% (Correct Order Matches: {order_matches}/{len(original_words)})"
    )
    print(f"Overall Accuracy: {overall_accuracy*100:.2f}%")

    # Return a score based on the accuracy percentage
    if 0 <= overall_accuracy <= 0.50:
        return 1
    elif 0.51 <= overall_accuracy <= 0.84:
        return 2
    else:
        return 3
