from fpdf import FPDF
import os
from collections import defaultdict
from firebase_config import storage_bucket, firestore_db, firebase_db
from utils.clean_text import clean_text
from io import BytesIO

def add_background(pdf):
    """Function to add a background color to every page."""
    pdf.set_fill_color(42, 42, 64)  # Background color
    pdf.rect(0, 0, pdf.w, pdf.h, 'F')  # Draw the background rectangle

def generate_pdf_report(user_id, history, timestamp, status, session_id, firebase_session_id):
    font_path = os.path.join(os.path.dirname(__file__), '..', 'assets', 'dejavu-sans.extralight.ttf')
    font_bold_path = os.path.join(os.path.dirname(__file__), '..', 'assets', 'dejavu-sans.bold.ttf')


    try:
        # Fetch user details from Firebase Realtime Database
        user_data = firebase_db.child(f'Users/{user_id}').get()

        if user_data is not None and isinstance(user_data, dict):  # Ensure it's a dictionary
            first_name = user_data.get("firstName", "Unknown")
            last_name = user_data.get("lastName", "User")
            full_name = f"{first_name} {last_name}"
        else:
            full_name = "Unknown User"  # Default fallback
    
        # Initialize PDF
        pdf = FPDF()
        pdf.add_page()
        add_background(pdf)

        # Add Font
        pdf.add_font('DejaVu', '', font_path, uni=True)
        pdf.add_font('DejaVu_bold', '', font_bold_path, uni=True)
        pdf.set_font('DejaVu', size=12)
        

        # Add Logo
        logo_path = os.path.join(os.path.dirname(__file__), '..', 'assets', 'logo.png')
        pdf.image(logo_path, x=(pdf.w - 20) / 2, y=5, w=20, h=20)
        pdf.ln(20)

        # Title
        pdf.set_text_color(109, 129, 242)
        pdf.set_font('DejaVu_bold', size=20)
        pdf.cell(0, 10, "Interview Simulator Feedback Report", ln=True, align='C')
        pdf.ln(10)
        
        # Add second image 
        second_image_path = os.path.join(os.path.dirname(__file__), '..', 'assets', 'feedback.png')  
        image_height = 120  
        image_width = pdf.w  
        pdf.ln(10)  
        pdf.image(second_image_path, x=0, w=image_width, h=image_height)  

        # Session Details
        pdf.ln(10)  
        pdf.set_font('DejaVu_bold', size=18)
        pdf.set_text_color(255, 255, 255)
        pdf.cell(200, 10, txt=f"User: {full_name}", ln=True, fill=True)
        pdf.cell(200, 10, txt=f"Date: {timestamp}", ln=True, fill=True)
        pdf.cell(200, 10, txt=f"Status: {status}", ln=True, fill=True)
        pdf.ln(10)

        # Introduction
        pdf.add_page()
        add_background(pdf)
        pdf.set_font('DejaVu_bold', size=14)
        pdf.set_text_color(109, 129, 242)
        pdf.cell(200, 10, "Introduction", ln=True, align='L')
        pdf.ln(5)
        pdf.set_font('DejaVu', '', 12)
        pdf.set_text_color(255, 255, 255)
        intro_text = """Thank you for completing the Interview Simulator online assessment. 
We hope you enjoyed it and learnt a bit more about what it's like to be answering interview questions. 

This report looks at your assessment performance against the core skills that companies early talent acquisition teams use to deliver outstanding results day to day. Specifically, we look at the areas of Ice Breaking, Creativity and Critical Thinking, Leadership and Adaptability, Time Management and Prioritization, Analytical and Problem Solving, Teamwork and Collaboration, Transferable. We'll explain more about each of these areas throughout this report, providing personal feedback along the way.  

Please note, this report is not an indication of outcome but rather an opportunity to help you identify the areas that you're naturally good at, and others where you might want to focus on developing. It also offers hints and tips for how you can grow your skillset. We encourage you to take some time to reflect on your report and use this new understanding to guide you in your career development, irrespective of this application."""

        pdf.multi_cell(0, 5, intro_text)
        pdf.ln(10)
        

        # Organize questions by category
        pdf.add_page()
        add_background(pdf)
        categorized_questions = defaultdict(list)

        for idx, entry in enumerate(history):
            if entry.get("role") == "assistant":
                content = clean_text(entry.get("content", ""))
                matched_category = entry.get("category", "General")

                # Find corresponding user response
                if idx + 1 < len(history) and history[idx + 1].get("role") == "user":
                    user_entry = history[idx + 1]
                    user_response = user_entry.get("content", "No answer provided")
                    grade = user_entry.get("grade", "N/A")
                    feedback = user_entry.get("feedback", "N/A")

                    # Store in categorized dictionary
                    categorized_questions[matched_category].append({
                        "question": entry.get("content"),
                        "user_answer": user_response,
                        "grade": grade,
                        "feedback": feedback
                    })
        # Dictionary mapping each category to its corresponding image file path
        one_image_path = os.path.join(os.path.dirname(__file__), '..', 'assets', 'welcome.png') 
        two_image_path = os.path.join(os.path.dirname(__file__), '..', 'assets', 'feedback.png') 
        three_image_path = os.path.join(os.path.dirname(__file__), '..', 'assets', 'collaboration.png') 
        four_image_path = os.path.join(os.path.dirname(__file__), '..', 'assets', 'learning.png') 
        five_image_path = os.path.join(os.path.dirname(__file__), '..', 'assets', 'feedback.png') 
        six_image_path = os.path.join(os.path.dirname(__file__), '..', 'assets', 'star_method.png') 
        seven_image_path = os.path.join(os.path.dirname(__file__), '..', 'assets', 'challenges.png') 
        eight_image_path = os.path.join(os.path.dirname(__file__), '..', 'assets', 'collaboration.png')
        
        category_images = {
            "Ice Breaking": one_image_path,
            "Time Management and Prioritization": two_image_path,
            "Communication and Networking": three_image_path,
            "Creativity and Critical Thinking": four_image_path,
            "Transferable": five_image_path,
            "Leadership and Adaptability": six_image_path,
            "Analytical and Problem Solving": seven_image_path,
            "Teamwork and Collaboration": eight_image_path,
        }

        # Generate Report
        pdf.set_text_color(0, 0, 0)
        for category, questions in categorized_questions.items():
            pdf.set_font('DejaVu_bold', size=14)
            pdf.set_text_color(109, 129, 242)
            pdf.cell(0, 10, category, ln=True)
            pdf.ln(5)

            pdf.set_font('DejaVu', '', 12)
            pdf.set_text_color(255, 255, 255)
            for q in questions:
                pdf.multi_cell(0, 5, f"Question: {q['question']}")
                pdf.ln(2)

                pdf.set_font('DejaVu', '', 12)
                pdf.multi_cell(0, 5, f"Your Answer: {q['user_answer']}")
                pdf.ln(1)
                pdf.multi_cell(0, 5, f"Grade: {q['grade']}/10")
                pdf.ln(1)
                pdf.multi_cell(0, 5, f"Feedback: {q['feedback']}")
                pdf.ln(8)
            # Add category-specific image if available
            if category in category_images:
                pdf.image(category_images[category], h=120, w=pdf.w )  
            # Add a new page and background for next category questions
            pdf.add_page()
            add_background(pdf)
        
        # Conclusion
        pdf.set_font('DejaVu_bold', size=20)
        pdf.set_text_color(109, 129, 242)
        pdf.cell(200, 10, "Thank you", ln=True, align='L')
        pdf.ln(5)
        pdf.set_font('DejaVu', size=12)
        pdf.set_text_color(255, 255, 255)
        intro_text = """We hope that you found this report interesting, and that it provides you with useful insights to help you grow and develop. Whatever happens next, we’d like to thank you once again for taking the time to complete our Practice Session and wish you every success for the future."""
        pdf.multi_cell(0, 5, intro_text)
        pdf.ln(10)
        
        # Add Footer image 
        footer_image_path = os.path.join(os.path.dirname(__file__), '..', 'assets', 'practice_questions.png')  
        image_height = 120  
        image_width = pdf.w  
        pdf.ln(10)  
        pdf.image(footer_image_path, x=0, w=image_width, h=image_height)  
        
        # Save PDF to memory (in-memory buffer)
        pdf_output = BytesIO()
        pdf.output(pdf_output)
        pdf_output.seek(0)  # Reset the pointer to the beginning of the PDF

        #  Upload PDF to Firebase Storage
        storage_path = f"Users/{user_id}/Reports/{session_id}.pdf"
        blob = storage_bucket.bucket().blob(storage_path)
        blob.upload_from_file(pdf_output, content_type='application/pdf')
        blob.make_public()  # Make the PDF publicly accessible
        
        # Get the public URL of the PDF
        pdf_url = blob.public_url

        # Update Firestore with the PDF URL
        firestore_db.collection("Sessions").document(session_id).update({
            "report_link": pdf_url
        })

        # Update Firebase Realtime Database with the PDF URL
        firebase_db.child(f'Users/{user_id}/Sessions/{firebase_session_id}').update({
            "report_link": pdf_url
        })

        

        print(f"PDF Report generated and uploaded: {pdf_url}")
        return pdf_url

    except Exception as e:
        print(f"Error generating PDF report: {str(e)}")
