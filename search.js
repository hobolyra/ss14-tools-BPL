// Requires fuse.js imported.


function renderReactants(reactants) {
    const pluralizeUnits = (amount) => amount > 1 ? 'units' : 'unit'
    const ul = document.createElement('ul')

    reactants.forEach(r => {
        const li = document.createElement('li')
        li.textContent = `${r.id}: ${r.amount} ${pluralizeUnits(r.amount)}`
        ul.appendChild(li)
    });

    return ul
}

function renderSearchResults(results, renderOptions) {
    // Display the results
    const resultsContainer = document.getElementById('results')
    resultsContainer.innerHTML = ''

    results.forEach(result => {
        const item = result.item
        const div = document.createElement('div')
        div.className = 'result-item'

        const titleContainer = document.createElement('div')
        titleContainer.className = 'result-item-title-container'
        const title = document.createElement('h3')
        title.textContent = item.id

        titleContainer.appendChild(title)

        if (item.requiredMixerCategories) {
            const requiredMixerCategories = document.createElement('div')
            requiredMixerCategories.textContent = item.requiredMixerCategories.join("")
            requiredMixerCategories.className = 'result-item-mixer'
            titleContainer.appendChild(requiredMixerCategories)
        }

        const reactants = renderReactants(item.reactants)
        div.appendChild(titleContainer)
        div.appendChild(reactants)

        if (renderOptions.includeOutputProduct) {
            const productOutputString = item.products.map(product => `${product.amount} ${product.id}`).join(" ")
            const product = document.createElement("div")
            product.className = 'result-item-product'
            product.textContent = `Output: ${productOutputString}`
            div.appendChild(product);
        }
        resultsContainer.appendChild(div)
    });

    if (results.length === 0) {
        resultsContainer.innerHTML = '<strong>No results found for search</strong>';
    }

}

function runSearch(fuse, data, renderOptions, searchText) {
    // Data is in CamelCase so spaces are harmful for searching right now.
    const cleanedSearchText = searchText.replace(/\s/g, "");
    const searchResults = fuse.search(cleanedSearchText)
    // Fuse will not show entire list if nothing searched :(
    // https://github.com/krisk/Fuse/issues/229
    const results = cleanedSearchText.length > 0
        ? searchResults
        : data.map(item => ({item: item}))
    renderSearchResults(results, renderOptions)
}

function render(data, renderOptions) {
    // Fuse.js options
    const options = {
        keys: ['id', 'reactants.id', 'products.id'],
        threshold: 0.1,
    };


    const fuse = new Fuse(data, options)
    const searchInput = document.getElementById('search-input');

    runSearch(fuse, data, renderOptions || {}, searchInput.value)

    searchInput.addEventListener('input', function (e) {
        runSearch(fuse, data, renderOptions || {}, e.target.value)
    });

}
