import json
import random

# Load dataset
def load_dataset():
    with open('dataset.json', 'r', encoding='utf-8') as f:
        dataset = json.load(f)
    return remove_duplicates(dataset)

# Remove duplicate questions
def remove_duplicates(dataset):
    seen = set()
    unique_dataset = []
    for item in dataset:
        item_tuple = (item['category'], item['prompt'])
        if item_tuple not in seen:
            unique_dataset.append(item)
            seen.add(item_tuple)
    return unique_dataset

# Organize questions by category
def organize_questions(dataset):
    questions_by_category = {}
    for item in dataset:
        category = item['category']
        if category not in questions_by_category:
            questions_by_category[category] = []
        questions_by_category[category].append(item)
    return questions_by_category

# Select random questions
def select_random_questions(questions_by_category):
    selected_questions = []

    # Always select the first two questions from the "Ice Breaking" category
    if "Ice Breaking" in questions_by_category:
        ice_breaking_questions = questions_by_category["Ice Breaking"]
        random.shuffle(ice_breaking_questions)
        selected_questions.extend(ice_breaking_questions[:2])  # Select the first two ice breaking questions
        

    # Select random questions from other categories (if available)
    for category, questions in questions_by_category.items():
        if category != "Ice Breaking":
            random.shuffle(questions)
            selected_questions.extend(questions[:2])  # Select up to 2 random questions from each other category

    print("total questions:", len(selected_questions))
    return selected_questions
