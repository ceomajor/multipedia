// Wikipedia API endpoints
const WIKI_API_RU = 'https://ru.wikipedia.org/w/api.php';
const WIKI_API_EN = 'https://en.wikipedia.org/w/api.php';

// DOM Elements
const searchInput = document.getElementById('searchInput');
const searchButton = document.getElementById('searchButton');
const suggestionsContainer = document.getElementById('suggestions');
const searchSection = document.getElementById('searchSection');
const articleSection = document.getElementById('articleSection');
const articleContent = document.getElementById('articleContent');
const backButton = document.getElementById('backButton');

let searchTimeout;
let selectedLanguage = 'ru'; // 'ru' or 'en'
let aiModeEnabled = false;

// Initialize
searchInput.focus();

// Set initial viewport for search page
updateViewportForSearch();

// AI toggle handler
const aiToggle = document.getElementById('aiToggle');

aiToggle.addEventListener('click', () => {
    aiModeEnabled = !aiModeEnabled;
    
    if (aiModeEnabled) {
        aiToggle.classList.add('active');
        searchInput.classList.add('ai-mode');
        searchInput.placeholder = 'AI поможет найти нужную информацию...';
    } else {
        aiToggle.classList.remove('active');
        searchInput.classList.remove('ai-mode');
        searchInput.placeholder = 'Поиск по миллионам статей...';
    }
});

// Language toggle handler
const languageToggle = document.getElementById('languageToggle');
const flagElement = languageToggle.querySelector('.flag');

languageToggle.addEventListener('click', () => {
    // Toggle language
    if (selectedLanguage === 'ru') {
        selectedLanguage = 'en';
        flagElement.textContent = '🇬🇧';
        languageToggle.title = 'Switch language';
    } else {
        selectedLanguage = 'ru';
        flagElement.textContent = '🇷🇺';
        languageToggle.title = 'Переключить язык';
    }
    
    // Re-trigger search if there's a query
    const query = searchInput.value.trim();
    if (query.length >= 2) {
        searchArticles(query);
    }
});

// Search input handler
searchInput.addEventListener('input', (e) => {
    const query = e.target.value.trim();
    
    clearTimeout(searchTimeout);
    
    if (query.length < 2) {
        hideSuggestions();
        return;
    }
    
    // AI mode: faster search and better suggestions
    const delay = aiModeEnabled ? 100 : 300;
    
    searchTimeout = setTimeout(() => {
        searchArticles(query);
    }, delay);
});

// Click outside to close suggestions
document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-container')) {
        hideSuggestions();
    }
});

// Back button handler
backButton.addEventListener('click', () => {
    showSearchSection();
});

// Search button handler
searchButton.addEventListener('click', () => {
    const query = searchInput.value.trim();
    if (query.length >= 2) {
        const firstSuggestion = document.querySelector('.suggestion-item');
        if (firstSuggestion) {
            firstSuggestion.click();
        } else {
            // If no suggestions, trigger search
            searchArticles(query);
        }
    }
});

// Detect language of query
function detectLanguage(text) {
    // Check if text contains Cyrillic characters
    const cyrillicPattern = /[а-яА-ЯёЁ]/;
    return cyrillicPattern.test(text) ? 'ru' : 'en';
}

// Convert keyboard layout (EN->RU or RU->EN)
function convertLayout(text, toRussian = true) {
    const enToRu = {
        'q': 'й', 'w': 'ц', 'e': 'у', 'r': 'к', 't': 'е', 'y': 'н', 'u': 'г', 'i': 'ш', 'o': 'щ', 'p': 'з',
        '[': 'х', ']': 'ъ', 'a': 'ф', 's': 'ы', 'd': 'в', 'f': 'а', 'g': 'п', 'h': 'р', 'j': 'о', 'k': 'л',
        'l': 'д', ';': 'ж', "'": 'э', 'z': 'я', 'x': 'ч', 'c': 'с', 'v': 'м', 'b': 'и', 'n': 'т', 'm': 'ь',
        ',': 'б', '.': 'ю', '/': '.', '`': 'ё',
        'Q': 'Й', 'W': 'Ц', 'E': 'У', 'R': 'К', 'T': 'Е', 'Y': 'Н', 'U': 'Г', 'I': 'Ш', 'O': 'Щ', 'P': 'З',
        '{': 'Х', '}': 'Ъ', 'A': 'Ф', 'S': 'Ы', 'D': 'В', 'F': 'А', 'G': 'П', 'H': 'Р', 'J': 'О', 'K': 'Л',
        'L': 'Д', ':': 'Ж', '"': 'Э', 'Z': 'Я', 'X': 'Ч', 'C': 'С', 'V': 'М', 'B': 'И', 'N': 'Т', 'M': 'Ь',
        '<': 'Б', '>': 'Ю', '?': ',', '~': 'Ё'
    };
    
    const ruToEn = {};
    for (const [en, ru] of Object.entries(enToRu)) {
        ruToEn[ru] = en;
    }
    
    const map = toRussian ? enToRu : ruToEn;
    return text.split('').map(char => map[char] || char).join('');
}

