def calculate_accuracy(original_text, transcript):
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

    # Calculate percentages
    word_accuracy_percentage = (matching_words / total_words) * 100
    word_order_accuracy_percentage = (order_matches / total_words) * 100

    return word_accuracy_percentage, word_order_accuracy_percentage
