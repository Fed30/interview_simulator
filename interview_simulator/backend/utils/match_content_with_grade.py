from .clean_text import clean_text

def match_and_extract_grade(content, history):
    # Clean and standardize the content of the assistant's entry
    content = clean_text(content.strip().lower())

    # Loop through the history to find the corresponding user response to the assistant's content
    for idx, entry in enumerate(history):
        # Check if this entry is an assistant response
        if entry.get("role") == "assistant" and clean_text(entry.get("content", "").strip().lower()) == content:
            #print("MATCHED CONTENT:", content)
            print("ASSISTANT: ", entry.get("content"))

            # Now, look for the corresponding user response in the history
            if idx + 1 < len(history) and history[idx + 1].get("role") == "user":
                user_entry = history[idx + 1]
                print("USER RESPONSE:", user_entry.get("content"))
                # Extract grade from the user response
                grade = user_entry.get("grade")
                print("GRADE:", grade)

                # If a grade exists, return the matched category and the grade
                if grade:
                    # Extract category directly from the assistant's message
                    matched_category = entry.get("category", None)
                    print("CATEGORY:", matched_category)

                    try:
                        return matched_category, float(grade)
                    except ValueError:
                        print(f"Invalid grade format: {grade}")
    return None, None