// Common Russian words for pattern matching
const commonRussianWords = [
    // Geography
    'россия', 'москва', 'путин', 'санкт-петербург', 'петербург', 'спб', 'сибирь', 'урал', 'кавказ',
    'европа', 'азия', 'африка', 'америка', 'австралия', 'антарктида',
    'волга', 'байкал', 'черное', 'каспийское', 'балтийское',
    
    // Science
    'история', 'наука', 'физика', 'химия', 'биология', 'математика', 'астрономия', 'геология',
    'медицина', 'психология', 'философия', 'экономика', 'политика',
    
    // Nature
    'земля', 'солнце', 'луна', 'космос', 'вселенная', 'планета', 'звезда', 'галактика',
    'человек', 'животное', 'растение', 'дерево', 'цветок', 'лес', 'поле', 'гора',
    
    // Common words
    'война', 'мир', 'страна', 'город', 'река', 'море', 'океан', 'остров',
    'культура', 'искусство', 'музыка', 'литература', 'театр', 'кино',
    'спорт', 'футбол', 'хоккей', 'олимпиада',
    
    // Historical figures
    'ленин', 'сталин', 'гагарин', 'пушкин', 'толстой', 'достоевский', 'чехов',
    'менделеев', 'ломоносов', 'павлов', 'королев'
];

// Common English words for pattern matching
const commonEnglishWords = [
    // Geography
    'russia', 'moscow', 'putin', 'saint', 'petersburg', 'siberia', 'ural',
    'europe', 'asia', 'africa', 'america', 'australia', 'antarctica',
    'london', 'paris', 'berlin', 'rome', 'madrid', 'beijing', 'tokyo',
    
    // Science
    'history', 'science', 'physics', 'chemistry', 'biology', 'mathematics', 'astronomy',
    'medicine', 'psychology', 'philosophy', 'economics', 'politics',
    
    // Nature
    'earth', 'sun', 'moon', 'space', 'universe', 'planet', 'star', 'galaxy',
    'human', 'animal', 'plant', 'tree', 'flower', 'forest', 'mountain',
    
    // Common words
    'war', 'peace', 'country', 'city', 'river', 'sea', 'ocean', 'island',
    'culture', 'art', 'music', 'literature', 'theater', 'cinema',
    'sport', 'football', 'hockey', 'olympic',
    
    // Historical figures
    'einstein', 'newton', 'darwin', 'shakespeare', 'beethoven', 'mozart',
    'napoleon', 'caesar', 'alexander', 'washington', 'lincoln'
];

// Detect if text is in wrong layout
function detectWrongLayout(text) {
    // Check if text looks like English but might be Russian in wrong layout
    const hasEnglishLetters = /[a-zA-Z]/.test(text);
    const hasCyrillicLetters = /[а-яА-ЯёЁ]/.test(text);
    
    // If has English letters but no Cyrillic, might be wrong layout
    if (hasEnglishLetters && !hasCyrillicLetters) {
        // Check if conversion to Russian makes sense
        const converted = convertLayout(text, true);
        const convertedLower = converted.toLowerCase();
        
        // Check if converted text matches common Russian words
        for (const word of commonRussianWords) {
            if (convertedLower.includes(word) || word.includes(convertedLower)) {
                return converted;
            }
        }
        
        // Count vowels and consonants in converted text
        const vowels = (converted.match(/[аеиоуыэюяё]/gi) || []).length;
        const consonants = (converted.match(/[бвгджзклмнпрстфхцчшщ]/gi) || []).length;
        const total = vowels + consonants;
        
        // More lenient vowel/consonant ratio (15-60% vowels)
        if (total >= 2) {
            const vowelRatio = vowels / total;
            if (vowelRatio >= 0.15 && vowelRatio <= 0.6) {
                // Additional check: should not be a common English word
                const textLower = text.toLowerCase();
                const isCommonEnglish = commonEnglishWords.some(word => 
                    textLower === word || textLower.startsWith(word + ' ') || 
                    textLower.endsWith(' ' + word) || textLower.includes(' ' + word + ' ')
                );
                
                if (!isCommonEnglish) {
                    return converted;
                }
            }
        }
        
        // Check for specific Russian letter combinations that are common
        const russianPatterns = [
            /[аеиоуыэюяё]{2,}/i,  // Multiple vowels
            /ст|пр|кр|тр|вр|гр|др/i,  // Common consonant pairs
            /ов|ев|ин|ан|ен|он/i,  // Common endings
            /[бвгджзклмнпрстфхцчшщ][аеиоуыэюяё][бвгджзклмнпрстфхцчшщ]/i  // consonant-vowel-consonant
        ];
        
        if (total >= 3 && russianPatterns.some(pattern => pattern.test(converted))) {
            return converted;
        }
    }
    
    // If has Cyrillic letters but looks like it should be English
    if (hasCyrillicLetters && !hasEnglishLetters) {
        const converted = convertLayout(text, false);
        const convertedLower = converted.toLowerCase();
        
        // Check if converted text matches common English words
        for (const word of commonEnglishWords) {
            if (convertedLower.includes(word) || word.includes(convertedLower)) {
                return converted;
            }
        }
        
        // Count vowels in converted text
        const vowels = (converted.match(/[aeiou]/gi) || []).length;
        const consonants = (converted.match(/[bcdfghjklmnpqrstvwxyz]/gi) || []).length;
        const total = vowels + consonants;
        
        // More lenient vowel/consonant ratio (20-50% vowels)
        if (total >= 2) {
            const vowelRatio = vowels / total;
            if (vowelRatio >= 0.2 && vowelRatio <= 0.5) {
                return converted;
            }
        }
    }
    
    return null;
}

// Levenshtein distance for typo correction
function levenshteinDistance(a, b) {
    const matrix = [];
    
    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }
    
    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }
    
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }
    
    return matrix[b.length][a.length];
}

// Find closest word from dictionary
function findClosestWord(word, dictionary) {
    let minDistance = Infinity;
    let closestWord = null;
    
    const wordLower = word.toLowerCase();
    
    for (const dictWord of dictionary) {
        const distance = levenshteinDistance(wordLower, dictWord);
        // Allow 1-2 character difference depending on word length
        const threshold = word.length <= 4 ? 1 : 2;
        
        if (distance <= threshold && distance < minDistance) {
            minDistance = distance;
            closestWord = dictWord;
        }
    }
    
    return closestWord;
}

