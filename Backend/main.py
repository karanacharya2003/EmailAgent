import os
import joblib
import base64
import email
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
import pandas as pd

# --- App Setup ---
app = FastAPI(title="Email Classifier Agent API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Google API Config ---
SCOPES = ["https://www.googleapis.com/auth/gmail.modify"]

# --- Pydantic Models ---
class EmailAction(BaseModel):
    action: str

class Feedback(BaseModel):
    message_id: str
    email_text: str
    correct_label: str

# --- Helper Functions ---
def get_gmail_service():
    """Authenticates with the Gmail API and returns a service object."""
    creds = None
    if os.path.exists("token.json"):
        creds = Credentials.from_authorized_user_file("token.json", SCOPES)
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file("credentials.json", SCOPES)
            creds = flow.run_local_server(port=0)
        with open("token.json", "w") as token:
            token.write(creds.to_json())
    return build("gmail", "v1", credentials=creds)

def get_email_body(payload):
    """Recursively parses email payload to find the plain text body."""
    if "parts" in payload:
        for part in payload['parts']:
            if part['mimeType'] == 'text/plain':
                data = part['body']['data']
                return base64.urlsafe_b64decode(data).decode('utf-8')
    if "body" in payload and payload["body"]["size"] > 0:
        data = payload['body']['data']
        return base64.urlsafe_b64decode(data).decode('utf-8')
    return "" # Return empty string if no body is found

# --- Model Loading ---
try:
    model = joblib.load("email_classifier_model.joblib")
except FileNotFoundError:
    model = None
    print("WARNING: Model file not found. Classification will be disabled.")

# --- API Endpoints ---
@app.get("/emails")
async def fetch_emails():
    """Fetches unread emails, classifies them, and returns them."""
    if not model:
        raise HTTPException(status_code=500, detail="ML model not loaded.")
    
    try:
        service = get_gmail_service()
        results = service.users().messages().list(userId="me", labelIds=["INBOX", "UNREAD"], maxResults=25).execute()
        messages = results.get("messages", [])

        email_list = []
        for message_info in messages:
            msg = service.users().messages().get(userId="me", id=message_info["id"], format="full").execute()
            payload = msg["payload"]
            headers = payload["headers"]
            
            subject = next((h["value"] for h in headers if h["name"].lower() == "subject"), "No Subject")
            sender = next((h["value"] for h in headers if h["name"].lower() == "from"), "Unknown Sender")
            
            email_body = get_email_body(payload)
            classification_text = f"Subject: {subject}. Body: {email_body if email_body else msg['snippet']}"
            
            label = model.predict([classification_text])[0]
            
            email_list.append({
                "id": msg["id"],
                "sender": sender,
                "subject": subject,
                "snippet": msg["snippet"],
                "full_text": classification_text, # Send full text for feedback logging
                "label": label,
            })
        return email_list
    except HttpError as error:
        raise HTTPException(status_code=500, detail=f"An error occurred: {error}")

@app.post("/emails/{message_id}/action")
async def perform_action(message_id: str, email_action: EmailAction):
    """Performs an action on an email (archive or delete)."""
    service = get_gmail_service()
    action = email_action.action
    try:
        if action == "archive":
            body = {"removeLabelIds": ["INBOX", "UNREAD"]}
            service.users().messages().modify(userId="me", id=message_id, body=body).execute()
            return {"status": "success", "message": f"Email {message_id} archived."}
        elif action == "delete":
            service.users().messages().trash(userId="me", id=message_id).execute()
            return {"status": "success", "message": f"Email {message_id} moved to trash."}
        else:
            raise HTTPException(status_code=400, detail="Invalid action.")
    except HttpError as error:
        raise HTTPException(status_code=500, detail=f"An error occurred: {error}")

@app.post("/feedback")
async def receive_feedback(feedback: Feedback):
    """Logs user corrections to a CSV file for future retraining."""
    feedback_file = 'corrections.csv'
    new_data = pd.DataFrame([[feedback.email_text, feedback.correct_label]], columns=['email_text', 'label'])
    
    if os.path.exists(feedback_file):
        new_data.to_csv(feedback_file, mode='a', header=False, index=False)
    else:
        new_data.to_csv(feedback_file, mode='w', header=True, index=False)
        
    return {"status": "success", "message": f"Feedback for message {feedback.message_id} logged."}