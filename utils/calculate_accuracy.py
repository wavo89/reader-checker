import string
import re


def preprocess_text(text):
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
    total_words = len(original_words)
    matching_weight = 0

    # Clone the lists to not modify the original lists during removals
    original_clone = original_words.copy()
    transcript_clone = transcript_words.copy()

    # Check for exact matches first
    for o in original_clone:
        if o in transcript_clone:
            matching_weight += 1
            transcript_clone.remove(
                o
            )  # Remove the matched word so it won't be used again

    # Check for partial matches among the unmatched words
    for o in [word for word in original_clone if word not in transcript_clone]:
        if len(o) > 3:  # Only consider longer words for partial matches
            for t in transcript_clone:
                common_chars = sum(1 for char in o if char in t)
                overlap_percent = common_chars / len(o)
                if overlap_percent >= 0.7:  # Threshold for partial matches
                    matching_weight += overlap_percent  # Add the overlap percent to the matching weight
                    transcript_clone.remove(
                        t
                    )  # Remove the matched word so it won't be used again
                    break

    # Further adjusting the penalty factor
    missing_words = total_words - matching_weight
    penalty_factor = 1 - (0.02 * missing_words)

    return (matching_weight / total_words) * penalty_factor


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
    overall_accuracy = round((0.8 * word_accuracy + 0.2 * order_accuracy), 2)
    print(
        f"Word Accuracy: {word_accuracy*100:.2f}% (Weighted Matching Words: {word_accuracy*len(original_words):.2f}/{len(original_words)})"
    )
    print(
        f"Order Accuracy: {order_accuracy*100:.2f}% (Correct Order Matches: {order_accuracy*len(original_words):.2f}/{len(original_words)})"
    )
    print(f"Overall Accuracy: {overall_accuracy*100:.2f}%")
    if 0 <= overall_accuracy <= 0.50:
        return 1
    elif 0.51 <= overall_accuracy <= 0.85:
        return 2
    else:
        return 3
