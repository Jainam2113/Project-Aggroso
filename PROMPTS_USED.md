# Prompts Used for App Development

This document contains a record of prompts I used with AI tools during development. API keys and full responses are excluded for security.

---

## Planning Phase

### Prompt 1: Project Structure
```
I need to build a web app where users can upload text documents and ask questions about them using AI. I know MERN stack. What's the best structure for this project?
```

### Prompt 2: Tech Stack Selection
```
For a document Q&A app with MERN stack, should I use OpenAI, Claude, or another LLM? Consider cost, speed, and ease of integration.
```

---

## Backend Development

### Prompt 3: Express Server Setup
```
Create an Express.js server with:
- File upload endpoint (only .txt files)
- Document listing endpoint
- Document delete endpoint
- Q&A endpoint using OpenAI
- Health check endpoint
Use Multer for uploads and store documents in JSON file.
```

### Prompt 4: OpenAI Integration
```
Write code to integrate OpenAI GPT-4o-mini API for answering questions based on uploaded documents. Include source citation in the response.
```

### Prompt 5: Error Handling
```
Add proper error handling for:
- Empty file upload
- Wrong file type
- OpenAI API errors
- Missing documents
- Invalid question input
```

---

## Frontend Development

### Prompt 6: React Component Structure
```
Create a React app with Vite that has:
- Home page with instructions
- Documents page (upload + list)
- Q&A page (ask questions + show answers with sources)
- Health status page
Use tabs for navigation. Style it modern and clean.
```

### Prompt 7: File Upload UI
```
Create a drag-and-drop or file picker UI in React for uploading .txt files. Show upload progress and success/error messages.
```

### Prompt 8: Q&A Interface
```
Build a Q&A interface where:
- User types question in textarea
- Submit button calls API
- Show loading state while processing
- Display answer with source citations below
Make it look clean and professional.
```

### Prompt 9: Health Check Display
```
Create a health status page that shows:
- Backend status (healthy/unhealthy)
- Database status
- LLM connection status
Use colored cards (green for healthy, red for unhealthy) with icons.
```

---

## Styling

### Prompt 10: CSS Styling
```
Create modern CSS for a document Q&A app with:
- Gradient background
- White card-based UI
- Smooth animations
- Responsive design
- Clean typography
Color scheme: Purple/blue gradient
```

---

## Deployment

### Prompt 11: Deployment Guide
```
How do I deploy:
1. Express backend to Render
2. React frontend to Vercel
3. What environment variables do I need?
Provide step-by-step instructions.
```

---

## Documentation

### Prompt 12: README Structure
```
Create a comprehensive README.md for a MERN stack document Q&A app including:
- Features
- Installation steps
- Usage guide
- API endpoints
- Deployment instructions
- What's done and not done
```

### Prompt 13: AI Notes Documentation
```
Help me write an AI_NOTES.md explaining:
- What I used AI for
- What I verified myself
- Why I chose OpenAI GPT-4o-mini
- How I tested the app
```

---

## Debugging

### Prompt 14: CORS Issue
```
I'm getting CORS error when React calls Express API. How do I fix this?
```

### Prompt 15: File Upload Not Working
```
Multer file upload returns undefined. Here's my code: [code snippet]. What's wrong?
```

### Prompt 16: OpenAI API Error
```
Getting "insufficient_quota" error from OpenAI. What does this mean and how to handle it gracefully in the app?
```

---

## Testing

### Prompt 17: Test Cases
```
What test cases should I manually check for:
1. File upload
2. Document listing
3. Q&A functionality
4. Health check
5. Error handling
```

---

## Notes

- All prompts were iterated multiple times for refinement
- Code was reviewed and understood before implementation
- Security checks (API keys, .env) done manually
- Testing performed manually on localhost before deployment

---

*Total prompts used: ~25-30 (including iterations)*
*AI tools: Claude/ChatGPT for code generation and documentation*