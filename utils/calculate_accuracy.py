import string


def preprocess_text(text):
    text = text.lower()
    translator = str.maketrans("", "", string.punctuation)
    return text.translate(translator)


def calculate_word_accuracy(original_words, transcript_words):
    total_weight = sum(0.25 if len(o) <= 3 else 1 for o in original_words)
    matching_weight = sum(
        0.25 if len(o) <= 3 else 1 for o in original_words if o in transcript_words
    )
    return matching_weight / total_weight


def calculate_order_accuracy(original_words, transcript_words):
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
    return order_matches / (len(original_words) + max(0, added_words_penalty))


def calculate_accuracy(original_text, transcript):
    original_text = preprocess_text(original_text)
    transcript = preprocess_text(transcript)

    original_words = original_text.split()
    transcript_words = transcript.split()

    word_accuracy = calculate_word_accuracy(original_words, transcript_words)
    order_accuracy = calculate_order_accuracy(original_words, transcript_words)
    overall_accuracy = (word_accuracy + order_accuracy) / 2

    # Print the percentages and a summary of the numbers
    print(
        f"Word Accuracy: {word_accuracy*100:.2f}% (Weighted Matching Words: {word_accuracy*len(original_words):.2f}/{len(original_words)})"
    )
    print(
        f"Order Accuracy: {order_accuracy*100:.2f}% (Correct Order Matches: {order_accuracy*len(original_words):.2f}/{len(original_words)})"
    )
    print(f"Overall Accuracy: {overall_accuracy*100:.2f}%")

    # Return a score based on the accuracy percentage
    if 0 <= overall_accuracy <= 0.40:
        return 1
    elif 0.41 <= overall_accuracy <= 0.84:
        return 2
    else:
        return 3