// Synonyms and related topics
const synonymsMap = {
    'сша': ['америка', 'соединенные штаты америки', 'вашингтон'],
    'америка': ['сша', 'соединенные штаты америки'],
    'космос': ['вселенная', 'астрономия', 'галактика'],
    'вселенная': ['космос', 'астрономия'],
    'россия': ['российская федерация', 'рф', 'москва'],
    'москва': ['столица россии', 'россия'],
    'питер': ['санкт-петербург', 'петербург', 'спб'],
    'спб': ['санкт-петербург', 'петербург'],
    'война': ['военная история', 'конфликт'],
    'наука': ['научные открытия', 'исследования'],
    'физика': ['наука', 'квантовая механика'],
    'химия': ['наука', 'элементы'],
    'биология': ['наука', 'живые организмы'],
    
    // English
    'usa': ['america', 'united states', 'washington'],
    'america': ['usa', 'united states'],
    'space': ['universe', 'astronomy', 'cosmos'],
    'universe': ['space', 'astronomy', 'cosmos'],
    'russia': ['russian federation', 'moscow'],
    'moscow': ['capital of russia', 'russia']
};

// Question patterns to extract search terms
const questionPatterns = [
    // Russian patterns
    { pattern: /кто такой (.*)\??/i, extract: 1 },
    { pattern: /кто такая (.*)\??/i, extract: 1 },
    { pattern: /что такое (.*)\??/i, extract: 1 },
    { pattern: /где находится (.*)\??/i, extract: 1 },
    { pattern: /когда (.*)\??/i, extract: 1 },
    { pattern: /столица (.*)\??/i, extract: (match) => {
        const country = match[1].toLowerCase();
        const capitals = {
            'россии': 'москва',
            'франции': 'париж',
            'германии': 'берлин',
            'италии': 'рим',
            'испании': 'мадрид',
            'китая': 'пекин',
            'японии': 'токио',
            'сша': 'вашингтон',
            'англии': 'лондон',
            'великобритании': 'лондон'
        };
        return capitals[country] || match[1];
    }},
    
    // English patterns
    { pattern: /who is (.*)\??/i, extract: 1 },
    { pattern: /what is (.*)\??/i, extract: 1 },
    { pattern: /where is (.*)\??/i, extract: 1 },
    { pattern: /when (.*)\??/i, extract: 1 },
    { pattern: /capital of (.*)\??/i, extract: (match) => {
        const country = match[1].toLowerCase();
        const capitals = {
            'russia': 'moscow',
            'france': 'paris',
            'germany': 'berlin',
            'italy': 'rome',
            'spain': 'madrid',
            'china': 'beijing',
            'japan': 'tokyo',
            'usa': 'washington',
            'england': 'london',
            'uk': 'london'
        };
        return capitals[country] || match[1];
    }}
];

// Smart autocomplete suggestions
const popularSearches = [
    // Russian
    'путин', 'пушкин', 'пунические войны', 'петр первый', 'первая мировая война',
    'москва', 'марс', 'математика', 'медицина', 'менделеев',
    'россия', 'рим', 'ренессанс', 'революция',
    'космос', 'кутузов', 'куликовская битва',
    'солнце', 'сталин', 'сталинград', 'средневековье',
    'наполеон', 'ньютон', 'нобелевская премия',
    
    // English
    'putin', 'pushkin', 'punic wars', 'peter the great',
    'moscow', 'mars', 'mathematics', 'medicine', 'mendeleev',
    'russia', 'rome', 'renaissance', 'revolution',
    'space', 'stalin', 'stalingrad',
    'napoleon', 'newton', 'nobel prize'
];

// Enhance query with AI suggestions
function enhanceQuery(query) {
    if (!aiModeEnabled) return query;
    
    // AI mode: improve search query
    query = query.trim();
    
    // 1. Check if it's a question and extract the search term
    for (const { pattern, extract } of questionPatterns) {
        const match = query.match(pattern);
        if (match) {
            if (typeof extract === 'function') {
                query = extract(match);
            } else {
                query = match[extract];
            }
            break;
        }
    }
    
    // 2. Auto-correct common typos and improve queries
    const improvements = {
        // Common typos (Russian)
        'рассия': 'россия',
        'масква': 'москва',
        'моксва': 'москва',
        'пушкн': 'пушкин',
        'питербург': 'санкт-петербург',
        'санкт-питербург': 'санкт-петербург',
        'спб': 'санкт-петербург',
        'мск': 'москва',
        
        // Better search terms
        'америка': 'соединённые штаты америки',
        'англия': 'великобритания',
        'сша': 'соединённые штаты америки',
        'usa': 'united states',
        'uk': 'united kingdom',
        
        // Common abbreviations
        'рф': 'россия',
        'ссср': 'советский союз',
        'ес': 'европейский союз',
        'оон': 'организация объединённых наций',
        'nasa': 'national aeronautics and space administration',
        
        // Science
        'днк': 'дезоксирибонуклеиновая кислота',
        'dna': 'deoxyribonucleic acid'
    };
    
    const lowerQuery = query.toLowerCase();
    for (const [short, full] of Object.entries(improvements)) {
        if (lowerQuery === short || lowerQuery.includes(' ' + short + ' ') || 
            lowerQuery.startsWith(short + ' ') || lowerQuery.endsWith(' ' + short)) {
            query = query.toLowerCase().replace(new RegExp('\\b' + short + '\\b', 'gi'), full);
            break;
        }
    }
    
    // 3. Try to fix typos using Levenshtein distance
    const allWords = [...commonRussianWords, ...commonEnglishWords, ...popularSearches];
    const correctedWord = findClosestWord(query, allWords);
    if (correctedWord && correctedWord !== query.toLowerCase()) {
        query = correctedWord;
    }
    
    return query;
}

