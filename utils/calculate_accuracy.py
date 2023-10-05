import string
import re  # Import the regular expressions module


def preprocess_text(text):
    # Remove non-Latin characters and retain punctuation
    # This regex pattern includes Latin-based characters, including accented characters, whitespace, and punctuation.
    text = re.sub(
        r"[^a-zA-Z\s"
        + string.punctuation
        + "áéíóúÁÉÍÓÚüÜñÑçÇöÖäÄëËïÏâêîôûÂÊÎÔÛàèìòùÀÈÌÒÙ]",
        "",
        text,
    )

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


def longest_common_subsequence(X, Y):
    m = len(X)
    n = len(Y)
    L = [[0] * (n + 1) for i in range(m + 1)]
    for i in range(m + 1):
        for j in range(n + 1):
            if i == 0 or j == 0:
                L[i][j] = 0
            elif X[i - 1] == Y[j - 1]:
                L[i][j] = L[i - 1][j - 1] + 1
            else:
                L[i][j] = max(L[i - 1][j], L[i][j - 1])
    return L[m][n]


def calculate_order_accuracy(original_words, transcript_words):
    lcs = longest_common_subsequence(original_words, transcript_words)
    return lcs / len(original_words)


def calculate_accuracy(original_text, transcript):
    original_text = preprocess_text(original_text)
    transcript = preprocess_text(transcript)

    original_words = original_text.split()
    transcript_words = transcript.split()

    word_accuracy = calculate_word_accuracy(original_words, transcript_words)
    order_accuracy = calculate_order_accuracy(original_words, transcript_words)
    overall_accuracy = round(
        (0.6 * word_accuracy + 0.4 * order_accuracy), 2
    )  # Adjusted weights

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
