// Pagination state variables (must be declared before any function uses them)
let inventoryPage = 1;
let inventoryPageSize = 10;
let historyPage = 1;
let historyPageSize = 10;

let products = [];
let inventoryItems = [];
let locations = [];
let transactions = [];
let users = [];
let currentLocation = '';
let currentUser = 'User 1';
let currentUserId = '';
let currentTheme = localStorage.getItem('theme') || 'light';
let locationFilter = null; // null = all, or location id

// Track last export time and unsaved change count (since last export)
let lastExportISO = localStorage.getItem('lastExportISO') || null;
let unsavedChangeCount = 0;

function updateSaveToFileButton() {
    const btn = document.getElementById('saveToFileButton');
    if (!btn) return;
    // Localized label with placeholder
    const label = (typeof t === 'function' ? t('save_to_file') : 'Save to file ({count} changes)')
        .replace('{count}', String(unsavedChangeCount));
    btn.textContent = label;
    // Localized tooltip
    const tipKey = lastExportISO ? 'last_export' : 'never_exported';
    const tipRaw = typeof t === 'function' ? t(tipKey) : (lastExportISO ? 'Last export: {date}' : 'Never exported');
    btn.title = lastExportISO ? tipRaw.replace('{date}', formatDate(lastExportISO)) : tipRaw;
}

function recalcUnsavedChangeCount() {
    try {
        if (!lastExportISO || !Array.isArray(transactions)) {
            unsavedChangeCount = 0;
        } else {
            const lastTs = new Date(lastExportISO).getTime();
            unsavedChangeCount = transactions.filter(tx => {
                const ts = tx && tx.timestamp ? new Date(tx.timestamp).getTime() : 0;
                return ts > lastTs;
            }).length;
        }
    } catch (_) {
        unsavedChangeCount = 0;
    }
    updateSaveToFileButton();
}

async function handleSaveToFileClick() {
    try {
        if (typeof exportData === 'function') {
            await exportData();
        }
        lastExportISO = new Date().toISOString();
        localStorage.setItem('lastExportISO', lastExportISO);
        unsavedChangeCount = 0;
        updateSaveToFileButton();
        if (typeof showToast === 'function') {
            const msg = typeof t === 'function' ? t('export_success') : 'Exported to file successfully';
            showToast(msg, 'success');
        }
    } catch (error) {
        console.error('Error exporting to file:', error);
        alert('Error exporting to file: ' + (error && error.message ? error.message : error));
    }
}

// Expose a helper for other modules (e.g., floorplan) to mark changes
window.incrementUnsavedChanges = function (n = 1) {
    try {
        const delta = typeof n === 'number' && isFinite(n) ? n : 1;
        unsavedChangeCount += delta;
    } catch (_) {
        unsavedChangeCount += 1;
    }
    updateSaveToFileButton();
}

// Set up theme on initial load
function applyTheme() {
    if (currentTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        // Update both checkboxes if they exist
        const mainCheckbox = document.getElementById('themeCheckbox');
        const settingsCheckbox = document.getElementById('settingsThemeCheckbox');

        if (mainCheckbox) mainCheckbox.checked = true;
        if (settingsCheckbox) settingsCheckbox.checked = true;

        document.querySelector('.theme-toggle-label').textContent = '☀️';
    } else {
        document.documentElement.setAttribute('data-theme', 'light');
        // Update both checkboxes if they exist
        const mainCheckbox = document.getElementById('themeCheckbox');
        const settingsCheckbox = document.getElementById('settingsThemeCheckbox');

        if (mainCheckbox) mainCheckbox.checked = false;
        if (settingsCheckbox) settingsCheckbox.checked = false;

        document.querySelector('.theme-toggle-label').textContent = '🌙';
    }
}

// Apply theme immediately
applyTheme();

// Toggle between light and dark mode
function toggleTheme() {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme', currentTheme);
    applyTheme();
}

const loadData = async () => {
    try {
        products = await loadFromIndexedDB('products') || [];
        locations = await loadFromIndexedDB('locations') || [];
        inventoryItems = await loadFromIndexedDB('inventory') || [];
        transactions = await loadFromIndexedDB('transactions') || [];

        // Try to load users, handle errors gracefully
        try {
            users = await loadFromIndexedDB('users') || [];
            console.log('Loaded users:', users);
        } catch (error) {
            console.error('Error loading users:', error);
            users = [];
        }

        // Set default location if empty
        if (locations.length === 0) {
            locations = [{ id: '1', name: 'Location 1' }];
            await saveToIndexedDB('locations', locations);
        }

        // Set default users if empty
        if (users.length === 0) {
            users = [
                { id: 'user-1', name: 'User 1' },
                { id: 'user-2', name: 'User 2' }
            ];
            try {
                await saveToIndexedDB('users', users);
                console.log('Created default users:', users);
            } catch (error) {
                console.error('Error saving default users:', error);
                // We'll continue with in-memory users even if saving fails
            }
        }

        // Set current user
        if (users.length > 0) {
            currentUser = users[0].name;
            currentUserId = users[0].id;
        }

        // Add example product if no products exist
        if (products.length === 0) {
            // Create example product
            const exampleProduct = {
                id: 'example-1',
                name: 'Example Product',
                price: 9.99,
                comments: 'This is an example product to help you get started.',
                barcode: '1234567890', // Example barcode
            };
            products.push(exampleProduct);

            // Add to inventory at default location
            const exampleInventory = {
                id: 'inv-example-1',
                productId: exampleProduct.id,
                locationId: locations[0].id,
                quantity: 5
            };
            inventoryItems.push(exampleInventory);

            // Create initial transaction
            const initialTransaction = {
                type: 'add_inventory',
                productId: exampleProduct.id,
                productName: exampleProduct.name,
                locationId: locations[0].id,
                quantity: 5,
                timestamp: new Date().toISOString()
            };
            transactions.push(initialTransaction);

            // Save the example data
            await saveToIndexedDB('products', products);
            await saveToIndexedDB('inventory', inventoryItems);
            await saveToIndexedDB('transactions', transactions);

            console.log('Added example product to database');
        }

        // Set current location
        currentLocation = locations[0]?.id || '1';
        locationFilter = locations[0]?.id || '1';

        console.log('Data loaded:', {
            products: products.length,
            locations: locations.length,
            inventory: inventoryItems.length,
            transactions: transactions.length
        });
    } catch (error) {
        console.error('Error loading data:', error);
        // Set defaults
        products = [];
        locations = [{ id: '1', name: 'Location 1' }];
        inventoryItems = [];
        transactions = [];
        currentLocation = '1';
        locationFilter = '1';
    }
};

