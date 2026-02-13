# AI Usage Notes

## What I Used AI For

### 1. **Initial Project Structure** ✅
- Used Claude/ChatGPT to plan the folder structure
- Asked for MERN stack boilerplate setup
- Generated package.json dependencies

### 2. **Backend API Code** ✅
- Used AI to write Express server setup
- Generated file upload logic with Multer
- Created OpenAI integration code
- Health check endpoint structure

### 3. **Frontend Components** ✅
- Used AI to create React component structure
- Generated CSS styling for responsive design
- Tab navigation logic
- Form handling code

### 4. **OpenAI Integration** ✅
- Prompt engineering for Q&A functionality
- Source citation logic
- Error handling patterns

### 5. **Documentation** ✅
- Generated README structure
- Created markdown files
- API documentation

## What I Checked/Verified Myself

### 1. **Code Understanding** ✅
- Read through all generated code line by line
- Understood Express routing and middleware
- Verified React component lifecycle
- Checked API call flows

### 2. **Testing** ✅
- Manually tested file upload
- Tested Q&A functionality with different questions
- Verified source citation accuracy
- Tested error cases (no file, empty question, etc.)
- Checked health endpoint responses

### 3. **Configuration** ✅
- Set up .env files correctly
- Verified API keys work
- Tested CORS configuration
- Checked proxy settings in Vite

### 4. **Error Handling** ✅
- Verified file type validation
- Tested empty input handling
- Checked API error responses
- Tested document deletion

### 5. **Security** ✅
- Ensured no API keys in code
- Verified .gitignore includes .env
- Checked file upload security (file type validation)

## LLM Choice: OpenAI GPT-4o-mini

### Why GPT-4o-mini?

1. **Cost-Effective** 💰
   - Much cheaper than GPT-4
   - Good for demo/prototype projects
   - Still provides quality answers

2. **Fast Response Time** ⚡
   - Quicker than full GPT-4
   - Better user experience
   - Lower latency

3. **Sufficient for Q&A** ✅
   - Good at reading and understanding documents
   - Can cite sources effectively
   - Handles context well

4. **Easy Integration** 🔧
   - Official OpenAI npm package
   - Simple API
   - Good documentation

### Alternative Considered:
- Claude API (Anthropic) - more expensive, similar quality
- Gemini (Google) - considered but less familiar
- Open-source models - would need separate hosting

## AI Tools Used

1. **Claude / ChatGPT** - Code generation, debugging help
2. **GitHub Copilot** (if used) - Code completion
3. **Cursor** (if used) - AI-powered IDE features

## Lessons Learned

- AI is great for boilerplate and structure
- Always verify and test generated code
- Understand the code before deploying
- AI can miss edge cases - manual testing is essential
- Prompt engineering matters for quality output