// Check for custom articles in search
function getCustomArticleSuggestions(query, lang) {
    const queryLower = query.toLowerCase();
    const customResults = [];
    
    // Check for Manayeva
    if (queryLower.includes('манаева') || queryLower.includes('айшат') || 
        queryLower.includes('manayeva') || queryLower.includes('ayishat')) {
        customResults.push({
            title: lang === 'ru' ? 'Манаева Айшат' : 'Ayishat Manayeva',
            description: lang === 'ru' ? 'Самая красивая девушка на свете' : 'The most beautiful girl in the world',
            url: '#',
            lang: lang,
            isCustom: true
        });
    }
    
    // Check for Akhmadov
    if (queryLower.includes('ахмадов') || queryLower.includes('сулим') || 
        queryLower.includes('akhmadov') || queryLower.includes('sulim')) {
        customResults.push({
            title: lang === 'ru' ? 'Ахмадов Сулим' : 'Sulim Akhmadov',
            description: lang === 'ru' ? 'Основатель MultiPedia' : 'Founder of MultiPedia',
            url: '#',
            lang: lang,
            isCustom: true
        });
    }
    
    return customResults;
}

// Search articles from selected language Wikipedia
async function searchArticles(query) {
    try {
        // Enhance query in AI mode
        let enhancedQuery = enhanceQuery(query);
        let layoutCorrected = null;
        
        let results = [];
        
        // First, check for custom articles
        const customResults = getCustomArticleSuggestions(query, selectedLanguage);
        
        // AI mode: search with more results
        const limit = aiModeEnabled ? 8 : 5;
        
        // AI mode: check for wrong layout first
        if (aiModeEnabled) {
            const converted = detectWrongLayout(enhancedQuery);
            if (converted) {
                // Try both original and converted, use whichever has more results
                const apiUrl = selectedLanguage === 'ru' ? WIKI_API_RU : WIKI_API_EN;
                const lang = selectedLanguage;
                
                const [originalResults, convertedResults] = await Promise.all([
                    searchWikipedia(enhancedQuery, apiUrl, lang, limit),
                    searchWikipedia(converted, apiUrl, lang, limit)
                ]);
                
                // Prefer converted if original has no results, or if converted has significantly more
                if (originalResults.length === 0 && convertedResults.length > 0) {
                    results = convertedResults;
                    layoutCorrected = converted;
                } else if (convertedResults.length > originalResults.length * 1.5) {
                    results = convertedResults;
                    layoutCorrected = converted;
                } else {
                    results = originalResults;
                }
            } else {
                // No layout issue detected, search normally
                const apiUrl = selectedLanguage === 'ru' ? WIKI_API_RU : WIKI_API_EN;
                results = await searchWikipedia(enhancedQuery, apiUrl, selectedLanguage, limit);
            }
        } else {
            // Normal mode: just search
            const apiUrl = selectedLanguage === 'ru' ? WIKI_API_RU : WIKI_API_EN;
            results = await searchWikipedia(enhancedQuery, apiUrl, selectedLanguage, limit);
        }
        
        // Combine custom results with Wikipedia results (custom first)
        results = [...customResults, ...results];
        
        // Show which correction was applied
        const correctionMessage = layoutCorrected || (query !== enhancedQuery ? enhancedQuery : null);
        displaySuggestions(results, correctionMessage);
    } catch (error) {
        console.error('Search error:', error);
    }
}

// Search Wikipedia API
async function searchWikipedia(query, apiUrl, lang, limit = 5) {
    const params = new URLSearchParams({
        action: 'opensearch',
        search: query,
        limit: limit.toString(),
        namespace: '0',
        format: 'json',
        origin: '*'
    });
    
    try {
        const response = await fetch(`${apiUrl}?${params}`);
        const data = await response.json();
        
        const results = [];
        const titles = data[1];
        const descriptions = data[2];
        const urls = data[3];
        
        for (let i = 0; i < titles.length; i++) {
            results.push({
                title: titles[i],
                description: descriptions[i],
                url: urls[i],
                lang: lang
            });
        }
        
        return results;
    } catch (error) {
        console.error(`Error searching ${lang}:`, error);
        return [];
    }
}

// Display search suggestions
function displaySuggestions(results, enhancedQuery = null) {
    if (results.length === 0) {
        hideSuggestions();
        return;
    }
    
    let html = '';
    
    // Show AI enhancement notice if query was improved
    if (enhancedQuery && aiModeEnabled) {
        html += `
            <div class="ai-suggestion-notice">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 16v-4M12 8h.01"/>
                </svg>
                <span>AI улучшил запрос: "${enhancedQuery}"</span>
            </div>
        `;
    }
    
    // Show related topics in AI mode
    if (aiModeEnabled) {
        const queryLower = (enhancedQuery || searchInput.value).toLowerCase().trim();
        const relatedTopics = synonymsMap[queryLower];
        
        if (relatedTopics && relatedTopics.length > 0) {
            html += `
                <div class="related-topics">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                    </svg>
                    <span>Связанные темы:</span>
                    <div class="related-topics-list">
                        ${relatedTopics.slice(0, 3).map(topic => `
                            <span class="related-topic-tag" data-topic="${topic}">${topic}</span>
                        `).join('')}
                    </div>
                </div>
            `;
        }
    }
    
    html += results.map(result => `
        <div class="suggestion-item" data-title="${result.title}" data-lang="${result.lang}">
            <div class="suggestion-title">${result.title}</div>
            ${result.description ? `<div class="suggestion-description">${result.description}</div>` : ''}
        </div>
    `).join('');
    
    suggestionsContainer.innerHTML = html;
    suggestionsContainer.classList.add('active');
    
    // Add click handlers to suggestions
    document.querySelectorAll('.suggestion-item').forEach(item => {
        item.addEventListener('click', () => {
            const title = item.dataset.title;
            const lang = item.dataset.lang;
            loadArticle(title, lang);
        });
    });
    
    // Add click handlers to related topics
    document.querySelectorAll('.related-topic-tag').forEach(tag => {
        tag.addEventListener('click', (e) => {
            e.stopPropagation();
            const topic = tag.dataset.topic;
            searchInput.value = topic;
            searchArticles(topic);
        });
    });
}

