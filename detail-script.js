document.addEventListener('DOMContentLoaded', function() {
    const detailTitle = document.getElementById('detail-title');
    const detailImageContainer = document.getElementById('detail-image-container');
    const detailBody = document.getElementById('detail-body');
    const relatedPostsContainer = document.getElementById('related-posts-container');
    const params = new URLSearchParams(window.location.search);
    const keywordFromQuery = params.get('q') || '';
    const keyword = keywordFromQuery.replace(/-/g, ' ').trim();

    // ▼▼▼ IMPORTANT: Replace with your Gemini API Key ▼▼▼
    const GEMINI_API_KEY = 'YOUR_API_KEY'; 
    const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`;

    function capitalizeEachWord(str) { if (!str) return ''; return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '); }
    
    // ▼▼▼ MODIFIED: SEO Title is now more generic ▼▼▼
    function generateSeoTitle(baseKeyword) { 
        const hookWords = ['Complete Guide to', 'Everything About', 'An Introduction to', 'The Ultimate Guide to', 'Exploring', 'Amazing Facts About']; 
        const randomHook = hookWords[Math.floor(Math.random() * hookWords.length)]; 
        const capitalizedKeyword = capitalizeEachWord(baseKeyword); 
        return `${randomHook} ${capitalizedKeyword}`; 
    }
    
    // Function to convert simple Markdown from Gemini to HTML
    function formatGeminiResponseToHtml(text) {
        if (!text) return '<p>Content is not available.</p>'; // Translated to English
        
        let html = text.replace(/\n\n/g, '<p></p>');
        html = html.replace(/\n/g, '<br>');
        html = html.replace(/### (.*?)(<br>|$)/g, '<h3>$1</h3>');
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/^\* (.*?)(<br>|$)/gm, '<li>$1</li>');
        html = html.replace(/^\d+\. (.*?)(<br>|$)/gm, '<li>$1</li>'); // Handle numbered lists
        
        if (html.includes('<li>')) {
            html = '<ul>' + html.replace(/<br><ul>/g, '<ul>').replace(/<\/li><br>/g, '</li>') + '</ul>';
            html = html.replace(/<\/ul><br><ul>/g, ''); 
        }
        return html;
    }

    if (!keyword) { 
        // ▼▼▼ MODIFIED: "Not Found" message is now more generic and in English ▼▼▼
        detailTitle.textContent = 'Content Not Found'; 
        detailBody.innerHTML = '<p>Sorry, the requested content could not be found. Please return to the <a href="index.html">homepage</a>.</p>'; 
        if (relatedPostsContainer) { relatedPostsContainer.closest('.related-posts-section').style.display = 'none'; } 
        return; 
    }

    async function populateMainContent(term) {
        const newTitle = generateSeoTitle(term);
        const capitalizedTermForArticle = capitalizeEachWord(term);
        document.title = `${newTitle} | RecipeFiesta`; // You might want to change "RecipeFiesta"
        detailTitle.textContent = newTitle;

        const imageUrl = `https://tse1.mm.bing.net/th?q=${encodeURIComponent(term)}&w=800&h=1200&c=7&rs=1&p=0&dpr=1.5&pid=1.7`;
        detailImageContainer.innerHTML = `<img src="${imageUrl}" alt="${newTitle}">`;

        // ▼▼▼ MODIFIED: Loading message in English ▼▼▼
        detailBody.innerHTML = '<p><em>Generating your article, please wait...</em></p>';

        try {
            // ▼▼▼ MODIFIED: Using the new general-purpose prompt ▼▼▼
            const prompt = `Generate a comprehensive and engaging article about '${capitalizedTermForArticle}'. The article should be well-structured and easy to read. Please include the following sections:

            1.  **Introduction:** A brief and captivating intro that explains what '${capitalizedTermForArticle}' is and why it's interesting.
            2.  **Main Body:** Discuss several key aspects, important facts, or main points related to the topic. Use bullet points or numbered lists where appropriate to improve readability.
            3.  **Conclusion:** A summary of the key points and a concluding thought.

            The entire article must be written in English. Use simple Markdown for formatting (headings, bold text, lists).`;

            const payload = {
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }]
            };

            const response = await fetch(GEMINI_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`API request failed with status ${response.status}`);
            }

            const data = await response.json();
            const articleContent = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            
            detailBody.innerHTML = formatGeminiResponseToHtml(articleContent);

        } catch (error) {
            console.error('Error fetching content from Gemini API:', error);
            // ▼▼▼ MODIFIED: Error message in English ▼▼▼
            detailBody.innerHTML = '<p>Sorry, an error occurred while loading the article. Please try again later.</p>';
        }
    }

    // This function remains unchanged, as it's language-agnostic.
    function generateRelatedPosts(term) {
        const script = document.createElement('script');
        script.src = `https://suggestqueries.google.com/complete/search?jsonp=handleRelatedSuggest&hl=en&client=firefox&q=${encodeURIComponent(term)}`;
        document.head.appendChild(script);
        script.onload = () => script.remove();
        script.onerror = () => { relatedPostsContainer.innerHTML = '<div class="loading-placeholder">Could not load related posts.</div>'; script.remove(); }
    }

    // This function remains unchanged.
    window.handleRelatedSuggest = function(data) {
        const suggestions = data[1];
        relatedPostsContainer.innerHTML = '';
        if (!suggestions || suggestions.length === 0) { relatedPostsContainer.closest('.related-posts-section').style.display = 'none'; return; }
        const originalKeyword = keyword.toLowerCase();
        let relatedCount = 0;
        suggestions.forEach(relatedTerm => {
            if (relatedTerm.toLowerCase() === originalKeyword || relatedCount >= 11) return;
            relatedCount++;
            const keywordForUrl = relatedTerm.replace(/\s/g, '-').toLowerCase();
            const linkUrl = `detail.html?q=${encodeURIComponent(keywordForUrl)}`;
            
            const imageUrl = `https://tse1.mm.bing.net/th?q=${encodeURIComponent(relatedTerm)}&w=600&h=900&c=7&rs=1&p=0&dpr=1.5&pid=1.7`;
            const newRelatedTitle = generateSeoTitle(relatedTerm);
            const card = `<article class="content-card"><a href="${linkUrl}"><img src="${imageUrl}" alt="${newRelatedTitle}" loading="lazy"><div class="content-card-body"><h3>${newRelatedTitle}</h3></div></a></article>`;
            relatedPostsContainer.innerHTML += card;
        });
        if (relatedCount === 0) { relatedPostsContainer.closest('.related-posts-section').style.display = 'none'; }
    };

    populateMainContent(keyword);
    generateRelatedPosts(keyword);
});