// Initialize database and load data
const initializeData = async () => {
    try {
        await initDB();
        console.log('IndexedDB initialized');
        await loadData();

        // Initialize users dropdown
        await loadUsers();

        // Update UI
        updateLocationSelect();
        updateTable();
        updateHistory();
        // Initialize unsaved change counter based on last export time
        recalcUnsavedChangeCount();
    } catch (error) {
        console.error('Error initializing database:', error);
        alert('Error loading data. Using default values.');

        // Fallback to empty data
        products = [];
        locations = [{ id: '1', name: 'Location 1' }];
        inventoryItems = [];
        transactions = [];
        currentLocation = '1';
        locationFilter = '1';

        // Update UI with default data
        updateLocationSelect();
        updateTable();
        updateHistory();
        recalcUnsavedChangeCount();
    }
};


async function save() {
    try {
        console.log('Saving data to IndexedDB:', {
            products: products.length,
            locations: locations.length,
            inventory: inventoryItems.length,
            transactions: transactions.length
        });

        // Save one store at a time to better isolate errors
        try {
            await saveToIndexedDB('products', products);
            console.log('Products saved successfully');
        } catch (error) {
            console.error('Error saving products:', error);
            alert(`Error saving products data: ${error.message || 'Unknown error'}`);
            throw error;
        }

        try {
            await saveToIndexedDB('locations', locations);
            console.log('Locations saved successfully');
        } catch (error) {
            console.error('Error saving locations:', error);
            alert(`Error saving locations data: ${error.message || 'Unknown error'}`);
            throw error;
        }

        try {
            await saveToIndexedDB('inventory', inventoryItems);
            console.log('Inventory saved successfully');
        } catch (error) {
            console.error('Error saving inventory:', error);
            alert(`Error saving inventory data: ${error.message || 'Unknown error'}`);
            throw error;
        }

        try {
            await saveToIndexedDB('transactions', transactions);
            console.log('Transactions saved successfully');
        } catch (error) {
            console.error('Error saving transactions:', error);
            alert(`Error saving transactions data: ${error.message || 'Unknown error'}`);
            throw error;
        }

        console.log('All data saved successfully');
    } catch (error) {
        console.error('Error in saveToLocalStorage:', error);
        alert('Error saving data. Please check console for details.');
    }
}

function updateLocationSelect() {
    // If no location is selected, select the first one
    if (!currentLocation && locations.length > 0) {
        currentLocation = locations[0].id;
    }
    // If no location filter is set, set it to current location
    if (!locationFilter && locations.length > 0) {
        locationFilter = currentLocation || locations[0].id;
    }
    renderLocationFilterButtons();
}

async function addItem() {
    const nameInput = document.getElementById('itemName').value.trim();
    const quantityInput = document.getElementById('itemQuantity').value;
    let price = parseFloat(document.getElementById('itemPrice').value);
    const locationId = locationFilter || currentLocation;

    // Regex to match codes like 4b1123, 4B1123, 4B 1123, 10 B 1 23, 99 b 01 26 etc.
    const codeRegex = /([0-9]+)\s*[bB]\s*([01]?[0-9])\s*([23][0-9])/g;
    let match;
    let codes = [];
    let nameBase = nameInput;
    // Find all codes and remove them from the name
    nameBase = nameBase.replace(codeRegex, '').trim();
    codeRegex.lastIndex = 0;
    while ((match = codeRegex.exec(nameInput)) !== null) {
        codes.push({
            quantity: parseInt(match[1]),
            month: match[2].padStart(2, '0'),
            year: match[3],
        });
    }

    if (codes.length > 0) {
        // If price is empty or invalid, set to 0
        if (isNaN(price)) price = 0;
        // Add a product for each code
        for (const code of codes) {
            const prodName = `${code.year}-${code.month} ${nameBase}`;
            const quantity = code.quantity;
            if (!prodName || isNaN(quantity) || quantity < 0 || price < 0) {
                alert(t('Please fill all fields with valid values'));
                continue;
            }
            let product = products.find(p => p.name.toLowerCase() === prodName.toLowerCase());
            if (!product) {
                product = {
                    id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
                    name: prodName,
                    price,
                    comments: '',
                    barcode: '',
                };
                products.push(product);
            }
            let inventoryEntry = inventoryItems.find(item =>
                item.productId === product.id && item.locationId === locationId
            );
            if (inventoryEntry) {
                const oldQuantity = inventoryEntry.quantity;
                inventoryEntry.quantity += quantity;
                await addToHistory({
                    type: 'update_quantity',
                    productId: product.id,
                    productName: product.name,
                    locationId: locationId,
                    oldQuantity,
                    newQuantity: inventoryEntry.quantity,
                    timestamp: new Date().toISOString()
                });
            } else {
                inventoryEntry = {
                    id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
                    productId: product.id,
                    locationId: locationId,
                    quantity
                };
                inventoryItems.push(inventoryEntry);
                await addToHistory({
                    type: 'add_inventory',
                    productId: product.id,
                    productName: product.name,
                    locationId: locationId,
                    quantity,
                    timestamp: new Date().toISOString()
                });
            }
        }
        await save();
        updateTable();
        clearForm();
        return;
    }

    // Fallback to default logic if no codes found
    const name = nameInput;
    // Enforce YY-MM at start (e.g., 25-10, 24-01) - month must be 01-12
    if (!/^\d{2}-(0[1-9]|1[0-2])/.test(name)) {
        alert(t('error_name_prefix'));
        return;
    }
    const quantity = parseInt(quantityInput);
    if (!name || isNaN(quantity) || isNaN(price) || quantity < 0 || price < 0) {
        alert(t('Please fill all fields with valid values'));
        return;
    }
    let product = products.find(p => p.name.toLowerCase() === name.toLowerCase());
    if (!product) {
        product = {
            id: Date.now().toString(),
            name,
            price,
            comments: '',
            barcode: '',
        };
        products.push(product);
    }
    let inventoryEntry = inventoryItems.find(item =>
        item.productId === product.id && item.locationId === locationId
    );
    if (inventoryEntry) {
        const oldQuantity = inventoryEntry.quantity;
        inventoryEntry.quantity += quantity;
        await addToHistory({
            type: 'update_quantity',
            productId: product.id,
            productName: product.name,
            locationId: locationId,
            oldQuantity,
            newQuantity: inventoryEntry.quantity,
            timestamp: new Date().toISOString()
        });
    } else {
        inventoryEntry = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
            productId: product.id,
            locationId: locationId,
            quantity
        };
        inventoryItems.push(inventoryEntry);
        await addToHistory({
            type: 'add_inventory',
            productId: product.id,
            productName: product.name,
            locationId: locationId,
            quantity,
            timestamp: new Date().toISOString()
        });
    }
    await save();
    updateTable();
    clearForm();
}

