// Aspetta che l'intero contenuto della pagina sia stato caricato prima di eseguire lo script.
document.addEventListener('DOMContentLoaded', () => {

    // --- 1. SELEZIONE DEGLI ELEMENTI HTML ---
    // Prendiamo tutti gli elementi con cui dobbiamo interagire dalla nostra pagina HTML.
    const chatBubble = document.getElementById('chat-bubble');
    const chatWindow = document.getElementById('chat-window');
    const closeBtn = document.getElementById('chat-close-btn');
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const chatBody = document.getElementById('chat-body');

    // --- 2. GESTIONE APERTURA E CHIUSURA DELLA CHAT ---
    // Quando l'utente clicca sull'icona-bolla...
    chatBubble.addEventListener('click', () => {
        // ...mostriamo la finestra della chat togliendo la classe 'hidden'.
        chatWindow.classList.remove('hidden');
    });

    // Quando l'utente clicca sul pulsante di chiusura (la 'x')...
    closeBtn.addEventListener('click', () => {
        // ...nascondiamo la finestra della chat aggiungendo la classe 'hidden'.
        chatWindow.classList.add('hidden');
    });

    // --- 3. GESTIONE DELL'INVIO DEL MESSAGGIO ---
    // Quando l'utente invia il modulo (premendo 'Invio' o cliccando il pulsante)...
    chatForm.addEventListener('submit', (event) => {
        // ...preveniamo il comportamento predefinito del modulo, che ricaricherebbe la pagina.
        event.preventDefault();

        // Prendiamo il testo scritto dall'utente e rimuoviamo spazi bianchi inutili. 
        //Se il messaggio non è vuoto aggiungiamo il messaggio dell'utente all'interfaccia.
        const userMessageText = chatInput.value.trim();

        
        if (userMessageText) {
            addMessage(userMessageText, 'user');

            // Svuotiamo la casella di testo.
            chatInput.value = '';

            /*
            // Simulare una risposta del bot dopo un breve ritardo. Sostituire con la chiamata a gemini
            setTimeout(() => {
                addMessage("Questa è una risposta automatica. La vera logica arriverà presto!", 'bot');
            }, 1000); */

            addTypingIndicator(); // Mostra i puntini...

    fetch('http://localhost:3000/chat', {
        method: 'POST',
        headers: {
        'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: userMessageText }),
    })
    .then(response => response.json())
    .then(data => {
        removeTypingIndicator(); // Rimuovi i puntini...
        addMessage(data.reply, 'bot'); // Aggiungi la vera risposta
    })
    .catch(error => {
        removeTypingIndicator();
        addMessage("Ops, c'è stato un problema di connessione. Riprova.", 'bot');
        console.error('Errore:', error);
    });

        }
    });

    // --- 4. FUNZIONE PER AGGIUNGERE MESSAGGI ALL'INTERFACCIA ---
    // Questa funzione crea e aggiunge un nuovo elemento messaggio nel corpo della chat.
    function addMessage(text, sender) {
        // Creiamo un nuovo elemento <div> per il messaggio.
        const messageContainer = document.createElement('div');
        // Aggiungiamo la classe 'message' e una classe specifica per il mittente ('user-message' o 'bot-message').
        messageContainer.classList.add('message', `${sender}-message`);

        // Creiamo l'elemento <p> che conterrà il testo.
        const messageTextElement = document.createElement('p');
        messageTextElement.textContent = text;

        // Mettiamo il paragrafo dentro al contenitore del messaggio.
        messageContainer.appendChild(messageTextElement);
        // Aggiungiamo il messaggio completo al corpo della chat.
        chatBody.appendChild(messageContainer);

        // Scrolliamo automaticamente verso il basso per mostrare l'ultimo messaggio.
        chatBody.scrollTop = chatBody.scrollHeight;
    }

    //Per far funzionare l'effetto "sta scrivendo"
    function addTypingIndicator() {
     const typingIndicator = document.createElement('div');
     typingIndicator.classList.add('message', 'bot-message');
     typingIndicator.id = 'typing-indicator';
     typingIndicator.innerHTML = `<p><span>.</span><span>.</span><span>.</span></p>`;
     chatBody.appendChild(typingIndicator);
     chatBody.scrollTop = chatBody.scrollHeight;
    }

    function removeTypingIndicator() {
     const typingIndicator = document.getElementById('typing-indicator');
     if (typingIndicator) {
         typingIndicator.remove();
     }
    }

});