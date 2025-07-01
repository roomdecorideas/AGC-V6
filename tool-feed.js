document.addEventListener('DOMContentLoaded', function() {
    // --- Pengaturan Feed ---
    const FILENAME = 'feed.xml';

    // --- Elemen DOM ---
    const generateBtn = document.getElementById('generate-btn');
    const statusOutput = document.getElementById('status-output');
    const keywordListInput = document.getElementById('keyword-list');
    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');

    // --- Fungsi Bantuan ---
    function capitalizeEachWord(str) { 
        if (!str) return ''; 
        return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '); 
    }
    
    function generateSeoTitle(baseKeyword) { 
        const hookWords = ['Delicious', 'Easy', 'Quick', 'Healthy', 'Tasty', 'Simple', 'Best', 'Amazing', 'Homemade', 'Ultimate']; 
        const randomHook = hookWords[Math.floor(Math.random() * hookWords.length)]; 
        const randomNumber = Math.floor(Math.random() * (50 - 10 + 1)) + 10; 
        const capitalizedKeyword = capitalizeEachWord(baseKeyword); 
        return `${randomHook} ${capitalizedKeyword} Recipe`; 
    }

    function escapeXml(unsafe) {
        if (!unsafe) return '';
        return unsafe.replace(/[<>&'"]/g, function (c) {
            switch (c) {
                case '<': return '&lt;';
                case '>': return '&gt;';
                case '&': return '&amp;';
                case '"': return '&quot;';
                case "'": return '&apos;';
                default: return c;
            }
        });
    }

    /**
     * Menghasilkan Feed RSS 2.0 dengan Distribusi Tanggal
     * @param {Array<string>} keywordList - Daftar keyword terpilih.
     * @param {string} siteUrl - URL dasar website.
     * @param {Date} startDate - Tanggal mulai untuk publikasi.
     * @param {number} postsPerDay - Jumlah post yang akan dipublikasikan per hari.
     * @returns {string} String XML lengkap.
     */
    function generateRssFeed(keywordList, siteUrl, startDate, postsPerDay) {
        let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
        xml += `<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:wfw="http://wellformedweb.org/CommentAPI/" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:sy="http://purl.org/rss/1.0/modules/syndication/" xmlns:slash="http://purl.org/rss/1.0/modules/slash/">\n`;
        xml += `<channel>\n`;
        xml += `    <title>RecipeFiesta Feed</title>\n<link>${siteUrl}</link>\n<description>Latest Recipe and Culinary Inspirations</description>\n`;
        xml += `    <atom:link href="${siteUrl}/feed.xml" rel="self" type="application/rss+xml" />\n\n`;

        keywordList.forEach((keyword, index) => {
            const dayOffset = Math.floor(index / postsPerDay);
            const postDate = new Date(startDate);
            postDate.setDate(postDate.getDate() + dayOffset);

            const randomHour = Math.floor(Math.random() * 24);
            const randomMinute = Math.floor(Math.random() * 60);
            const randomSecond = Math.floor(Math.random() * 60);
            postDate.setUTCHours(randomHour, randomMinute, randomSecond);

            const pubDate = postDate.toUTCString();
            const title = generateSeoTitle(keyword);
            const keywordForUrl = keyword.replace(/\s/g, '-').toLowerCase();
            const articleUrl = `${siteUrl}/detail.html?q=${encodeURIComponent(keywordForUrl)}`;
            const imageUrl = `https://tse1.mm.bing.net/th?q=${encodeURIComponent(keyword)}&amp;w=400&amp;h=600&amp;c=7&amp;rs=1&amp;p=0&amp;dpr=1.5&amp;pid=1.7`;
            
            const capitalizedKeyword = capitalizeEachWord(keyword);
            // BARU: Deskripsi dibuat tanpa hashtag dan variabel hashtag dihapus.
            const description = `Craving a new recipe for ${capitalizedKeyword}? Discover an amazing dish and stunning visuals. Click to get the full recipe now!`;

            const escapedTitle = escapeXml(title);
            const escapedDescription = escapeXml(description);

            xml += `    <item>\n`;
            xml += `        <title>${escapedTitle}</title>\n`;
            xml += `        <link>${articleUrl}</link>\n`;
            xml += `        <description>${escapedDescription}</description>\n`;
            xml += `        <pubDate>${pubDate}</pubDate>\n`;
            xml += `        <enclosure url="${imageUrl}" type="image/jpeg" />\n`;
            xml += `    </item>\n`;
        });

        xml += `</channel>\n</rss>`;
        return xml;
    }

    // --- Logika Utama Saat Tombol Diklik ---
    generateBtn.addEventListener('click', async () => {
        const keywordListData = keywordListInput.value;
        const startDateVal = startDateInput.value;
        const endDateVal = endDateInput.value;

        // Validasi input
        if (!keywordListData.trim()) {
            statusOutput.textContent = 'Error: Please enter at least one keyword in the list.';
            statusOutput.style.color = 'red';
            return;
        }
        if (!startDateVal || !endDateVal) {
            statusOutput.textContent = 'Error: Please select both a Start Date and an End Date.';
            statusOutput.style.color = 'red';
            return;
        }

        const startDate = new Date(startDateVal);
        const endDate = new Date(endDateVal);
        if (endDate < startDate) {
            statusOutput.textContent = 'Error: End Date cannot be earlier than Start Date.';
            statusOutput.style.color = 'red';
            return;
        }
        
        try {
            statusOutput.textContent = 'Status: Processing...';
            statusOutput.style.color = '#333';
            generateBtn.disabled = true;
            generateBtn.textContent = 'Generating...';

            const domainResponse = await fetch('domain.txt');
            if (!domainResponse.ok) throw new Error('Could not find domain.txt file.');
            const siteUrl = (await domainResponse.text()).trim().replace(/\/$/, '');
            if (!siteUrl) throw new Error('domain.txt file is empty.');

            const keywordSelection = keywordListData.split('\n').map(k => k.trim()).filter(k => k !== '');
            if (keywordSelection.length === 0) {
                throw new Error('Keyword list is empty or contains only whitespace.');
            }

            const diffTime = Math.abs(endDate - startDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

            const postsPerDay = Math.ceil(keywordSelection.length / diffDays);

            statusOutput.textContent = `Status: Processing ${keywordSelection.length} keywords over ${diffDays} days (${postsPerDay} posts/day)...`;
            
            const feedXml = generateRssFeed(keywordSelection, siteUrl, startDate, postsPerDay);

            const blob = new Blob([feedXml], { type: 'application/rss+xml;charset=utf-8' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = FILENAME;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);

            statusOutput.textContent = `Status: Success! ${FILENAME} generated for the period of ${diffDays} days.`;
            statusOutput.style.color = 'green';

        } catch (error) {
            console.error('Feed Generation Error:', error);
            statusOutput.textContent = `Error: ${error.message}`;
            statusOutput.style.color = 'red';
        } finally {
            generateBtn.disabled = false;
            generateBtn.textContent = 'Generate & Download feed.xml';
        }
    });

    // Set tanggal default ke hari ini
    const today = new Date().toISOString().slice(0, 10);
    startDateInput.value = today;
    endDateInput.value = today;
});
