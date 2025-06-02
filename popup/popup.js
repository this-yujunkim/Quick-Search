// 1. DOM Elements & Constants
const searchTermElement = document.getElementById("searchTerms");
const searchEngineElement = document.getElementById("searchEngine");
const selectTrigger = document.getElementById("selectTrigger");
const selectOptions = document.getElementById("selectOptions");
const favoriteEngines = document.getElementById('favoriteEngines');
const allEngines = document.getElementById('allEngines');

// Settings
const settingsField = document.getElementById("settingsField");
const saveDefaultSearchEngineSwitch = document.getElementById("saveDefaultSearchEngineSwitch");
const saveSearchTermsSwitch = document.getElementById("saveSearchTermsSwitch");
const alwaysOpenInNewWindowSwitch = document.getElementById("alwaysOpenInNewWindowSwitch");

// Buttons
const searchButton = document.getElementById("searchButton");
const newWindowButton = document.getElementById("newWindowButton");
const settingsButton = document.getElementById("settings");
const resetSearchTermsButton = document.getElementById("resetSearchTermsButton");
const favoritesSection = document.getElementById('favoritesSection');

// 2. Utility Functions
/**
 * Load favorites
 * @returns {string[]} The favorites
 */
const loadFavorites = async () => {
    const result = await chrome.storage.local.get('favoriteEngines');
    return result.favoriteEngines || [];
};

/**
 * Save favorites
 * @param {string[]} favorites - The favorites to save
 */
const saveFavorites = async (favorites) => {
    await chrome.storage.local.set({ favoriteEngines: favorites });
};

/**
 * Create search URL function
 * @param {string} searchEngine - The search engine to use
 * @param {string} searchTerm - The search term to use
 * @returns {string} The search URL
 */
const createSearchUrl = (searchEngine, searchTerm) => {
    const searchPatterns = {
        google: `https://www.google.com/search?q=${encodeURIComponent(searchTerm)}`,
        bing: `https://www.bing.com/search?q=${encodeURIComponent(searchTerm)}`,
        yahoo: `https://search.yahoo.com/search?p=${encodeURIComponent(searchTerm)}`,
        baidu: `https://www.baidu.com/s?wd=${encodeURIComponent(searchTerm)}`,
        yandex: `https://yandex.com/search/?text=${encodeURIComponent(searchTerm)}`,
        duckduckgo: `https://duckduckgo.com/?q=${encodeURIComponent(searchTerm)}`,
        ask: `https://www.ask.com/web?q=${encodeURIComponent(searchTerm)}`,
        ecosia: `https://www.ecosia.org/search?q=${encodeURIComponent(searchTerm)}`,
        wikipedia: `https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(searchTerm)}`,
        youtube: `https://www.youtube.com/results?search_query=${encodeURIComponent(searchTerm)}`,
        naver: `https://search.naver.com/search.naver?query=${encodeURIComponent(searchTerm)}`,
        daum: `https://search.daum.net/search?q=${encodeURIComponent(searchTerm)}`
    };

    return searchPatterns[searchEngine] || searchPatterns.google;
}

// 3. Feature Functions
/**
 * Toggle favorite status
 * @param {string} engine - The engine to toggle
 */
const toggleFavorite = async (engine) => {
    let favorites = await loadFavorites();
    const index = favorites.indexOf(engine);
    
    if (index === -1) {
        favorites.push(engine);
    } else {
        favorites.splice(index, 1);
    }
    
    await saveFavorites(favorites);
    await updateFavoriteEnginesDisplay();
};

/**
 * Perform search
 * @param {boolean} inNewWindow - Whether to search in a new window
 */
const performSearch = (inNewWindow = false) => {
    const prefs = {     // Save preferences
        searchEngine: searchEngineElement.value,
        searchTerm: searchTermElement.value,
        alwaysOpenInNewWindow: alwaysOpenInNewWindowSwitch.checked
    };

    if (prefs.searchEngine && prefs.searchTerm) {
        const url = createSearchUrl(prefs.searchEngine, prefs.searchTerm);
        chrome.runtime.sendMessage({
            event: alwaysOpenInNewWindowSwitch.checked || inNewWindow ? 'onSearchInNewWindow' : 'onSearch',
            url: url,
            prefs: prefs
        });
    }
}

/**
 * Update favorite icons and sections
 */
