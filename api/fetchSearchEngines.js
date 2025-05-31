// Top Search Engines
// https://ot-api.forextime.com/api/top_lists/top_search_engines.jsp?period=3d

const SEARCH_ENGINES = "https://ot-api.forextime.com/api/top_lists/top_search_engines.jsp?per1iod=3d"

export default function fetchSearchEngines() {
    fetch(SEARCH_ENGINES)
        .then(response => response.json())
        .then(data => {
            console.log(data);
            const filteredSearchEngines 
                = data['resultsList'] 
                    && Array.isArray(data['resultsList']) 
                    ? data['resultsList']
                        .filter(engine => engine['search engine'] && engine['search engine'].trim() !== '')
                        .map(engine => ({
                        'search engine': engine['search engine']
                        })) 
                    : [];
            console.log(filteredSearchEngines);
        })
        .catch(error => {
            console.log(error);
        })
}