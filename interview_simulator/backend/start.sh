# Install the spaCy model
python -m spacy download en_core_web_sm

# Start the Flask application using gunicorn
gunicorn -b 0.0.0.0:$PORT app:app
