import re

def clean_text(text):
    return re.sub(r'\s+', ' ', text.strip().lower())  # Replace multiple spaces with a single space