import string
import re


def preprocess_text(text):
    # Remove characters not in the specified range
    text = re.sub(
        r"[^a-zA-Z\s"
        + string.punctuation
        + "áéíóúÁÉÍÓÚüÜñÑçÇöÖäÄëËïÏâêîôûÂÊÎÔÛàèìòùÀÈÌÒÙ]",
        "",
        text,
    )
    return text


def calculate_word_accuracy(original_words, transcript_words):
    total_words = len(original_words)
    matching_weight = sum(1 for word in original_words if word in transcript_words)

    # Adjusting the penalty factor using a simpler approach
    missing_words = total_words - matching_weight
    penalty_factor = 1 - (0.1 * missing_words / total_words)

    return max(0, min(1, (matching_weight / total_words) * penalty_factor))


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


def preprocess_for_comparison(text):
    """Removes punctuation and converts text to lowercase."""
    text = text.lower()
    # Remove punctuation
    text = "".join(ch for ch in text if ch not in set(string.punctuation))
    return text


def calculate_accuracy(original_text, transcript):
    original_text = preprocess_for_comparison(original_text)
    transcript = preprocess_for_comparison(transcript)
    original_words = original_text.split()
    transcript_words = transcript.split()
    word_accuracy = calculate_word_accuracy(original_words, transcript_words)
    order_accuracy = calculate_order_accuracy(original_words, transcript_words)
    overall_accuracy = round((0.8 * word_accuracy + 0.2 * order_accuracy), 2)
    print(
        f"Word Accuracy: {word_accuracy*100:.2f}% (Weighted Matching Words: {word_accuracy*len(original_words):.2f}/{len(original_words)})"
    )
    print(
        f"Order Accuracy: {order_accuracy*100:.2f}% (Correct Order Matches: {order_accuracy*len(original_words):.2f}/{len(original_words)})"
    )
    print(f"Overall Accuracy: {overall_accuracy*100:.2f}%")

    lower_threshold = 0.40
    upper_threshold = 0.85
    if 0 <= overall_accuracy <= lower_threshold:
        return 1
    elif lower_threshold <= overall_accuracy <= upper_threshold:
        return 2
    else:
        return 3
