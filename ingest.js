
const { Document } = require("@langchain/core/documents");
const { RecursiveCharacterTextSplitter } = require("langchain/text_splitter");
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs/promises');

// ===================================================================
// CONFIGURAZIONE: URL
// ===================================================================
const URLS_TO_SCRAPE = [

    'https://www.globsit.com/home-it/', //home

    'https://www.globsit.com/company-it/', //company

    'https://www.globsit.com/cyber-security-it/', //cyber security

    'https://www.globsit.com/smart-drones-it/', //smart drones

    'https://www.globsit.com/piano-scuola-4-0/', //piano scuola 4.0

    'https://www.globsit.com/laboratorio-per-la-formazione-in-cyber-security/', //laboratorio per la formazione in cyber security

    'https://www.globsit.com/contatti-it/' //contatti

];

const CONTENT_SELECTOR = '#content'; // Usiamo il selettore che hai scelto
// ===================================================================


async function generateKnowledgeBase() {
    const allDocuments = [];
    console.log("🚀 Inizio creazione base di conoscenza...");

    // --- FASE 1: ESTRAZIONE (come prima) ---
    for (const url of URLS_TO_SCRAPE) {
        try {
            const response = await axios.get(url);
            const $ = cheerio.load(response.data);
            
            // Qui potremmo aggiungere la pulizia chirurgica in futuro
            // Per ora, usiamo il testo così com'è.
            const textContent = $(CONTENT_SELECTOR).text();
            const cleanedText = textContent.replace(/\s\s+/g, ' ').trim();
            
            // Creiamo un "Documento" per LangChain
            const doc = new Document({
                pageContent: cleanedText,
                metadata: { source: url },
            });
            allDocuments.push(doc);
            console.log(`✅ Estratto contenuto da: ${url}`);
        } catch (error) {
            console.error(`❌ Errore durante l'estrazione da ${url}: ${error.message}`);
        }
    }
    console.log(`\n📚 Totale pagine estratte: ${allDocuments.length}`);

    // --- FASE 2: SUDDIVISIONE IN CHUNKS ---
    // Dividiamo i documenti lunghi in pezzi più piccoli.
    // Questo aiuta l'AI a trovare informazioni più specifiche.
    const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 2000, // Dimensione di ogni pezzo (in caratteri)
        chunkOverlap: 200, // Quanti caratteri si sovrappongono tra un pezzo e l'altro
    });

    const chunks = await textSplitter.splitDocuments(allDocuments);
    console.log(`📄 Testo suddiviso in ${chunks.length} pezzi (chunks).`);

    // --- SALVATAGGIO DELLA MEMORIA ---
    // Salviamo i chunk in un file JSON. Questo file sarà la nostra "memoria".
    // Il server.js lo leggerà all'avvio.
    const jsonData = JSON.stringify(chunks);
    await fs.writeFile('knowledge_base.json', jsonData);
    console.log("\n✨ Base di conoscenza creata e salvata in 'knowledge_base.json'!");
    console.log("✅ Fase 2 completata.");
}

generateKnowledgeBase();