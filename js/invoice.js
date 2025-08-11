// Pending Invoices Functions
function checkPendingInvoices() {
    const pendingInvoicesList = document.getElementById('pendingInvoicesList');
    pendingInvoicesList.innerHTML = '';
    
    // Get all localStorage keys that match the pattern
    const pendingInvoices = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('avon-temp-')) {
            try {
                const value = JSON.parse(localStorage.getItem(key));
                if (value && value.invoiceNumber && Array.isArray(value.products)) {
                    pendingInvoices.push({
                        key,
                        date: key.replace('avon-temp-', ''),
                        data: value
                    });
                }
            } catch (e) {
                console.error('Error parsing invoice data:', e);
            }
        }
    }

    // Sort invoices by date (newest first)
    pendingInvoices.sort((a, b) => new Date(b.date) - new Date(a.date));

    if (pendingInvoices.length === 0) {
        document.getElementById('pendingInvoices').style.display = 'none';
        return;
    }

    document.getElementById('pendingInvoices').style.display = 'block';

    // Create invoice groups
    pendingInvoices.forEach(invoice => {
        const invoiceGroup = document.createElement('div');
        invoiceGroup.className = 'invoice-group';

        console.log(invoice.data);
        
        // date format: 04062025
        const date = new Date(invoice.data.invoiceDate.replace(/(\d{2})(\d{2})(\d{4})/, '$3-$2-$1'));
        const formattedDate = formatDate(date.toISOString());
        
        const total = invoice.data.products.reduce((sum, product) => 
            sum + (parseFloat(product.pretUnitar) * parseInt(product.bucati)), 0);

        invoiceGroup.innerHTML = `
            <div class="invoice-header" onclick="toggleInvoiceContent(this)">
                <h3>${t('Invoice #{number} - {date}').replace('{number}', invoice.data.invoiceNumber).replace('{date}', formattedDate)}</h3>
                <span class="toggle-icon">▼</span>
            </div>
            <div class="invoice-content">
                <div class="invoice-products">
                    ${invoice.data.products.map(product => `
                        <div class="invoice-product">
                            <div class="invoice-product-info">
                                <div class="invoice-product-name">${product.nume}</div>
                                <div class="invoice-product-details">
                                    ${t('Quantity')}: ${product.bucati} × ${parseFloat(product.pretUnitar).toFixed(2)} RON
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div class="invoice-total">
                    ${t('Total:')} ${total.toFixed(2)} RON
                </div>
                <div class="invoice-actions">
                    <button onclick="confirmInvoice('${invoice.key}')" class="btn btn-primary">${t('Add to Inventory')}</button>
                    <button onclick="deleteInvoice('${invoice.key}')" class="btn btn-secondary" data-i18n="Delete">${t('Delete')}</button>
                </div>
            </div>
        `;
        
        pendingInvoicesList.appendChild(invoiceGroup);
    });
}

function toggleInvoiceContent(header) {
    const content = header.nextElementSibling;
    const icon = header.querySelector('.toggle-icon');
    
    content.classList.toggle('expanded');
    icon.textContent = content.classList.contains('expanded') ? '▼' : '▶';
}

async function confirmInvoice(key) {
    try {
        const invoiceData = JSON.parse(localStorage.getItem(key));
        if (!invoiceData || !invoiceData.products) {
            throw new Error(t('Invalid invoice data'));
        }

        // Process each product in the invoice
        for (const product of invoiceData.products) {
            // Check if product exists
            let existingProduct = products.find(p => 
                p.name.toLowerCase() === product.nume.toLowerCase()
            );

            if (!existingProduct) {
                // Create new product
                existingProduct = {
                    id: Date.now().toString(),
                    name: product.nume,
                    price: parseFloat(product.pretUnitar),
                    comments: '',
                    barcode: ''
                };
                products.push(existingProduct);
            }

            // Add to inventory
            const quantity = parseInt(product.bucati);
            let inventoryEntry = inventoryItems.find(item => 
                item.productId === existingProduct.id && 
                item.locationId === currentLocation
            );

            if (inventoryEntry) {
                // Update existing inventory
                const oldQuantity = inventoryEntry.quantity;
                inventoryEntry.quantity += quantity;
                
                await addToHistory({
                    type: 'update_quantity',
                    productId: existingProduct.id,
                    productName: existingProduct.name,
                    locationId: currentLocation,
                    oldQuantity,
                    newQuantity: inventoryEntry.quantity,
                    timestamp: new Date().toISOString()
                });
            } else {
                // Create new inventory entry
                inventoryEntry = {
                    id: Date.now().toString(),
                    productId: existingProduct.id,
                    locationId: currentLocation,
                    quantity: quantity
                };
                inventoryItems.push(inventoryEntry);
                
                await addToHistory({
                    type: 'add_inventory',
                    productId: existingProduct.id,
                    productName: existingProduct.name,
                    locationId: currentLocation,
                    quantity: quantity,
                    timestamp: new Date().toISOString()
                });
            }
        }

        // Save changes
        await save();
        
        // Remove from localStorage
        localStorage.removeItem(key);
        
        // Update UI
        updateTable();
        checkPendingInvoices();
        
        alert(t('Invoice products have been added to inventory successfully!'));
    } catch (error) {
        console.error('Error processing invoice:', error);
        alert(t('Error processing invoice:') + ' ' + error.message);
    }
}

function deleteInvoice(key) {
    if (confirm(t('Are you sure you want to delete this invoice?'))) {
        localStorage.removeItem(key);
        checkPendingInvoices();
    }
}

// Add checkPendingInvoices to the initialization
document.addEventListener('DOMContentLoaded', () => {
    // Initialize with error handling
    initializeData().catch(error => {
        console.error('Error during initialization:', error);
        alert('Failed to initialize the application. Please refresh the page or check console for details.');
    });
    
    // Check for pending invoices
    checkPendingInvoices();
});