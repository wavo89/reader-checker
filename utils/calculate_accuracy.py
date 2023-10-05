import string


def preprocess_text(text):
    text = text.lower()
    translator = str.maketrans("", "", string.punctuation)
    return text.translate(translator)


def calculate_word_accuracy(original_words, transcript_words):
    total_weight = sum(0.25 if len(o) <= 3 else 1 for o in original_words)
    matching_weight = 0

    for o in original_words:
        if o in transcript_words:
            matching_weight += 0.25 if len(o) <= 3 else 1
        else:
            # Check for partial matches
            for t in transcript_words:
                common_chars = sum(1 for char in o if char in t)
                if common_chars / len(o) >= 0.25:
                    matching_weight += (
                        0.25 if len(o) <= 3 else 1
                    ) * 0.75  # Penalize by 1/4 of its weight
                    break

    return matching_weight / total_weight


import string


def preprocess_text(text):
    text = text.lower()
    translator = str.maketrans("", "", string.punctuation)
    return text.translate(translator)


def calculate_word_accuracy(original_words, transcript_words):
    total_weight = sum(0.25 if len(o) <= 3 else 1 for o in original_words)
    matching_weight = 0

    for o in original_words:
        if o in transcript_words:
            matching_weight += 0.25 if len(o) <= 3 else 1
        else:
            # Check for partial matches
            for t in transcript_words:
                common_chars = sum(1 for char in o if char in t)
                if common_chars / len(o) >= 0.25:
                    matching_weight += (
                        0.25 if len(o) <= 3 else 1
                    ) * 0.75  # Penalize by 1/4 of its weight
                    break

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
    overall_accuracy = round((word_accuracy + order_accuracy) / 2, 2)

    print(
        f"Word Accuracy: {word_accuracy*100:.2f}% (Weighted Matching Words: {word_accuracy*len(original_words):.2f}/{len(original_words)})"
    )
    print(
        f"Order Accuracy: {order_accuracy*100:.2f}% (Correct Order Matches: {order_accuracy*len(original_words):.2f}/{len(original_words)})"
    )
    print(f"Overall Accuracy: {overall_accuracy*100:.2f}%")

    if 0 <= overall_accuracy <= 0.40:
        return 1
    elif 0.41 <= overall_accuracy <= 0.84:
        return 2
    else:
        return 3


def calculate_accuracy(original_text, transcript):
    original_text = preprocess_text(original_text)
    transcript = preprocess_text(transcript)

    original_words = original_text.split()
    transcript_words = transcript.split()

    word_accuracy = calculate_word_accuracy(original_words, transcript_words)
    order_accuracy = calculate_order_accuracy(original_words, transcript_words)
    overall_accuracy = round((word_accuracy + order_accuracy) / 2, 2)

    print(
        f"Word Accuracy: {word_accuracy*100:.2f}% (Weighted Matching Words: {word_accuracy*len(original_words):.2f}/{len(original_words)})"
    )
    print(
        f"Order Accuracy: {order_accuracy*100:.2f}% (Correct Order Matches: {order_accuracy*len(original_words):.2f}/{len(original_words)})"
    )
    print(f"Overall Accuracy: {overall_accuracy*100:.2f}%")

    if 0 <= overall_accuracy <= 0.40:
        return 1
    elif 0.41 <= overall_accuracy <= 0.84:
        return 2
    else:
        return 3
