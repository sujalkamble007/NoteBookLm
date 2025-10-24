# NotebookLM Clone - Testing Checklist

## 🧪 Complete Testing Flow

### Pre-requisites ✅
- [ ] MongoDB Atlas Vector Search Index created (`vector_index`)
- [ ] Backend running on `http://localhost:4000`
- [ ] Frontend running on `http://localhost:5173`
- [ ] All environment variables configured

### Authentication Testing
1. **Register New User**
   - [ ] Go to `http://localhost:5173/register`
   - [ ] Create account with name, email, password
   - [ ] Verify successful registration and auto-login

2. **Login Functionality**
   - [ ] Log out and log back in
   - [ ] Verify JWT tokens are working
   - [ ] Check protected routes work

### Document Upload & Processing
3. **Upload Test Documents**
   - [ ] Go to "Upload" tab
   - [ ] Test different file types:
     - [ ] PDF file
     - [ ] DOCX file  
     - [ ] TXT file
     - [ ] CSV file (optional)
   - [ ] Verify upload progress indicators
   - [ ] Check processing status changes to "completed"

4. **Document Management**
   - [ ] Go to "Documents" tab
   - [ ] Verify uploaded documents appear
   - [ ] Check document metadata (size, type, date)
   - [ ] View auto-generated summaries
   - [ ] Check key insights are generated

### NotebookLM Q&A Testing
5. **Chat Functionality**
   - [ ] Go to "Chat" tab
   - [ ] Ask questions about uploaded documents:
     - [ ] "What is this document about?"
     - [ ] "Summarize the main points"
     - [ ] "What are the key findings?"
   - [ ] Verify AI responses include:
     - [ ] Relevant answers
     - [ ] Source document references
     - [ ] Confidence scores
     - [ ] Text previews from sources

6. **Notebook Organization**
   - [ ] Go to "Notebooks" tab
   - [ ] Create a new notebook
   - [ ] Add documents to notebook
   - [ ] Test notebook-specific chat context

### Advanced Features
7. **Vector Search Testing**
   - [ ] Ask semantic questions (not exact text matches)
   - [ ] Test cross-document queries
   - [ ] Verify similarity scoring works
   - [ ] Check multiple source attribution

### Error Handling
8. **Edge Cases**
   - [ ] Upload unsupported file types
   - [ ] Upload oversized files
   - [ ] Ask questions with no uploaded documents
   - [ ] Test with empty/corrupted files

## 🎯 Expected Results

### Successful Upload Flow:
1. File uploaded → "Processing" status
2. Text extracted → Chunks created  
3. Embeddings generated → Stored in MongoDB
4. AI analysis → Summary & insights created
5. Status changes to "Completed"

### Successful Q&A Flow:
1. Question submitted → Query embedding generated
2. Vector search → Similar chunks retrieved
3. Context assembled → Sent to Groq API
4. AI response → Answer with sources returned
5. UI displays → Answer, confidence, sources

## 🚨 Troubleshooting

### Common Issues:
- **No responses to questions**: Check MongoDB Vector Index is created
- **Upload fails**: Check file size limits and supported types  
- **Processing stuck**: Check HuggingFace and Groq API keys
- **401 Errors**: Check JWT tokens and authentication
- **500 Errors**: Check backend logs and database connection

### Debug Commands:
```bash
# Test backend health
curl http://localhost:4000/health

# Check vector search
npm run test-security

# View backend logs
tail -f backend-logs.txt
```

## 📊 Success Metrics

- [ ] Documents upload and process successfully (< 2 minutes)
- [ ] Q&A responses are relevant and accurate (> 80% confidence)
- [ ] Sources are properly attributed
- [ ] UI is responsive and user-friendly
- [ ] No security vulnerabilities (`npm audit` shows 0 issues)

---

**Goal**: Achieve Google NotebookLM-like functionality with document upload, processing, and intelligent Q&A capabilities!