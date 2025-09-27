
# Personal Email Classifier Agent 🚀
This project is a full-stack AI agent that automatically fetches unread emails from your Gmail account, classifies them using a machine learning model, and provides a simple interface to take action.

The agent follows a classic AI loop: Perceive → Classify → Decide → Act.

## Features
- **Automatic Classification:** Fetches unread emails and classifies them into categories like Personal, Spam, and Job Applications.
- **Simple UI:** A clean, box-like dashboard built with React and Tailwind CSS to view categorized emails.
- **One-Click Actions:** Archive or delete emails directly from the interface.
- **Learning from Feedback:** The agent logs your corrections, which can be used to retrain and improve the model over time.

## Tech Stack
- **Backend:** Python, FastAPI
- **Machine Learning:** Scikit-learn, Pandas
- **Frontend:** React, Vite, Tailwind CSS
- **API:** Google Gmail API

## Setup and Installation Guide
Follow these steps to get the project running locally.

### Prerequisites
- Python (3.8 or newer) and pip
- Node.js (v16 or newer) and npm
- A Google Account

### Step 1: Clone the Repository
```bash
git clone https://github.com/your-username/your-repo-name.git
cd your-repo-name
````

### Step 2: Backend Setup

Navigate to the Backend Directory:

```bash
cd Backend
```

Create and Activate a Virtual Environment (Recommended):

```bash
# For macOS/Linux
python3 -m venv venv
source venv/bin/activate

# For Windows
python -m venv venv
.\venv\Scripts\activate
```

Install Python Dependencies:

```bash
pip install "fastapi[all]" "google-api-python-client<2" "google-auth-httplib2" "google-auth-oauthlib" scikit-learn pandas joblib
```

Get Google API Credentials (`credentials.json`):

* Follow the detailed guide from Google to create an OAuth 2.0 Client ID for a Desktop app.
* This involves enabling the Gmail API, configuring a consent screen, and adding your email as a test user.
* Download the JSON file and rename it to `credentials.json`.
* Place this file inside the `Backend/` directory.

Generate the ML Model (`email_classifier_model.joblib`):

* The model is trained using a separate process. You will need to run the provided Google Colab notebook.
* The notebook will output a file named `email_classifier_model.joblib`.
* Download this file and place it inside the `Backend/` directory.

### Step 3: Frontend Setup

Navigate to the Frontend Directory:

```bash
cd Frontend
```

Install Node Dependencies:

```bash
npm install
```

## Running the Application

You need to run the backend and frontend servers in two separate terminals.

Start the Backend Server:

```bash
# In a terminal at the Backend/ directory (with the virtual environment activated)
uvicorn main:app --reload
```

The backend will be running at `http://localhost:8000`.

Start the Frontend Server:

```bash
# In a second terminal at the Frontend/ directory
npm run dev
```

The frontend will be running at `http://localhost:5173` (or another port if 5173 is busy).

One-Time Authentication:

* The first time you access the app, the backend needs your permission to access Gmail.
* Check the backend terminal. It will either automatically open a browser tab for you to log in or provide a URL to copy and paste manually.
* After you grant permission, a `token.json` file will be created in the `Backend/` folder, and the app will start fetching emails.

## 🚨 Security Warning

The `.gitignore` file is configured to prevent your sensitive credential files (`credentials.json`, `token.json`) from being committed to GitHub. Never remove these lines from your `.gitignore` file or manually push these files to a public repository.

