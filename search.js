// Requires fuse.js imported.


function getProductIfDiffToId(item) {
    const products = item.products
    if (products == null || !Array.isArray(products) || products.length === 0) {
        return null
    }
    const productId = products[0].id
    return productId !== item.id ? productId : null;
}

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

function renderSearchResults(results) {
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

        const productId = getProductIfDiffToId(item);
        if (productId) {
            const product = document.createElement("div")
            product.className = 'result-item-product'
            product.textContent = `Produces ${productId}`
            div.appendChild(product);
        }
        resultsContainer.appendChild(div)
    });

    if (results.length === 0) {
        resultsContainer.innerHTML = '<strong>No results found for search</strong>';
    }

}

function runSearch(fuse, json, searchText) {
    const searchResults = fuse.search(searchText)
    // Fuse will not show entire list if nothing searched :(
    // https://github.com/krisk/Fuse/issues/229
    console.log(searchText)
    const results = searchText.length > 0
        ? searchResults
        : json.map(item => ({item: item}))
    renderSearchResults(results)
}

function render(json) {
    // Fuse.js options
    const options = {
        keys: ['id', 'reactants.id', 'products.id'],
        threshold: 0.1,
    };


    const fuse = new Fuse(json, options)
    const searchInput = document.getElementById('search-input');

    runSearch(fuse, json, searchInput.value)

    searchInput.addEventListener('input', function (e) {
        runSearch(fuse, json, e.target.value)
    });

}
