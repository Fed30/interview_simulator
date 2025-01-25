from config.openai_config import openai

def get_feedback_summary_from_openai(response,ideal_response, question):
    try:
        messages = [
            {"role": "system", "content": "You are a helpful assistant that provides constructive feedback on responses based on the STAR method. Provide a short summary feedback on how closely the user response matches the ideal response. but do not include the grade."},
            {"role": "user", "content": question},  # The question being asked
            {"role": "assistant", "content": response},  # The user's response to grade
            {"role": "assistant", "content": ideal_response}
        ]

        # Call OpenAI's API to generate feedback summary
        completion = openai.chat.completions.create(
            model="gpt-3.5-turbo",  
            messages=messages,
            max_tokens=150
        )

        # Extract feedback (without grade)
        feedback = completion.choices[0].message.content.strip()
        
        return feedback

    except Exception as e:
        return f"Error generating feedback: {str(e)}"