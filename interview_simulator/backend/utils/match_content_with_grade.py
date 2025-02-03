from fuzzywuzzy import fuzz
from .clean_text import clean_text

def match_and_extract_grade(content, dataset, history_entry, history):
    # Clean and standardize the content of the assistant's entry
    content = clean_text(content.strip().lower())

    # Loop through the history to find the corresponding user response to the assistant's content
    for idx, entry in enumerate(history):
        # Check if this entry is an assistant response
        if entry.get("role") == "assistant" and clean_text(entry.get("content", "").strip().lower()) == content:
            print("MATCHED CONTENT:", content)
            print("ASSISTANT RESPONSE:", entry.get("content"))

            # Now, look for the corresponding user response in the history
            if idx + 1 < len(history) and history[idx + 1].get("role") == "user":
                user_entry = history[idx + 1]
                print("USER RESPONSE:", user_entry.get("content"))
                # Extract grade from the user response
                grade = user_entry.get("grade")
                print("GRADE:", grade)

                # If a grade exists, return the matched category and the grade
                if grade:
                    # Look for matching dataset entry to find the category
                    for dataset_entry in dataset:
                        dataset_prompt = clean_text(dataset_entry.get("prompt", "").strip().lower())
                        similarity = fuzz.ratio(content, dataset_prompt)
                        if similarity > 80:  # Adjust the threshold as necessary
                            matched_category = dataset_entry.get("category", None)
                            print("CATEGORY:", matched_category)

                            try:
                                return matched_category, float(grade)
                            except ValueError:
                                print(f"Invalid grade format: {grade}")
    return None, None