// Hide suggestions
function hideSuggestions() {
    suggestionsContainer.classList.remove('active');
    suggestionsContainer.innerHTML = '';
}

// Calculate water usage for cooling servers (approximate)
function calculateWaterUsage(responseSize) {
    // Approximate calculation:
    // 1 KB of data transfer ≈ 0.2 ml of water for cooling
    // This is a simplified estimation based on data center cooling requirements
    const waterPerKB = 0.2; // ml per KB
    const sizeInKB = responseSize / 1024;
    return Math.round(sizeInKB * waterPerKB * 10) / 10; // Round to 1 decimal
}

// Check if article is about Netanyahu
function isNetanyahuArticle(title) {
    const titleLower = title.toLowerCase();
    return titleLower.includes('нетаньяху') || 
           titleLower.includes('netanyahu') ||
           titleLower.includes('биньямин') ||
           titleLower.includes('benjamin') && titleLower.includes('нетан');
}

// Check if article is about Gaza War
function isGazaWarArticle(title) {
    const titleLower = title.toLowerCase();
    
    // Gaza + war/conflict keywords only
    const gazaKeywords = ['газ', 'gaza'];
    const warKeywords = [
        'война', 'конфликт', 'вторжение', 'осада', 'бомбардировка',
        'war', 'conflict', 'invasion', 'siege', 'bombing', 'attack',
        'massacre', 'genocide'
    ];
    
    // Check if title contains Gaza + war keyword
    const hasGaza = gazaKeywords.some(keyword => titleLower.includes(keyword));
    const hasWar = warKeywords.some(keyword => titleLower.includes(keyword));
    
    if (hasGaza && hasWar) return true;
    
    // Specific war/conflict article patterns
    if (titleLower.includes('война израиля и хамас')) return true;
    if (titleLower.includes('israel') && titleLower.includes('hamas') && titleLower.includes('war')) return true;
    if (titleLower.includes('израильско-палестинский') && titleLower.includes('конфликт')) return true;
    if (titleLower.includes('israeli') && titleLower.includes('palestinian') && titleLower.includes('conflict')) return true;
    if (titleLower.includes('палестин') && (titleLower.includes('война') || titleLower.includes('конфликт'))) return true;
    if (titleLower.includes('palestinian') && (titleLower.includes('war') || titleLower.includes('conflict'))) return true;
    
    return false;
}

// Check if article is about Ayishat Manayeva
function isManayevaArticle(title) {
    const titleLower = title.toLowerCase();
    return (titleLower.includes('манаева') && titleLower.includes('айшат')) ||
           (titleLower.includes('айшат') && titleLower.includes('манаева')) ||
           (titleLower.includes('manayeva') && titleLower.includes('ayishat')) ||
           (titleLower.includes('ayishat') && titleLower.includes('manayeva'));
}

// Check if article is about Sulim Akhmadov
function isAkhmadovArticle(title) {
    const titleLower = title.toLowerCase();
    return (titleLower.includes('ахмадов') && titleLower.includes('сулим')) ||
           (titleLower.includes('сулим') && titleLower.includes('ахмадов')) ||
           (titleLower.includes('akhmadov') && titleLower.includes('sulim')) ||
           (titleLower.includes('sulim') && titleLower.includes('akhmadov'));
}

// Extract main image from Wikipedia HTML
function extractMainImage(html) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    // Look for infobox image first
    const infoboxImg = tempDiv.querySelector('.infobox img, .vcard img, table.infobox img');
    if (infoboxImg) {
        let src = infoboxImg.getAttribute('src');
        if (src && src.startsWith('//')) {
            src = 'https:' + src;
        }
        return src;
    }
    
    // Otherwise get first significant image
    const images = tempDiv.querySelectorAll('img');
    for (const img of images) {
        let src = img.getAttribute('src');
        if (src && !src.includes('icon') && !src.includes('logo')) {
            if (src.startsWith('//')) {
                src = 'https:' + src;
            }
            return src;
        }
    }
    
    return null;
}