async function deleteItem(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    if (confirm(`Are you sure you want to delete "${product.name}" from all locations?`)) {
        // Get all inventory entries for this product
        const affectedEntries = inventoryItems.filter(item => item.productId === productId);

        // Record each deletion in history
        for (const entry of affectedEntries) {
            const locationName = locations.find(loc => loc.id === entry.locationId)?.name || 'Unknown';

            await addToHistory({
                type: 'delete_inventory',
                productId,
                productName: product.name,
                locationId: entry.locationId,
                locationName,
                quantity: entry.quantity,
                timestamp: new Date().toISOString()
            });
        }

        // Remove all inventory entries for this product
        inventoryItems = inventoryItems.filter(item => item.productId !== productId);

        // Remove the product completely
        products = products.filter(p => p.id !== productId);

        await addToHistory({
            type: 'delete_product',
            productId,
            productName: product.name,
            timestamp: new Date().toISOString()
        });

        await save();
        updateTable();
    }
}

async function editField(productId, field, element) {
    // Prevent re-entering edit mode if already editing
    if (element.querySelector('input')) {
        // Already editing, do nothing
        return;
    }
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const currentValue = element.textContent;
    // Measure current rendered width before replacing content
    const originalRect = element.getBoundingClientRect();
    const originalWidthPx = Math.ceil(originalRect.width);
    const input = document.createElement('input');
    input.type = field === 'price' ? 'number' : field === 'quantity' ? 'number' : 'text';
    input.step = field === 'price' ? '0.01' : '1';
    input.min = field === 'quantity' || field === 'price' ? '0' : '';
    input.value = currentValue;
    input.className = 'editable editing';
    // If editing the product name, size input to match the current text width
    if (field === 'name') {
        const computedStyle = window.getComputedStyle(element);
        // Match font so the width visually aligns
        input.style.font = computedStyle.font;
        input.style.letterSpacing = computedStyle.letterSpacing;
        input.style.lineHeight = computedStyle.lineHeight;
        input.style.boxSizing = 'content-box';
    }

    element.textContent = '';
    element.appendChild(input);
    if (field === 'name') {
        const paddingBuffer = 6; // small buffer so caret isn't flush to the edge
        const targetWidth = Math.max(20, originalWidthPx + paddingBuffer);
        input.style.width = `${targetWidth}px`;
    }
    input.focus();

    // Ensure the save handler runs only once (prevents double alerts on Enter + blur)
    let hasSaved = false;

    async function saveEdit() {
        if (hasSaved) return;
        hasSaved = true;
        const newValue = input.value;
        if (newValue === currentValue) {
            element.textContent = currentValue;
            return;
        }

        if (field === 'price') {
            const newPrice = parseFloat(newValue);
            if (!isNaN(newPrice) && newPrice >= 0) {
                const oldPrice = product.price;
                product.price = newPrice;

                await addToHistory({
                    type: 'edit_product',
                    productId: product.id,
                    productName: product.name,
                    field: 'price',
                    oldValue: oldPrice,
                    newValue: newPrice,
                    timestamp: new Date().toISOString()
                });

                await save();
                updateTable();
            } else {
                element.textContent = currentValue;
                return;
            }
        } else if (field === 'name') {
            const newName = newValue.trim();
            // Enforce YY-MM at start (e.g., 25-10, 24-01)
            if (!/^\d{2}-\d{2}/.test(newName)) {
                alert(t('error_name_prefix'));
                element.textContent = currentValue;
                return;
            }
            if (newName) {
                const oldName = product.name;
                product.name = newName;

                await addToHistory({
                    type: 'edit_product',
                    productId: product.id,
                    productName: newName,
                    field: 'name',
                    oldValue: oldName,
                    newValue: newName,
                    locationId: currentLocation,
                    timestamp: new Date().toISOString()
                });

                await save();
                updateTable();
            } else {
                element.textContent = currentValue;
                return;
            }
        } else if (field === 'quantity') {
            const newQuantity = parseInt(newValue);
            if (!isNaN(newQuantity) && newQuantity >= 0) {
                // Find inventory entry for this product and location
                let inventoryEntry = inventoryItems.find(item =>
                    item.productId === productId && item.locationId === currentLocation
                );

                if (inventoryEntry) {
                    const oldQuantity = inventoryEntry.quantity;
                    inventoryEntry.quantity = newQuantity;

                    await addToHistory({
                        type: 'update_quantity',
                        productId: product.id,
                        productName: product.name,
                        locationId: currentLocation,
                        oldQuantity,
                        newQuantity,
                        timestamp: new Date().toISOString()
                    });
                } else if (newQuantity > 0) {
                    // Create new inventory entry
                    inventoryEntry = {
                        id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
                        productId: product.id,
                        locationId: currentLocation,
                        quantity: newQuantity
                    };

                    inventoryItems.push(inventoryEntry);

                    await addToHistory({
                        type: 'add_inventory',
                        productId: product.id,
                        productName: product.name,
                        locationId: currentLocation,
                        quantity: newQuantity,
                        timestamp: new Date().toISOString()
                    });
                }

                await save();
                updateTable();
            } else {
                element.textContent = currentValue;
                return;
            }
        }
    }

    input.addEventListener('blur', saveEdit);
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            saveEdit();
            input.blur();
        }
    });
}

