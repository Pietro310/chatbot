// server.js - Versione con Logica RAG
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs/promises');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { Document } = require("@langchain/core/documents");
const { MemoryVectorStore } = require("langchain/vectorstores/memory");
const { GoogleGenerativeAIEmbeddings } = require("@langchain/google-genai");

// --- 1. SETUP INIZIALE ---
const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3000;
let vectorStore; // La nostra "memoria" (database vettoriale)

// --- 2. CARICAMENTO DELLA BASE DI CONOSCENZA ALL'AVVIO ---
// Questa funzione viene eseguita una sola volta quando il server parte.
async function initializeKnowledgeBase() {
    try {
        console.log("🧠 Inizio caricamento della base di conoscenza...");

        // Leggiamo il file JSON che abbiamo creato con ingest.js
        const rawFile = await fs.readFile('knowledge_base.json', 'utf-8');
        const jsonData = JSON.parse(rawFile);
        
        // Trasformiamo i dati JSON in oggetti "Document" che LangChain può usare
        const documents = jsonData.map(
            (item) => new Document({ pageContent: item.pageContent, metadata: item.metadata })
        );

        // Inizializziamo il modello di embedding di Gemini
        const embeddings = new GoogleGenerativeAIEmbeddings({
            apiKey: process.env.GEMINI_API_KEY,
            model: "text-embedding-004", // Modello di embedding consigliato
        });

        // Creiamo la "memoria" (il database vettoriale) a partire dai nostri documenti ed embeddings
        vectorStore = await MemoryVectorStore.fromDocuments(documents, embeddings);

        console.log(`✅ Memoria caricata con successo. ${documents.length} documenti indicizzati.`);
        console.log("🤖 Il chatbot è pronto a rispondere.");

    } catch (error) {
        console.error("❌ Errore durante l'inizializzazione della base di conoscenza:", error);
        process.exit(1); // Ferma il server se la memoria non può essere caricata
    }
}


// --- 3. L'ENDPOINT DELLA CHAT POTENZIATO ---
app.post('/chat', async (req, res) => {
    try {
        const userMessage = req.body.message;
        if (!vectorStore) {
            return res.status(503).json({ error: "La base di conoscenza non è ancora pronta. Riprova tra un istante." });
        }

        // 1. Cerca nella "memoria" i documenti più simili alla domanda dell'utente
        const searchResults = await vectorStore.similaritySearch(userMessage, 4); // Cerca i 4 risultati più pertinenti
        
        // 2. Estrai il testo da quei documenti per creare un "contesto"
        const context = searchResults.map(r => r.pageContent).join('\n\n---\n\n');
        
        // 3. Inizializza il modello generativo di Gemini
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        // 4. Costruisci il prompt dinamico (la magia del RAG)
        const prompt = `
            Sei un assistente virtuale esperto del sito GLOBSIT.
            La tua missione è rispondere alle domande dell'utente basandoti ESCLUSIVAMENTE sul contesto fornito qui sotto.
            Sii conciso, professionale e amichevole. Non inventare mai informazioni.
            Se la risposta non è nel contesto, rispondi: "Mi dispiace, ma non ho trovato informazioni precise su questo argomento nei contenuti del sito."

            ---
            CONTESTO FORNITO:
            ${context}
            ---

            DOMANDA DELL'UTENTE:
            ${userMessage}
        `;

        // 5. Genera la risposta usando il contesto
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        res.json({ reply: text });

    } catch (error) {
        console.error("Errore durante la generazione della risposta:", error);
        res.status(500).json({ error: "Qualcosa è andato storto con l'AI." });
    }
});


// --- 4. AVVIO DEL SERVER ---
// Avviamo prima la base di conoscenza e POI mettiamo il server in ascolto
initializeKnowledgeBase().then(() => {
    app.listen(PORT, () => {
        console.log(`🚀 Server in ascolto sulla porta ${PORT}`);
    });
});