// Load article content
async function loadArticle(title, lang) {
    hideSuggestions();
    showArticleSection();
    
    articleContent.innerHTML = '<div class="loading">Загрузка статьи...</div>';
    
    // Check if this is a custom article
    const isNetanyahu = isNetanyahuArticle(title);
    const isGazaWar = isGazaWarArticle(title);
    const isManayeva = isManayevaArticle(title);
    const isAkhmadov = isAkhmadovArticle(title);
    
    // Handle custom articles that don't exist in Wikipedia
    if (isManayeva) {
        const customContent = lang === 'ru' ? manayevaContentRU : manayevaContentEN;
        const displayTitle = lang === 'ru' ? 'Манаева Айшат' : 'Ayishat Manayeva';
        
        const waterBadge = `
            <div class="water-usage-badge" title="Приблизительное количество воды для охлаждения серверов">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
                </svg>
                <span>0.5 мл воды</span>
                <span class="separator">•</span>
                <span>10 мс</span>
            </div>
        `;
        
        articleContent.innerHTML = `<h1>${displayTitle}</h1>${waterBadge}${customContent}`;
        
        // Setup internal links
        setupInternalLinks(lang);
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        return;
    }
    
    if (isAkhmadov) {
        const customContent = lang === 'ru' ? akhmadovContentRU : akhmadovContentEN;
        const displayTitle = lang === 'ru' ? 'Ахмадов Сулим' : 'Sulim Akhmadov';
        
        const waterBadge = `
            <div class="water-usage-badge" title="Приблизительное количество воды для охлаждения серверов">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
                </svg>
                <span>0.5 мл воды</span>
                <span class="separator">•</span>
                <span>10 мс</span>
            </div>
        `;
        
        articleContent.innerHTML = `<h1>${displayTitle}</h1>${waterBadge}${customContent}`;
        
        // Setup internal links
        setupInternalLinks(lang);
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        return;
    }
    
    const apiUrl = lang === 'ru' ? WIKI_API_RU : WIKI_API_EN;
    
    const params = new URLSearchParams({
        action: 'parse',
        page: title,
        format: 'json',
        prop: 'text',
        disableeditsection: 'true',
        redirects: 'true',
        origin: '*'
    });
    
    try {
        const startTime = performance.now();
        const response = await fetch(`${apiUrl}?${params}`);
        const data = await response.json();
        const endTime = performance.now();
        
        if (data.error) {
            // Try to search for similar articles
            await handleArticleNotFound(title, lang);
            return;
        }
        
        let html = data.parse.text['*'];
        
        // Calculate approximate response size and water usage
        const responseSize = JSON.stringify(data).length;
        const waterUsage = calculateWaterUsage(responseSize);
        const loadTime = Math.round(endTime - startTime);
        
        // If Netanyahu article, extract main image and use custom content
        if (isNetanyahu) {
            const mainImage = extractMainImage(html);
            
            // Use custom content from netanyahu-content.js
            const customContent = lang === 'ru' ? netanyahuContentRU : netanyahuContentEN;
            
            // Create image HTML if found
            let imageHTML = '';
            if (mainImage) {
                imageHTML = `
                    <div style="float: right; margin: 0 0 20px 20px; max-width: 300px;">
                        <img src="${mainImage}" alt="Netanyahu" style="width: 100%; height: auto; border-radius: 8px; cursor: pointer;" class="netanyahu-main-img">
                    </div>
                `;
            }
            
            // Create water usage info badge
            const waterBadge = `
                <div class="water-usage-badge" title="Приблизительное количество воды для охлаждения серверов">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
                    </svg>
                    <span>${waterUsage} мл воды</span>
                    <span class="separator">•</span>
                    <span>${loadTime} мс</span>
                </div>
            `;
            
            articleContent.innerHTML = `<h1>${data.parse.title}</h1>${waterBadge}${imageHTML}${customContent}`;
            
            // Setup image modal for the main image
            setupImageModal();
            
            // Scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });
            
            return;
        }
        
        // If Gaza War article, extract main image and use custom content
        if (isGazaWar) {
            const mainImage = extractMainImage(html);
            
            // Use custom content from netanyahu-content.js
            const customContent = lang === 'ru' ? gazaWarContentRU : gazaWarContentEN;
            
            // Create image HTML if found
            let imageHTML = '';
            if (mainImage) {
                imageHTML = `
                    <div style="float: right; margin: 0 0 20px 20px; max-width: 300px;">
                        <img src="${mainImage}" alt="Gaza War" style="width: 100%; height: auto; border-radius: 8px; cursor: pointer;" class="gaza-main-img">
                    </div>
                `;
            }
            
            // Create water usage info badge
            const waterBadge = `
                <div class="water-usage-badge" title="Приблизительное количество воды для охлаждения серверов">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
                    </svg>
                    <span>${waterUsage} мл воды</span>
                    <span class="separator">•</span>
                    <span>${loadTime} мс</span>
                </div>
            `;
            
            articleContent.innerHTML = `<h1>${data.parse.title}</h1>${waterBadge}${imageHTML}${customContent}`;
            
            // Setup image modal for the main image
            setupImageModal();
            
            // Scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });
            
            return;
        }
        
        // Clean up Wikipedia HTML for normal articles
        html = cleanWikipediaHTML(html, lang);
        
        // Create water usage info badge
        const waterBadge = `
            <div class="water-usage-badge" title="Приблизительное количество воды для охлаждения серверов">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
                </svg>
                <span>${waterUsage} мл воды</span>
                <span class="separator">•</span>
                <span>${loadTime} мс</span>
            </div>
        `;
        
        articleContent.innerHTML = `<h1>${data.parse.title}</h1>${waterBadge}${html}`;
        
        // Handle internal links
        setupInternalLinks(lang);
        
        // Setup image modal
        setupImageModal();
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
    } catch (error) {
        console.error('Error loading article:', error);
        articleContent.innerHTML = '<p>Ошибка при загрузке статьи.</p>';
    }
}