const updateFavoriteEnginesDisplay = async () => {
    const favorites = await loadFavorites();
    
    // Update star icons
    document.querySelectorAll('.favorite-icon').forEach(icon => {
        const engine = icon.dataset.engine;
        if (favorites.includes(engine)) {
            icon.classList.remove('far');
            icon.classList.add('fas');
        } else {
            icon.classList.remove('fas');
            icon.classList.add('far');
        }
    });
    
    // Update favorites section
    favoritesSection.style.display = favorites.length > 0 ? 'block' : 'none';
    if (favorites.length > 0) {
        favoriteEngines.innerHTML = favorites.map(engine => {
            const originalOption = document.querySelector(`.select-option[data-value="${engine}"]`);
            if (!originalOption) return '';
            
            const iconElement = originalOption.querySelector('i, img');
            let iconHtml = '';
            
            if (iconElement.tagName.toLowerCase() === 'img') {
                iconHtml = `<img width="20" height="20" src="${iconElement.src}"/>`;
            } else {
                iconHtml = `<i class="${iconElement.className}"></i>`;
            }
            
            const text = originalOption.querySelector('span').textContent;
            
            return `
                <div class="select-option" data-value="${engine}">
                    <div class="option-content">
                        ${iconHtml}
                        <span>${text}</span>
                    </div>
                    <i class="fas fa-star favorite-icon" data-engine="${engine}"></i>
                </div>
            `;
        }).join('');

        document.querySelectorAll('#allEngines .select-option').forEach(option => {
            if (favorites.includes(option.dataset.value)) {
                option.style.display = 'none';
            } else {
                option.style.display = 'flex';
            }
        });
    }
    
    // Add click handlers to favorite icons
    document.querySelectorAll('.favorite-icon').forEach(icon => {
        icon.addEventListener('click', async (e) => {
            e.stopPropagation();
            await toggleFavorite(icon.dataset.engine);
        });
    });
    
    // Add click handlers to favorite options
    favoriteEngines.querySelectorAll('.select-option').forEach(option => {
        option.addEventListener('click', () => {
            const value = option.dataset.value;
            const originalOption = document.querySelector(`.select-option[data-value="${value}"]`);
            const iconElement = originalOption.querySelector('i, img');
            const textElement = originalOption.querySelector('span');
            
            // Update trigger content
            const triggerContent = selectTrigger.querySelector('.option-content');
            if (iconElement) {
                if (iconElement.tagName.toLowerCase() === 'img') {
                    triggerContent.innerHTML = `
                        <img width="20" height="20" src="${iconElement.src}"/>
                        <span>${textElement.textContent}</span>
                    `;
                } else {
                    triggerContent.innerHTML = `
                        <i class="${iconElement.className}"></i>
                        <span>${textElement.textContent}</span>
                    `;
                }
            }
            
            searchEngineElement.value = value;
            selectOptions.classList.remove('show');
            
            // Update selected state
            document.querySelectorAll('.select-option').forEach(opt => {
                opt.classList.remove('selected');
            });
            originalOption.classList.add('selected');
            
            // Save to storage
            chrome.storage.local.set({ searchEngine: value });
        });
    });
};

/**
 * Add a search engine
 * @param {string} engineName - The name of the engine
 * @param {string} searchURL - The URL of the engine
 */
const addSearchEngine = (engineName,searchURL) => {
    const option = document.createElement('div');
    option.classList.add('select-option');
    option.dataset.value = engineName;
    option.innerHTML = `<div class="option-content"><i class="fab fa-${engineName[0]} fa-lg"></i><span>${engineName}</span></div>`;
    selectOptions.appendChild(option);
}

// Reset select option
const initSelectOption = () => {
    selectTrigger.innerHTML = `
        <div class="option-content">
            <i class="fab fa-google fa-lg"></i>
            <span>Google</span>
        </div>
        <i class="fas fa-chevron-down"></i>
    `;
    
    document.querySelectorAll('.select-option').forEach(option => {
        option.classList.remove('selected');
    });
};

// 4. Event Handlers
// Initialize favorites
document.addEventListener('DOMContentLoaded', async () => {
    await updateFavoriteEnginesDisplay();
    searchTermElement.focus();
});

// Custom select box behavior
selectTrigger.addEventListener('click', () => {
    selectOptions.classList.toggle('show');
});

// Handle option selection
document.addEventListener('click', (e) => {
    const option = e.target.closest('.select-option');
    if (option && selectOptions.contains(option)) {
        const value = option.dataset.value;
        const iconElement = option.querySelector('i, img');
        const textElement = option.querySelector('span');
        
        // Update trigger content
        const triggerContent = selectTrigger.querySelector('.option-content');
        if (iconElement) {
            if (iconElement.tagName.toLowerCase() === 'img') {
                triggerContent.innerHTML = `
                    <img width="20" height="20" src="${iconElement.src}"/>
                    <span>${textElement.textContent}</span>
                `;
            } else {
                triggerContent.innerHTML = `
                    <i class="${iconElement.className}"></i>
                    <span>${textElement.textContent}</span>
                `;
            }
        }

        // Update hidden input
        searchEngineElement.value = value;
        
        // Update selected state
        document.querySelectorAll('.select-option').forEach(opt => {
            opt.classList.remove('selected');
        });
        option.classList.add('selected');
        
        // Close dropdown
        selectOptions.classList.remove('show');
        
        // Save to storage
        chrome.storage.local.set({ searchEngine: value });
    }
});

// Close options list when clicking outside
document.addEventListener('click', (e) => {
    if (!selectTrigger.contains(e.target) && !selectOptions.contains(e.target)) {
        selectOptions.classList.remove('show');
    }
});

