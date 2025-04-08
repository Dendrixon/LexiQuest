document.addEventListener('DOMContentLoaded', () => {
    // Load saved notes
    chrome.storage.local.get(['researchNotes'], function(result) {
        if (result.researchNotes) {
            document.getElementById('notes').value = result.researchNotes;
        }
    });

    // Event listeners
    document.getElementById('summarizeBtn').addEventListener('click', summarizeText);
    document.getElementById('saveNotesBtn').addEventListener('click', saveNotes);
});

// Summarize selected text from the active tab
async function summarizeText() {
    try {
        // Get the active tab
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        console.log("Active Tab ID:", tab.id);

        // Execute script to get selected text
        const results = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => window.getSelection().toString()
        });

        const selectedText = results[0]?.result?.trim();
        console.log("Selected Text:", selectedText);

        if (!selectedText) {
            showResult('⚠️ Please select some text on the webpage first.');
            return;
        }

        // Call your Spring Boot backend API
        const response = await fetch('http://localhost:8080/api/research/process', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: selectedText, operation: 'summarize' })
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const summarizedText = await response.text();
        showResult(summarizedText.replace(/\n/g, '<br>'));

    } catch (error) {
        console.error("Summarize Error:", error);
        showResult(`❌ Error: ${error.message}`);
    }
}

// Save notes to chrome storage
function saveNotes() {
    const notes = document.getElementById('notes').value;
    chrome.storage.local.set({ 'researchNotes': notes }, () => {
        alert('✅ Notes saved successfully!');
    });
}

// Display result in the panel
function showResult(content) {
    document.getElementById('results').innerHTML = `
        <div class="result-item">
            <div class="result-content">${content}</div>
        </div>
    `;
}