// Handle article not found - search for alternatives
async function handleArticleNotFound(title, lang) {
    articleContent.innerHTML = `
        <div style="text-align: center; padding: 40px 20px;">
            <h2 style="margin-bottom: 20px;">Статья не найдена</h2>
            <p style="color: #888; margin-bottom: 30px;">Статья "${title}" не существует. Попробуйте найти похожие статьи:</p>
            <div class="loading">Поиск похожих статей...</div>
        </div>
    `;
    
    // Search for similar articles
    const results = await searchWikipedia(title, lang === 'ru' ? WIKI_API_RU : WIKI_API_EN, lang);
    
    if (results.length > 0) {
        articleContent.innerHTML = `
            <div style="text-align: center; padding: 40px 20px;">
                <h2 style="margin-bottom: 20px;">Статья не найдена</h2>
                <p style="color: #888; margin-bottom: 30px;">Статья "${title}" не существует. Возможно, вы искали:</p>
                <div style="max-width: 500px; margin: 0 auto; text-align: left;">
                    ${results.map(result => `
                        <div class="suggestion-item" style="margin-bottom: 10px; padding: 16px; background: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 8px; cursor: pointer;" data-title="${result.title}" data-lang="${result.lang}">
                            <div style="font-size: 1.1rem; color: #ffffff; margin-bottom: 4px;">${result.title}</div>
                            ${result.description ? `<div style="font-size: 0.9rem; color: #888;">${result.description}</div>` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        // Add click handlers
        articleContent.querySelectorAll('.suggestion-item').forEach(item => {
            item.addEventListener('click', () => {
                const newTitle = item.dataset.title;
                const newLang = item.dataset.lang;
                loadArticle(newTitle, newLang);
            });
        });
    } else {
        articleContent.innerHTML = `
            <div style="text-align: center; padding: 40px 20px;">
                <h2 style="margin-bottom: 20px;">Статья не найдена</h2>
                <p style="color: #888; margin-bottom: 30px;">Статья "${title}" не существует и похожие статьи не найдены.</p>
                <button class="back-button" onclick="document.getElementById('backButton').click()">
                    Вернуться к поиску
                </button>
            </div>
        `;
    }
}

// Clean Wikipedia HTML
function cleanWikipediaHTML(html, lang) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    // Remove unwanted elements
    const selectorsToRemove = [
        '.mw-editsection',
        '.reference',
        '.mw-references-wrap',
        '.navbox',
        '.vertical-navbox',
        '.sistersitebox',
        '.sister-wikipedia',
        '.sister-commons',
        '.sister-wiktionary',
        '.sister-wikiquote',
        '.sister-wikinews',
        '.sister-wikisource',
        '.sister-wikibooks',
        '.sister-wikiversity',
        '.sister-wikispecies',
        '.sister-wikivoyage',
        '.sister-mediawiki',
        '.sister-meta',
        '.sister-project',
        '.interProject',
        '.noprint',
        '.ambox',
        '.metadata',
        'table.wikitable.mw-collapsible',
        '.hatnote',
        '.dablink',
        '#toc',
        '.toc',
        '.mw-jump-link',
        '.mw-indicators',
        '.catlinks',
        '#footer',
        '.printfooter',
        '.mw-footer',
        '.side-box',
        '.side-box-right',
        '.plainlinks'
    ];
    
    selectorsToRemove.forEach(selector => {
        tempDiv.querySelectorAll(selector).forEach(el => el.remove());
    });
    
    // Remove elements containing Wikimedia project links
    tempDiv.querySelectorAll('*').forEach(el => {
        const text = el.textContent.toLowerCase();
        // Check if element contains Wikimedia project references
        if ((text.includes('викивид') || text.includes('викисклад') || 
             text.includes('wikispecies') || text.includes('commons') ||
             text.includes('систематика') && text.includes('викивид') ||
             text.includes('изображения') && text.includes('викисклад')) &&
            el.children.length < 3 && el.textContent.length < 100) {
            // Remove small elements that are likely sister project links
            el.remove();
        }
    });
    
    // Remove Wikipedia branding and references
    tempDiv.querySelectorAll('a').forEach(link => {
        const text = link.textContent.toLowerCase();
        if (text.includes('wikipedia') || text.includes('викип')) {
            link.textContent = link.textContent.replace(/wikipedia/gi, '').replace(/викип[а-я]*/gi, '');
        }
    });
    
    // Remove text nodes containing Wikipedia and Wikimedia project references
    const walker = document.createTreeWalker(tempDiv, NodeFilter.SHOW_TEXT);
    const nodesToModify = [];
    const nodesToRemove = [];
    while (walker.nextNode()) {
        const node = walker.currentNode;
        const text = node.textContent.toLowerCase();
        
        // If node contains only Wikimedia project references, remove parent element
        if ((text.includes('викивид') || text.includes('викисклад') || 
             text.includes('wikispecies') || text.includes('wikimedia commons') ||
             text.includes('систематика') || text.includes('изображения')) &&
            node.textContent.trim().length < 50) {
            nodesToRemove.push(node.parentElement);
        }
        // Otherwise just clean Wikipedia mentions
        else if (node.textContent.match(/википед[а-я]*/gi) || node.textContent.match(/wikipedia/gi)) {
            nodesToModify.push(node);
        }
    }
    
    nodesToRemove.forEach(el => {
        if (el && el.parentElement) {
            el.remove();
        }
    });
    
    nodesToModify.forEach(node => {
        node.textContent = node.textContent
            .replace(/википед[а-я]*/gi, '')
            .replace(/wikipedia/gi, '')
            .replace(/викивид[а-я]*/gi, '')
            .replace(/викисклад[а-я]*/gi, '');
    });
    
    // Fix image URLs and attributes
    tempDiv.querySelectorAll('img').forEach(img => {
        // Fix protocol-relative URLs
        const src = img.getAttribute('src');
        if (src && src.startsWith('//')) {
            img.setAttribute('src', 'https:' + src);
        }
        
        // Also check srcset attribute
        const srcset = img.getAttribute('srcset');
        if (srcset && srcset.includes('//')) {
            img.setAttribute('srcset', srcset.replace(/\/\//g, 'https://'));
        }
        
        // Add loading lazy for better performance
        img.setAttribute('loading', 'lazy');
        
        // Ensure images have alt text
        if (!img.getAttribute('alt')) {
            img.setAttribute('alt', 'Изображение');
        } else {
            // Remove Wikipedia from alt text
            const alt = img.getAttribute('alt');
            img.setAttribute('alt', alt.replace(/wikipedia/gi, '').replace(/википед[а-я]*/gi, ''));
        }
    });
    
    // Fix links to be relative
    tempDiv.querySelectorAll('a').forEach(link => {
        const href = link.getAttribute('href');
        
        // Skip empty or javascript links
        if (!href || href.startsWith('javascript:')) {
            return;
        }
        
        // Keep anchor links (footnotes, references) as is
        if (href.startsWith('#')) {
            // These are internal page anchors - keep them
            return;
        }
        
        // Wikipedia article links
        if (href.startsWith('/wiki/')) {
            const articleTitle = href.replace('/wiki/', '');
            // Skip special pages
            if (articleTitle.startsWith('Special:') || 
                articleTitle.startsWith('File:') || 
                articleTitle.startsWith('Wikipedia:') ||
                articleTitle.startsWith('Help:') ||
                articleTitle.startsWith('Category:')) {
                link.removeAttribute('href');
                link.style.cursor = 'default';
                link.style.color = '#888';
                return;
            }
            link.setAttribute('data-wiki-link', articleTitle);
            link.setAttribute('data-lang', lang);
            link.removeAttribute('href'); // Remove href to prevent navigation
            link.classList.add('wiki-internal-link');
        } 
        // External links
        else if (href.startsWith('http://') || href.startsWith('https://')) {
            // Remove links to Wikimedia projects
            if (href.includes('wikispecies.org') || 
                href.includes('commons.wikimedia.org') ||
                href.includes('wikimedia.org') ||
                href.includes('wiktionary.org') ||
                href.includes('wikiquote.org') ||
                href.includes('wikibooks.org') ||
                href.includes('wikisource.org') ||
                href.includes('wikinews.org') ||
                href.includes('wikiversity.org') ||
                href.includes('wikivoyage.org')) {
                // Remove the entire parent element if it's a small container
                if (link.parentElement && link.parentElement.textContent.trim().length < 100) {
                    link.parentElement.remove();
                } else {
                    link.remove();
                }
                return;
            }
            link.setAttribute('target', '_blank');
            link.setAttribute('rel', 'noopener noreferrer');
        }
        // Other relative links - ignore them
        else {
            link.removeAttribute('href');
            link.style.cursor = 'default';
            link.style.color = '#888';
        }
    });
    
    return tempDiv.innerHTML;
}

// Setup internal link navigation
function setupInternalLinks(defaultLang) {
    // Handle wiki internal links
    articleContent.querySelectorAll('a.wiki-internal-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const rawTitle = link.dataset.wikiLink;
            // Decode URI components properly
            const title = decodeURIComponent(rawTitle.replace(/_/g, ' '));
            const lang = link.dataset.lang || defaultLang;
            
            // Load the article
            loadArticle(title, lang);
        });
    });
}

