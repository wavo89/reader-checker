def calculate_accuracy(original, transcribed):
    if original == transcribed:
        return 100
    else:
        return (
            len(set(original.split()) & set(transcribed.split()))
            / len(set(original.split()))
        ) * 100
