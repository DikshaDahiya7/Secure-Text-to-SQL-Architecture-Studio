export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { message, state } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ reply: "Server error: GEMINI_API_KEY is not configured in environment variables." });
    }

    try {
        const systemPrompt = `You are an expert AI Compiler Design and Database Security Tutor. 
        The user is building a "Secure Text-to-SQL Architecture Studio" which features:
        - Natural Language to SQL translation
        - Lexical Token Stream & LL(1) Top-Down Parsing
        - AST (Abstract Syntax Tree) Generation
        - Security Policy Validation (Enforcing read-only DML, blocking DDL/mutations/SQL injections).
        
        Current Pipeline State:
        - Last User Query: "${state?.query || 'None'}"
        - Generated SQL: "${state?.sql || 'None'}"
        - AST Root Node: "${state?.rootNodeType || 'None'}"
        - Security Status: ${state?.isUnsafe ? 'Blocked (' + state?.threatCategory + ')' : 'Safe Read-Only'}
        
        Answer the user's question clearly, professionally, and concisely with a focus on compiler design concepts.`;

        // Updated to gemini-3.8-flash as recommended by the API error log
        const apiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [
                    { role: "user", parts: [{ text: systemPrompt + "\n\nUser Question: " + message }] }
                ]
            })
        });

        const data = await apiResponse.json();

        if (data.error) {
            return res.status(500).json({ reply: `Gemini API Error: ${data.error.message || 'Invalid request'}` });
        }

        if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
            const reply = data.candidates[0].content.parts[0].text;
            return res.status(200).json({ reply });
        } else {
            return res.status(500).json({ reply: "Received an unexpected response structure from Gemini API." });
        }
    } catch (error) {
        return res.status(500).json({ reply: "Failed to connect to Gemini API: " + error.message });
    }
}