function toggleDetails(event, id) {
    const details = document.getElementById(`details-${id}`);
    const button = event.target;
    // Find the corresponding details row (next sibling of the item row)
    const itemRow = button.closest('tr');
    const detailsRow = itemRow ? itemRow.nextElementSibling : null;
    if (details.classList.contains('show')) {
        details.classList.remove('show');
        if (detailsRow) detailsRow.classList.remove('visible');
        button.textContent = '▼';
    } else {
        details.classList.add('show');
        if (detailsRow) detailsRow.classList.add('visible');
        button.textContent = '▲';
    }
}

async function updateComments(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const newComments = document.getElementById(`comments-${productId}`).value;

    if (product.comments !== newComments) {
        const oldComments = product.comments || '';
        product.comments = newComments;

        await addToHistory({
            type: 'update_comments',
            productId: product.id,
            productName: product.name,
            oldValue: oldComments,
            newValue: newComments,
            timestamp: new Date().toISOString()
        });

        await save();
        updateTable();
    }
}

async function changeQuantity(productId, change) {
    const product = products.find(item => item.id === productId);
    if (!product) return;

    // Find inventory entry for this product and location
    let inventoryEntry = inventoryItems.find(item =>
        item.productId === productId && item.locationId === currentLocation
    );

    if (inventoryEntry) {
        // Update existing entry
        const oldQuantity = inventoryEntry.quantity;
        const newQuantity = oldQuantity + change;

        if (newQuantity >= 0) {
            inventoryEntry.quantity = newQuantity;

            await addToHistory({
                type: 'update_quantity',
                productId: product.id,
                productName: product.name,
                locationId: currentLocation,
                oldQuantity,
                newQuantity,
                timestamp: new Date().toISOString()
            });

            await save();
            updateTable();
        }
    } else if (change > 0) {
        // Create new inventory entry
        inventoryEntry = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
            productId: product.id,
            locationId: currentLocation,
            quantity: change
        };

        inventoryItems.push(inventoryEntry);

        await addToHistory({
            type: 'add_inventory',
            productId: product.id,
            productName: product.name,
            locationId: currentLocation,
            quantity: change,
            timestamp: new Date().toISOString()
        });

        await save();
        updateTable();
    }
}

// Allow direct editing of location quantity by clicking on the value
async function editLocationQuantity(productId, locationId, element) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const currentValue = element.textContent;
    const input = document.createElement('input');
    input.type = 'number';
    input.step = '1';
    input.min = '0';
    input.value = currentValue;
    input.className = 'quantity-value editing';
    input.style.width = '40px';

    element.textContent = '';
    element.appendChild(input);
    input.focus();

    async function saveEdit() {
        const newValue = parseInt(input.value);
        const oldValue = parseInt(currentValue);

        if (isNaN(newValue) || newValue === oldValue) {
            element.textContent = currentValue;
            return;
        }

        if (newValue >= 0) {
            // Find inventory entry for this product and location
            let inventoryEntry = inventoryItems.find(item =>
                item.productId === productId && item.locationId === locationId
            );

            if (inventoryEntry) {
                inventoryEntry.quantity = newValue;

                await addToHistory({
                    type: 'update_quantity',
                    productId: product.id,
                    productName: product.name,
                    locationId: locationId,
                    oldQuantity: oldValue,
                    newQuantity: newValue,
                    timestamp: new Date().toISOString()
                });
            } else if (newValue > 0) {
                // Create new inventory entry
                inventoryEntry = {
                    id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
                    productId: product.id,
                    locationId: locationId,
                    quantity: newValue
                };

                inventoryItems.push(inventoryEntry);

                await addToHistory({
                    type: 'add_inventory',
                    productId: product.id,
                    productName: product.name,
                    locationId: locationId,
                    quantity: newValue,
                    timestamp: new Date().toISOString()
                });
            }

            await save();
            updateTable();
        } else {
            element.textContent = currentValue;
        }
    }

    input.addEventListener('blur', saveEdit);
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            saveEdit();
            input.blur();
        }
    });
}

