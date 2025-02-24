from openai_config import openai


def get_grade_from_openai(response,ideal_response, question):
    try:
        messages = [
            {"role": "system", "content": (
                "You are a helpful assistant that grades responses based on the STAR method (Situation, Task, Action, Result). "
                "Evaluate how well the response adheres to the STAR framework. Assign a grade from 1 to 10, with 10 being excellent "
                "and 1 being very poor. Only return the grade as a number, without any extra text."
            )},
            {"role": "assistant", "content": question},  # The question being asked
            {"role": "user", "content": response},  # The user's response to grade
            {"role": "system", "content": ideal_response} # The ideal response from dataset
        ]

        # Call OpenAI's API to grade the response
        completion = openai.chat.completions.create(
            model="gpt-3.5-turbo",  
            messages=messages,
            max_tokens=10
        )

        # Extract the grade (just the number)
        grade = completion.choices[0].message.content.strip()

        # Check if the grade is a valid number
        if grade.isdigit() and 1 <= int(grade) <= 10:
            return grade
        else:
            return "0"  # Default to 0 if no valid grade found

    except Exception as e:
        return f"Error grading response: {str(e)}"