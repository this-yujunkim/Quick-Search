/**
 * @param {string} url - URL to open
 * Opens URL in a new window
 */
const openInNewWindow = (url) => {
    chrome.windows.create({
        url: url,
        type: 'normal',
        focused: true
    });
}

/**
 * @param {string} url
 * Opens URL in the current window
 */
const openInCurrentWindow = (url) => {
    chrome.tabs.create({
        url: url,
        active: true
    });
}

chrome.runtime.onMessage.addListener((data, sender, sendResponse) => {
    const { event, prefs, url } = data
    switch (event) {
        case 'onSearch':
            if (url) {
                handleOnSearch(url, prefs);
            }
            break;
        case 'onSearchInNewWindow':
            if (url) {
                handleOnSearchInNewWindow(url, prefs);
            }
            break;
        default:
            break;
    }
})

/**
 * @param {string} url
 * @param {*} prefs
 * Event handler for "onSearch"
 */
const handleOnSearch = (url, prefs) => {
    openInCurrentWindow(url);
    console.log("On search in background");
    console.log("url received", url);
    console.log("prefs received", prefs);
    chrome.storage.local.set(prefs); // Save preferences to local storage
}

/**
 * @param {string} url
 * @param {*} prefs
 * event handler on "onSearchInNewWindow"
 */
const handleOnSearchInNewWindow = (url, prefs) => {
    openInNewWindow(url);
    console.log("On search in new window in background");
    console.log("url received", url);
    console.log("prefs received", prefs);
    chrome.storage.local.set(prefs); // saves "prefs" in local
}