// Debounce function to limit how often a function can be called
function debounce(func, wait) {
    let timeout;
    return function (...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}

// Store pending changes to show immediate visual feedback
const pendingQuantityChanges = {};

// Apply visual update immediately without saving
function applyVisualQuantityChange(productId, locationId, change) {
    const key = `${productId}-${locationId}`;
    pendingQuantityChanges[key] = (pendingQuantityChanges[key] || 0) + change;

    // Find the quantity display element and update it
    const quantityElement = document.querySelector(`[data-product-id="${productId}"][data-location-id="${locationId}"]`);
    if (quantityElement) {
        const currentQuantity = parseInt(quantityElement.textContent || '0');
        const newQuantity = Math.max(0, currentQuantity + change);
        quantityElement.textContent = newQuantity;
    }

    // Update total if needed
    const totalElement = document.querySelector(`[data-product-id="${productId}"][data-total="true"]`);
    if (totalElement) {
        const currentTotal = parseInt(totalElement.textContent.replace('Total: ', '') || '0');
        const newTotal = Math.max(0, currentTotal + change);
        totalElement.textContent = `Total: ${newTotal}`;
    }
}

// Debounced function to actually save changes
const saveQuantityChange = debounce(async (productId, locationId, change) => {
    const key = `${productId}-${locationId}`;
    const totalChange = pendingQuantityChanges[key] || 0;

    // Reset pending changes
    pendingQuantityChanges[key] = 0;

    if (totalChange === 0) return;

    const product = products.find(item => item.id === productId);
    if (!product) return;

    // Find inventory entry for this product and the specified location
    let inventoryEntry = inventoryItems.find(item =>
        item.productId === productId && item.locationId === locationId
    );

    if (inventoryEntry) {
        // Update existing entry
        const oldQuantity = inventoryEntry.quantity;
        const newQuantity = Math.max(0, oldQuantity + totalChange);

        inventoryEntry.quantity = newQuantity;

        await addToHistory({
            type: 'update_quantity',
            productId: product.id,
            productName: product.name,
            locationId: locationId,
            oldQuantity,
            newQuantity,
            timestamp: new Date().toISOString()
        });

        await save();
        updateTable();
    } else if (totalChange > 0) {
        // Create new inventory entry
        inventoryEntry = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
            productId: product.id,
            locationId: locationId,
            quantity: totalChange
        };

        inventoryItems.push(inventoryEntry);

        await addToHistory({
            type: 'add_inventory',
            productId: product.id,
            productName: product.name,
            locationId: locationId,
            quantity: totalChange,
            timestamp: new Date().toISOString()
        });

        await save();
        updateTable();
    }
}, 500); // 500ms debounce time

// Function to change quantity with debounce
function changeSpecificLocationQuantityWithDebounce(productId, locationId, change) {
    // Apply visual change immediately
    applyVisualQuantityChange(productId, locationId, change);

    // Schedule the actual save after debounce
    saveQuantityChange(productId, locationId, change);
}

