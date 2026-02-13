const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { GoogleGenAI } = require('@google/genai');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const GEMINI_API_KEY = 'AIzaSyCBCYmNwWwR-huOwV9TmNYrT7HeKjlEkFs';
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));
app.use(express.json());

// Gemini helper
const askGemini = async (prompt) => {
  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash-lite',
    contents: prompt,
  });
  return response.text;
};

// Storage setup — use /tmp on Vercel (read-only FS outside /tmp)
const uploadsDir = process.env.VERCEL ? '/tmp/uploads' : path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/plain') {
      cb(null, true);
    } else {
      cb(new Error('Only .txt files are allowed!'));
    }
  }
});

// In-memory document store
let documents = [];
const documentsFile = process.env.VERCEL ? '/tmp/documents.json' : path.join(__dirname, 'documents.json');

// Load documents from file on startup
if (fs.existsSync(documentsFile)) {
  try {
    documents = JSON.parse(fs.readFileSync(documentsFile, 'utf8'));
  } catch (err) {
    console.log('No existing documents found');
  }
}

// Save documents to file
const saveDocuments = () => {
  fs.writeFileSync(documentsFile, JSON.stringify(documents, null, 2));
};

// Helper function to chunk text
const chunkText = (text, chunkSize = 500) => {
  const chunks = [];
  for (let i = 0; i < text.length; i += chunkSize) {
    chunks.push(text.substring(i, i + chunkSize));
  }
  return chunks;
};

// Routes

// Health check endpoint
app.get('/api/health', async (req, res) => {
  const health = {
    backend: 'healthy',
    database: 'healthy',
    llm: 'unknown',
    timestamp: new Date().toISOString()
  };

  // Check if documents file is accessible (healthy if writable or not yet created)
  try {
    if (fs.existsSync(documentsFile)) {
      fs.accessSync(documentsFile, fs.constants.R_OK | fs.constants.W_OK);
    }
    health.database = 'healthy';
  } catch (err) {
    health.database = 'unhealthy';
  }

  // Check Gemini connection
  try {
    const testUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`;
    const r = await fetch(testUrl);
    health.llm = r.ok ? 'healthy' : 'unhealthy';
  } catch (err) {
    health.llm = 'unhealthy';
  }

  const allHealthy = health.backend === 'healthy' &&
                     health.database === 'healthy' &&
                     health.llm === 'healthy';

  res.status(allHealthy ? 200 : 503).json(health);
});

// Upload document
app.post('/api/documents/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = path.join(uploadsDir, req.file.filename);
    const content = fs.readFileSync(filePath, 'utf8');

    const doc = {
      id: uuidv4(),
      name: req.file.originalname,
      filename: req.file.filename,
      content: content,
      chunks: chunkText(content),
      uploadedAt: new Date().toISOString()
    };

    documents.push(doc);
    saveDocuments();

    res.json({
      message: 'Document uploaded successfully',
      document: {
        id: doc.id,
        name: doc.name,
        uploadedAt: doc.uploadedAt
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload document' });
  }
});

// Get all documents
app.get('/api/documents', (req, res) => {
  const docList = documents.map(doc => ({
    id: doc.id,
    name: doc.name,
    uploadedAt: doc.uploadedAt
  }));
  res.json(docList);
});

// Delete document
app.delete('/api/documents/:id', (req, res) => {
  try {
    const docIndex = documents.findIndex(d => d.id === req.params.id);

    if (docIndex === -1) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const doc = documents[docIndex];
    const filePath = path.join(uploadsDir, doc.filename);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    documents.splice(docIndex, 1);
    saveDocuments();

    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

// Ask question
app.post('/api/ask', async (req, res) => {
  try {
    const { question, documentIds } = req.body;

    if (!question || question.trim() === '') {
      return res.status(400).json({ error: 'Question is required' });
    }

    if (documents.length === 0) {
      return res.status(400).json({ error: 'No documents uploaded yet' });
    }

    // Filter to selected docs if provided, otherwise use all
    const targetDocs = (documentIds && documentIds.length > 0)
      ? documents.filter(d => documentIds.includes(d.id))
      : documents;

    if (targetDocs.length === 0) {
      return res.status(400).json({ error: 'None of the selected documents were found' });
    }

    // Build context from target documents
    const allContent = targetDocs.map(doc =>
      `[Document: ${doc.name}]\n${doc.content}\n`
    ).join('\n---\n\n');

    const prompt = `You are a helpful assistant that answers questions based on the provided documents. Always cite which document you're referring to. If the answer isn't in the documents, say so.

Documents:
${allContent}

Question: ${question}

Please answer the question based on the documents above. Cite the document name and quote the relevant part.`;

    const answer = await askGemini(prompt);

    // Find relevant sources (simple keyword matching)
    const sources = [];
    targetDocs.forEach(doc => {
      doc.chunks.forEach((chunk) => {
        const keywords = question.toLowerCase().split(' ').filter(w => w.length > 3);
        const chunkLower = chunk.toLowerCase();
        const matchCount = keywords.filter(k => chunkLower.includes(k)).length;

        if (matchCount > 0) {
          sources.push({
            documentName: doc.name,
            documentId: doc.id,
            text: chunk,
            relevance: matchCount
          });
        }
      });
    });

    sources.sort((a, b) => b.relevance - a.relevance);
    const topSources = sources.slice(0, 3);

    res.json({
      question,
      answer,
      sources: topSources
    });

  } catch (error) {
    console.error('Ask error:', error);
    res.status(500).json({ error: 'Failed to process question' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Documents stored: ${documents.length}`);
});