// Add keyboard event listener
searchTermElement.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault(); // Prevent default form submission
        if (e.ctrlKey || e.metaKey) {
            // Ctrl/Cmd + Enter: Search in new window 
            performSearch(true);
        } else {
            // Just Enter: Search in current tab
            performSearch(false);
        }
    }
});

searchTermElement.addEventListener('mouseover', (e) => {
    searchTermElement.title = "Enter: Search in new tab, \nCtrl/Cmd + Enter: Search in new window";
});

// Perform search when search button is clicked
searchButton.addEventListener('click', () => {
    performSearch(false);
});

// Show hint when search button is hovered
searchButton.addEventListener('mouseover', () => {
    searchButton.title = "Search in new tab";
});

// Reset search terms when reset search terms button is clicked
resetSearchTermsButton.addEventListener('click', () => {
    chrome.storage.local.remove("searchTerm", () => {
        if (chrome.runtime.lastError) {
            console.error(chrome.runtime.lastError);
        }
    })
    searchTermElement.value = null;
});

// Show hint when reset search terms button is hovered
resetSearchTermsButton.addEventListener('mouseover', () => {
    resetSearchTermsButton.title = "Delete search terms";
});

// Open settings field when settings button is clicked
settingsButton.addEventListener('click', () => {
    if (settingsField.style.display === 'block') {
        settingsField.style.display = 'none';
    } else {
        settingsField.style.display = 'block';
    }
});

// Show hint when settings button is hovered
settingsButton.addEventListener('mouseover', () => {
    settingsButton.title = "Settings";
});

// save settings for saving default search engine when switch is toggled
saveDefaultSearchEngineSwitch.addEventListener('click', (e) => {
    const isChecked = e.target.checked;
    chrome.storage.local.set({ saveDefaultSearchEngine: isChecked }, () => {
        console.log("Default search engine preference saved:", isChecked);
        if (chrome.runtime.lastError) {
            console.error(chrome.runtime.lastError);
        }
    });
});

saveSearchTermsSwitch.addEventListener('click', (e) => {
    const isChecked = e.target.checked;
    chrome.storage.local.set({ saveSearchTerms: isChecked }, () => {
        console.log("Save search terms preference saved:", isChecked);
        if (chrome.runtime.lastError) {
            console.error(chrome.runtime.lastError);
        }
    });
});

alwaysOpenInNewWindowSwitch.addEventListener('click', (e) => {
    const isChecked = e.target.checked;
    chrome.storage.local.set({ alwaysOpenInNewWindow: isChecked }, () => {
        console.log("Always open in new window preference saved:", isChecked);
        if (chrome.runtime.lastError) {
            console.error(chrome.runtime.lastError);
        }
    });
});

// 5. Initialization
chrome.storage.local.get(["saveDefaultSearchEngine", "saveSearchTerms", "alwaysOpenInNewWindow", "searchEngine", "searchTerm"], (result) => {
    const {saveDefaultSearchEngine, saveSearchTerms, alwaysOpenInNewWindow, searchEngine, searchTerm} = result;

    if (saveDefaultSearchEngine) {
        saveDefaultSearchEngineSwitch.checked = saveDefaultSearchEngine;
    }
    else {
        saveDefaultSearchEngineSwitch.checked = false;
    }

    if (saveSearchTerms) {
        saveSearchTermsSwitch.checked = saveSearchTerms;
    }
    else {
        saveSearchTermsSwitch.checked = false;
    }

    if (alwaysOpenInNewWindow) {
        alwaysOpenInNewWindowSwitch.checked = alwaysOpenInNewWindow;
    } 
    else {
        alwaysOpenInNewWindowSwitch.checked = false;
    }

    if (searchEngine && saveDefaultSearchEngine) {
        // Update hidden input
        searchEngineElement.value = searchEngine;
        
        // Update trigger display
        const selectedOption = document.querySelector(`.select-option[data-value="${searchEngine}"]`);
        if (selectedOption) {
            const iconElement = selectedOption.querySelector('i, img');
            const textElement = selectedOption.querySelector('span');

            if (!selectTrigger.querySelector('.option-content')) {
                selectTrigger.innerHTML = '<div class="option-content"></div>';
            }
            const triggerContent = selectTrigger.querySelector('.option-content');
            
            if (iconElement) {
                if (iconElement.tagName.toLowerCase() === 'img') {
                    triggerContent.innerHTML = `
                        <img width="20" height="20" src="${iconElement.src}"/>
                        <span>${textElement.textContent}</span>
                    `;
                } else {
                    triggerContent.innerHTML = `
                        <i class="${iconElement.className}"></i>
                        <span>${textElement.textContent}</span>
                    `;
                }
            }
            selectedOption.classList.add('selected');
        }
    }
    else {
        // Reset select option
        initSelectOption();
    }   

    if (searchTerm && saveSearchTermsSwitch.checked) {
        searchTermElement.value = searchTerm;
    }
});