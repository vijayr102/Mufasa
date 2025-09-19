# User Story to Tests (Mufasa)

A full-stack app to generate test cases and test data from user stories, with JIRA integration and Excel export.

---

## Quick Start

### Backend
```sh
cd backend
npm install
npm run dev
```

### Frontend
```sh
cd frontend
npm install
npm run dev
```

---

## Required Environment Variables

### Backend (`.env` in project root)
```
PORT=8090
CORS_ORIGIN=http://localhost:5173
# Groq LLM
groq_API_BASE=https://api.groq.com/openai/v1
groq_API_KEY=your_groq_api_key
groq_MODEL=openai/gpt-oss-120b
# JIRA
jiraUrl=https://your-domain.atlassian.net
jirausername=your_jira_email
jiraapiKey=your_jira_api_token
```

### Frontend (`.env` in frontend/)
```
VITE_API_BASE_URL=http://localhost:8090/api
```

---

## JIRA Integration
- Go to **Settings** tab in the app.
- Enter your JIRA URL, username, and API key.
- To link a story, enter the JIRA ID and click **Fetch** to auto-populate story details.

---

## Troubleshooting
- **Console Errors:** Check backend and frontend terminals for error logs.
- **Network Issues:** Ensure CORS is set correctly and both servers are running.
- **502/Bad Gateway:** Check Groq API key, model, and prompt formatting.
- **JIRA Errors:** Verify credentials and JIRA URL in settings.

---

## Folder Structure
```
user-story-to-tests/
├── backend/
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── prompt.ts
│       ├── schemas.ts
│       ├── server.ts
│       ├── llm/
│       │   └── groqClient.ts
│       └── routes/
│           ├── generate.ts
│           ├── generateTestData.ts
│           ├── jiraSummary.ts
│           └── settings.ts
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── src/
│       ├── App.tsx
│       ├── api.ts
│       ├── main.tsx
│       ├── types.ts
│       └── vite-env.d.ts
├── package.json
└── README.md
```

---

## License
MIT
