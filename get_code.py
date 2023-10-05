import os


def find_files_in_specific_directory(directory, file_names):
    """Find the specified file names in the given directory only (no subdirectories)."""
    found_files = []

    for file in os.listdir(directory):
        if file in file_names:
            found_files.append(os.path.join(directory, file))

    return found_files


def concatenate_files_to_output(file_list, output_filename):
    """Concatenate the content of the files in the list into a single output file."""
    with open(output_filename, "w") as outfile:
        for file in file_list:
            outfile.write(f"===== {file} =====\n")
            with open(file, "r") as infile:
                content = infile.read()
                outfile.write(content)
                outfile.write("\n\n")


if __name__ == "__main__":
    # List of directories to search in
    fileDirs = [".", "static/js", "static/css", "templates", "utils"]
    # List of file names to look for
    fileNames = [
        "app.py",
        "scripts.js",
        "index.html",
        "style.css",
        "calculate_accuracy.py",
    ]

    # Output filename
    output_file = "combined_files.txt"

    all_found_files = []

    for directory in fileDirs:
        all_found_files.extend(find_files_in_specific_directory(directory, fileNames))

    concatenate_files_to_output(all_found_files, output_file)

    print(f"Files have been combined into '{output_file}'")