function clearForm() {
    document.getElementById('itemName').value = '';
    document.getElementById('itemQuantity').value = '';
    document.getElementById('itemPrice').value = '';
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}-${month}-${year} ${hours}:${minutes}`;
}

function updateHistory() {
    const historyList = document.getElementById('historyList');
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    historyList.innerHTML = '';

    if (!Array.isArray(transactions)) {
        console.warn('Transactions is not an array:', transactions);
        return;
    }

    // Sort transactions by timestamp (newest first)
    const sortedTransactions = [...transactions].sort((a, b) =>
        new Date(b.timestamp) - new Date(a.timestamp)
    );

    // Filter transactions by search term and location filter
    let filteredTransactions = sortedTransactions;

    // Apply location filter if set
    if (locationFilter) {
        filteredTransactions = filteredTransactions.filter(transaction => {
            // Include transactions that have a locationId matching the current filter
            if (transaction.locationId === locationFilter) {
                return true;
            }
            // Include location-related transactions (add_location, delete_location, rename_location)
            if (transaction.type === 'add_location' || transaction.type === 'delete_location' || transaction.type === 'rename_location') {
                return true;
            }
            // Include transactions without locationId (like product creation, etc.)
            if (!transaction.locationId) {
                return true;
            }
            return false;
        });
    }

    // Apply search term filter if provided
    if (searchTerm) {
        filteredTransactions = filteredTransactions.filter(transaction =>
            (transaction.productName && transaction.productName.toLowerCase().includes(searchTerm)) ||
            (transaction.productId && products.some(p =>
                p.id === transaction.productId &&
                p.name.toLowerCase().includes(searchTerm)
            ))
        );
    }

    // Pagination logic
    const totalHistory = filteredTransactions.length;
    const totalHistoryPages = Math.ceil(totalHistory / historyPageSize) || 1;
    if (historyPage > totalHistoryPages) historyPage = 1;
    const paginatedHistory = filteredTransactions.slice((historyPage - 1) * historyPageSize, historyPage * historyPageSize);

    paginatedHistory.forEach((transaction, index) => {
        const div = document.createElement('div');
        div.className = 'history-item';
        let changeText = '';

        try {
            // Get location name if locationId exists
            const getLocationName = (locationId) => {
                const location = locations.find(loc => loc.id === locationId);
                return location ? location.name : 'Unknown Location';
            };

            switch (transaction.type) {
                case 'add_inventory':
                    changeText = t('log_add_inventory')
                        .replace('{user}', transaction.user)
                        .replace('{quantity}', transaction.quantity)
                        .replace('{productName}', transaction.productName)
                        .replace('{locationName}', getLocationName(transaction.locationId));
                    break;
                case 'delete_inventory':
                    const locationDisplayName = transaction.locationName || getLocationName(transaction.locationId);
                    changeText = t('log_delete_inventory')
                        .replace('{user}', transaction.user)
                        .replace('{productName}', transaction.productName)
                        .replace('{locationName}', locationDisplayName);
                    break;
                case 'delete_product':
                    changeText = t('log_delete_product')
                        .replace('{user}', transaction.user)
                        .replace('{productName}', transaction.productName);
                    break;
                case 'update_quantity':
                    changeText = t('log_update_quantity')
                        .replace('{user}', transaction.user)
                        .replace('{productName}', transaction.productName)
                        .replace('{oldQuantity}', transaction.oldQuantity)
                        .replace('{newQuantity}', transaction.newQuantity)
                        .replace('{locationName}', getLocationName(transaction.locationId));
                    break;
                case 'edit_product':
                    changeText = t('log_edit_product')
                        .replace('{user}', transaction.user)
                        .replace('{field}', transaction.field)
                        .replace('{productName}', transaction.productName)
                        .replace('{oldValue}', transaction.oldValue)
                        .replace('{newValue}', transaction.newValue);

                    // When a product name is edited, include the location (if available)
                    if (transaction.field === 'name' && transaction.locationId) {
                        const locName = getLocationName(transaction.locationId);
                        changeText += t('in_location').replace('{locationName}', locName);
                    }
                    break;
                case 'update_details':
                    changeText = t('log_update_details')
                        .replace('{user}', transaction.user)
                        .replace('{productName}', transaction.productName);
                    break;
                case 'add_location':
                    changeText = t('log_add_location')
                        .replace('{user}', transaction.user)
                        .replace('{locationName}', transaction.location?.name || '');
                    break;
                case 'delete_location':
                    changeText = t('log_delete_location')
                        .replace('{user}', transaction.user)
                        .replace('{locationName}', transaction.location?.name || '');
                    break;
                case 'rename_location':
                    changeText = t('log_rename_location')
                        .replace('{user}', transaction.user)
                        .replace('{oldName}', transaction.oldName)
                        .replace('{newName}', transaction.newName);
                    break;
                case 'update_comments':
                    changeText = t('log_update_comments')
                        .replace('{user}', transaction.user)
                        .replace('{productName}', transaction.productName);
                    break;
                case 'scan_barcode':
                    changeText = t('log_scan_barcode')
                        .replace('{user}', transaction.user)
                        .replace('{barcode}', transaction.barcode)
                        .replace('{productName}', transaction.productName || '');
                    break;
                case 'assign_barcode':
                    changeText = t('log_assign_barcode')
                        .replace('{user}', transaction.user)
                        .replace('{newValue}', transaction.newValue)
                        .replace('{productName}', transaction.productName);
                    break;
                case 'remove_barcode':
                    changeText = t('log_remove_barcode')
                        .replace('{user}', transaction.user)
                        .replace('{productName}', transaction.productName);
                    break;
                case 'create_product':
                    changeText = t('log_create_product')
                        .replace('{user}', transaction.user)
                        .replace('{productName}', transaction.productName)
                        .replace('{barcode}', transaction.barcode || '');
                    break;
                default:
                    changeText = t('log_unknown')
                        .replace('{user}', transaction.user)
                        .replace('{type}', transaction.type);
            }
        } catch (error) {
            console.error('Error processing transaction entry:', error, transaction);
            changeText = t('log_error');
        }

        div.innerHTML = `
                    <span>${changeText} - ${formatDate(transaction.timestamp)}</span>
                `;
        historyList.appendChild(div);
    });

    // Show a message if no matching transactions
    if (searchTerm && filteredTransactions.length === 0) {
        const noResults = document.createElement('div');
        noResults.className = 'no-results';
        noResults.textContent = t('No matching history items found.');
        historyList.appendChild(noResults);
    }
    // Render pagination controls
    renderPaginationControls(
        'historyPagination',
        historyPage,
        totalHistoryPages,
        historyPageSize,
        (page) => { historyPage = page; updateHistory(); },
        (size) => { historyPageSize = size; historyPage = 1; updateHistory(); }
    );
}

async function addToHistory(change) {
    // Add user information to the change record
    change.user = currentUser;
    change.userId = currentUserId;
    transactions.push(change);
    await save();
    updateHistory();
    // Count this as an unsaved change since last export
    if (typeof window.incrementUnsavedChanges === 'function') {
        window.incrementUnsavedChanges(1);
    }
}

document.getElementById('searchInput').addEventListener('input', function () {
    inventoryPage = 1;
    historyPage = 1;
    updateTable();
    updateHistory(); // Also update history when search input changes
    renderLocationFilterButtons(); // Update location filter buttons with new quantities
});
// --- Sorting State ---
let sortColumn = 'name';
let sortDirection = 'asc'; // 'asc' or 'desc'

function setSort(column) {
    if (sortColumn === column) {
        sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        sortColumn = column;
        sortDirection = 'asc';
    }
    updateTable();
}

function updateSortIcons() {
    const icons = {
        name: document.getElementById('sortIconName'),
        quantity: document.getElementById('sortIconQuantity'),
        price: document.getElementById('sortIconPrice')
    };
    Object.keys(icons).forEach(col => {
        if (sortColumn === col) {
            icons[col].textContent = sortDirection === 'asc' ? '▲' : '▼';
        } else {
            icons[col].textContent = '';
        }
    });
}

// Initial load
updateLocationSelect();
updateTable();
updateHistory();

function updateTable() {
    const tbody = document.getElementById('inventoryBody');
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    tbody.innerHTML = '';
    // Get products with inventory in any location (for total quantities)
    const productInventory = {};
    // Initialize with all products
    products.forEach(product => {
        productInventory[product.id] = {
            product,
            quantities: {},
            totalQuantity: 0
        };
    });
    // Add quantities from inventory
    inventoryItems.forEach(item => {
        if (productInventory[item.productId]) {
            productInventory[item.productId].quantities[item.locationId] = item.quantity;
            productInventory[item.productId].totalQuantity += item.quantity;
        }
    });
    // Filter by search term and locationFilter
    const filteredProducts = Object.values(productInventory).filter(entry => {
        const product = entry.product;
        const matchesName = product.name.toLowerCase().includes(searchTerm);
        const matchesBarcode = product.barcode && product.barcode.toLowerCase().includes(searchTerm);
        // Only show if product has quantity in selected location
        const showInLocation = locationFilter ? (entry.quantities[locationFilter] > 0) : true;
        return (matchesName || matchesBarcode) && showInLocation;
    });
    // Removed totalFoundContainer display; totals are now shown on the 'All' button
    // --- Sort by selected column and direction ---
    filteredProducts.sort((a, b) => {
        let valA, valB;
        if (sortColumn === 'name') {
            valA = a.product.name.toLowerCase();
            valB = b.product.name.toLowerCase();
        } else if (sortColumn === 'quantity') {
            valA = a.totalQuantity;
            valB = b.totalQuantity;
        } else if (sortColumn === 'price') {
            valA = a.product.price;
            valB = b.product.price;
        }
        if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
    });
    // Pagination logic
    const totalProducts = filteredProducts.length;
    const totalInventoryPages = Math.ceil(totalProducts / inventoryPageSize) || 1;
    if (inventoryPage > totalInventoryPages) inventoryPage = 1;
    const paginatedProducts = filteredProducts.slice((inventoryPage - 1) * inventoryPageSize, inventoryPage * inventoryPageSize);
    // Update sort icons
    updateSortIcons();
    // Display the products
    paginatedProducts.forEach(entry => {
        const product = entry.product;
        const currentLocationQuantity = entry.quantities[currentLocation] || 0;

        const tr = document.createElement('tr');
        tr.className = 'item-row';
        tr.dataset.productId = product.id;

        // When a location filter is active, only show that location's quantities
        const displayedLocations = locationFilter ? locations.filter(loc => loc.id === locationFilter) : locations;
        const quantityHeaderText = locationFilter
            ? `${(locations.find(l => l.id === locationFilter) || { name: 'Quantity' }).name}: ${entry.quantities[locationFilter] || 0}`
            : `${t('Total:')} ${entry.totalQuantity}`;

        const detailsHtml = `
                    <div class="item-details" id="details-${product.id}">
                        <div class="item-details-grid">
                            <div class="item-details-section">
                                 <label data-i18n="Comments:">Comments:</label>
                                <textarea id="comments-${product.id}" onblur="updateComments('${product.id}')">${product.comments || ''}</textarea>
                            </div>
                        </div>
                    </div>
                `;

        tr.innerHTML = `
                    <td>
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <span class="editable" onclick="if(!this.querySelector('input'))editField('${product.id}', 'name', this)">${product.name}</span>
                            <button class="toggle-details-btn" onclick="toggleDetails(event, '${product.id}')">▼</button>
                             <button class="search-name-btn" data-i18n-title="Search for this name" title="Search for this name" onclick="searchByName('${product.name.replace(/'/g, "\\'")}')" style="background: none; border: none; cursor: pointer; padding: 0; margin-left: 2px;">
                                <span style="font-size: 1em;">🔍</span>
                            </button>
                        </div>
                    </td>
                    <td>
                        ${locationFilter ? '' : `
                        <div class="total-quantity">
                            <strong data-product-id="${product.id}" data-total="true">${quantityHeaderText}</strong>
                        </div>
                        `}
                        <div class="location-quantities-list">
                            ${displayedLocations.map(loc => {
            const locQuantity = entry.quantities[loc.id] || 0;
            const isCurrent = loc.id === currentLocation;
            return `
                                <div class="location-quantity-item ${isCurrent ? 'current' : ''}">
                                    <span class="location-name">${loc.name}:</span>
                                    <div class="quantity-controls">
                                        <button onclick="changeSpecificLocationQuantityWithDebounce('${product.id}', '${loc.id}', -1)" class="quantity-btn">-</button>
                                        <span class="quantity-value" data-product-id="${product.id}" data-location-id="${loc.id}" onclick="editLocationQuantity('${product.id}', '${loc.id}', this)">${locQuantity}</span>
                                        <button onclick="changeSpecificLocationQuantityWithDebounce('${product.id}', '${loc.id}', 1)" class="quantity-btn">+</button>
                                    </div>
                                </div>
                                `;
        }).join('')}
                        </div>
                    </td>
                    <td>
                        <span class="editable" onclick="if(!this.querySelector('input'))editField('${product.id}', 'price', this)">${product.price.toFixed(2)}</span>
                    </td>
                    <td>
                         <button onclick="deleteItem('${product.id}')" data-i18n="Delete">Delete</button>
                         <button class="barcode-btn" onclick="openBarcodeModal('${product.id}')">${product.barcode ? t('Edit Barcode') : t('Add Barcode')}</button>
                    </td>
                `;
        tbody.appendChild(tr);

        // Add details row
        const detailsRow = document.createElement('tr');
        detailsRow.className = 'item-details-row';
        detailsRow.innerHTML = `
                    <td colspan="4">
                        ${detailsHtml}
                    </td>
                `;
        tbody.appendChild(detailsRow);
    });
    // Render pagination controls
    renderPaginationControls(
        'inventoryPagination',
        inventoryPage,
        totalInventoryPages,
        inventoryPageSize,
        (page) => { inventoryPage = page; updateTable(); },
        (size) => { inventoryPageSize = size; inventoryPage = 1; updateTable(); }
    );

    // Update location filter buttons to reflect current quantities
    renderLocationFilterButtons();
}

// Handle errors with IndexedDB
const handleDBError = (error) => {
    console.error('IndexedDB error:', error.message);
    alert(`Database error: ${error.message}. Some features may not work correctly.`);
};

// Add global event handler for IndexedDB errors
window.addEventListener('error', (event) => {
    if (event.target && event.target.error && event.target.error.name &&
        event.target.error.name.includes('IDB')) {
        handleDBError(event.target.error);
    }
});

// Initialize the app when DOM content is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize with error handling
    initializeData().catch(error => {
        console.error('Error during initialization:', error);
        alert('Failed to initialize the application. Please refresh the page or check console for details.');
    });
    // Set initial filter and current location
    setTimeout(() => {
        if (locations && locations.length > 0) {
            currentLocation = locations[0].id;
            locationFilter = locations[0].id;
            renderLocationFilterButtons();
            updateTable();
        }
    }, 500);
});


function changeUser(selectedUserId) {
    if (!selectedUserId && users.length > 0) {
        // If somehow no user is selected, select the first one
        selectedUserId = users[0].id;
        document.getElementById('userSelect').value = selectedUserId;
    }
    currentUserId = selectedUserId;
    currentUser = users.find(user => user.id === selectedUserId)?.name || '';
    // Ensure location filter is maintained when changing users
    if (!locationFilter && locations.length > 0) {
        locationFilter = currentLocation || locations[0].id;
    }
    updateTable();
    updateHistory();
}

function updateUserInHistory(oldName, newName) {
    // Update username in transaction history
    for (const transaction of transactions) {
        if (transaction.user === oldName) {
            transaction.user = newName;
        }
    }

    // Update the display
    updateHistory();

    // Save changes
    save();
}

async function loadUsers() {
    try {
        users = await loadFromIndexedDB('users') || [];
        const userSelect = document.getElementById('userSelect');

        // Only update the user selector if it exists
        if (userSelect) {
            userSelect.innerHTML = '';
            users.forEach(user => {
                const option = document.createElement('option');
                option.value = user.id;
                option.textContent = user.name;
                if (user.id === currentUserId) {
                    option.selected = true;
                }
                userSelect.appendChild(option);
            });

            // If no user is selected, select the first one
            if (!currentUserId && users.length > 0) {
                currentUserId = users[0].id;
                currentUser = users[0].name;
                userSelect.value = currentUserId;
            }

            // Ensure location filter is set
            if (!locationFilter && locations.length > 0) {
                locationFilter = locations[0].id;
            }
        }

        // Update the table to reflect any user changes
        updateTable();
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

// Render location filter buttons
function renderLocationFilterButtons() {
    const container = document.getElementById('locationFilterButtons');
    if (!container) return;
    container.innerHTML = '';
    if (!locations || locations.length === 0) return;

    // Get current search term for calculating button totals
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();

    // Calculate total for all locations based on current search
    let allTotal = 0;
    if (searchTerm) {
        products.forEach(product => {
            const matchesName = product.name.toLowerCase().includes(searchTerm);
            const matchesBarcode = product.barcode && product.barcode.toLowerCase().includes(searchTerm);
            if (matchesName || matchesBarcode) {
                inventoryItems.forEach(item => {
                    if (item.productId === product.id) {
                        allTotal += item.quantity;
                    }
                });
            }
        });
    } else {
        inventoryItems.forEach(item => {
            allTotal += item.quantity;
        });
    }

    // Add "All" button first with total
    const allBtn = document.createElement('button');
    allBtn.textContent = `${t('All')} (${allTotal})`;
    allBtn.className = 'location-filter-btn' + (locationFilter === null ? ' selected' : '');
    allBtn.onclick = () => {
        locationFilter = null;
        currentLocation = locations[0].id;
        renderLocationFilterButtons();
        updateTable();
        updateHistory();
    };
    container.appendChild(allBtn);

    // Add individual location buttons with quantities
    locations.forEach(loc => {
        const btn = document.createElement('button');

        // Calculate total quantity for this location based on current search
        let locationTotal = 0;
        if (searchTerm) {
            // Filter products by search term and sum quantities for this location
            products.forEach(product => {
                const matchesName = product.name.toLowerCase().includes(searchTerm);
                const matchesBarcode = product.barcode && product.barcode.toLowerCase().includes(searchTerm);
                if (matchesName || matchesBarcode) {
                    const inventoryItem = inventoryItems.find(item =>
                        item.productId === product.id && item.locationId === loc.id
                    );
                    if (inventoryItem) {
                        locationTotal += inventoryItem.quantity;
                    }
                }
            });
        } else {
            // No search term, sum all quantities for this location
            inventoryItems.forEach(item => {
                if (item.locationId === loc.id) {
                    locationTotal += item.quantity;
                }
            });
        }

        btn.textContent = `${loc.name} (${locationTotal})`;
        btn.className = 'location-filter-btn' + (locationFilter === loc.id ? ' selected' : '');
        btn.onclick = () => {
            locationFilter = loc.id;
            currentLocation = loc.id;
            renderLocationFilterButtons();
            updateTable();
            updateHistory();
        };
        container.appendChild(btn);
    });
}

// After the add-item-form input fields are defined, add this event listener:
document.getElementById('itemName').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        addItem();
    }
});

// Add this function in the script section:
function searchByName(name) {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.value = name;
        updateTable();
        updateHistory && updateHistory();
    }
}

function renderPaginationControls(containerId, currentPage, totalPages, pageSize, onPageChange, onPageSizeChange) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';

    // Prev button
    const prevBtn = document.createElement('button');
    prevBtn.textContent = t('pagination_prev');
    prevBtn.disabled = currentPage === 1;
    prevBtn.onclick = () => onPageChange(currentPage - 1);
    container.appendChild(prevBtn);

    // Page info
    const pageInfo = document.createElement('span');
    pageInfo.textContent = ` ${t('pagination_page_of').replace('{current}', currentPage).replace('{total}', totalPages)} `;
    container.appendChild(pageInfo);

    // Next button
    const nextBtn = document.createElement('button');
    nextBtn.textContent = t('pagination_next');
    nextBtn.disabled = currentPage === totalPages || totalPages === 0;
    nextBtn.onclick = () => onPageChange(currentPage + 1);
    container.appendChild(nextBtn);

    // For space before page selector
    const spaceSpan = document.createElement('span');
    spaceSpan.textContent = ' ';
    container.appendChild(spaceSpan);

    // Page size selector
    const pageSizeSelect = document.createElement('select');
    [5, 10, 20, 50, 100].forEach(size => {
        const option = document.createElement('option');
        option.value = size;
        option.textContent = `${size} ${t('per_page')}`;
        if (size === pageSize) option.selected = true;
        pageSizeSelect.appendChild(option);
    });
    pageSizeSelect.onchange = (e) => onPageSizeChange(Number(e.target.value));
    container.appendChild(pageSizeSelect);
}