// Show search section
function showSearchSection() {
    articleSection.style.display = 'none';
    searchSection.style.display = 'flex';
    searchInput.value = '';
    searchInput.focus();
    
    // Allow zooming on search page
    updateViewportForSearch();
}

// Show article section
function showArticleSection() {
    searchSection.style.display = 'none';
    articleSection.style.display = 'block';
    
    // Prevent zooming on article pages
    updateViewportForArticle();
}

// Update viewport meta tag for search page (allow zooming)
function updateViewportForSearch() {
    const viewport = document.getElementById('viewport');
    if (viewport) {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=5.0');
    }
}

// Update viewport meta tag for article page (prevent zooming)
function updateViewportForArticle() {
    const viewport = document.getElementById('viewport');
    if (viewport) {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
    }
}

// Handle browser back button
window.addEventListener('popstate', () => {
    showSearchSection();
});

// Enter key to search first result
searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        const firstSuggestion = document.querySelector('.suggestion-item');
        if (firstSuggestion) {
            firstSuggestion.click();
        }
    }
});

// Image Modal functionality
const imageModal = document.getElementById('imageModal');
const imageModalImg = document.getElementById('imageModalImg');
const imageModalClose = document.getElementById('imageModalClose');

function setupImageModal() {
    // Add click handlers to all images in article
    articleContent.querySelectorAll('img').forEach(img => {
        img.style.cursor = 'pointer';
        img.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            openImageModal(img.src, img.alt);
        });
    });
}

function openImageModal(src, alt) {
    imageModalImg.src = src;
    imageModalImg.alt = alt || 'Изображение';
    imageModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeImageModal() {
    imageModal.classList.remove('active');
    document.body.style.overflow = '';
    // Clear image after animation
    setTimeout(() => {
        imageModalImg.src = '';
    }, 300);
}

// Close modal on button click
imageModalClose.addEventListener('click', closeImageModal);

// Close modal on overlay click
imageModal.addEventListener('click', (e) => {
    if (e.target === imageModal || e.target.classList.contains('image-modal-overlay')) {
        closeImageModal();
    }
});

// Close modal on Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && imageModal.classList.contains('active')) {
        closeImageModal();
    }
});
