const getDataGitHub = async (user) => {
    const response = await fetch(`https://api.github.com/users/${user}`)
    const data = await response.json()
    return data
}

const getReposGithub = async (user) => {
    const response = await fetch(`https://api.github.com/users/${user}/repos`)
    const data = await response.json()
    return data
}

const getdevtoArticles = async (user) => {
    const response = await fetch(`https://dev.to/api/articles?username=${user}`)
    const data = await response.json()
    return data
}

const askGpt = async (prompt) => {
    const res = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: "Generate a project idea" }],
    }, {
        headers: {
            'Authorization': `Bearer YOUR_API_KEY`
        }
    });   
    const data = res.data; // This is the correct way to get data from the response
    return data;
};

/*
const AppBasedGpt = async (prompt) => {
    const userMessage = prompt;
    setMessages(prevMessages => [...prevMessages, { sender: 'User', text: userMessage }]);

    try {
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: 'gpt-3.5-turbo',
            messages: [
                { role: 'system', content: 'You are a helpful assistant.' },
                { role: 'user', content: userMessage }
            ]
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`
            }
        });

        const gptMessage = response.data.choices[0].message.content;
        setMessages(prevMessages => [...prevMessages, { sender: 'ChatGPT', text: gptMessage }]);

        // Return the GPT message content, or any other data you want from the response
        return gptMessage; // Return GPT response
    } catch (error) {
        console.error('Error fetching response from OpenAI:', error);
        setMessages(prevMessages => [...prevMessages, { sender: 'System', text: 'Sorry, there was an error fetching the response.' }]);

        // Return a fallback error message
        return 'Sorry, there was an error processing your request.';
    }

    setUserInput('');
};


const getGptResponse = async () => {
    const prompt = "Tell me a joke";
    const gptMessage = await AppBasedGpt(prompt);
    console.log("GPT says:", gptMessage);
    // You can now use `gptMessage` as needed
};


TILL I RECHECK THIS LATER
*/
