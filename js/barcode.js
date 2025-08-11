 // Barcode Scanner Variables
 let scannerStream = null;
 let scannerInterval = null;
 let currentCameraIndex = 0;
 let availableCameras = [];
 
 
 // Store the ZXing reader instance
 let codeReader = null;
 
 // Look up a product by barcode
 function lookupProductByBarcode(barcode) {
     // In a real implementation, you would look up the product in your database
     // For now, we'll just search for a product with a matching ID
     
     const product = products.find(p => p.id === barcode || p.barcode === barcode);
     
     if (product) {
         // Product found, scroll to it in the table
         const productRow = document.querySelector(`tr[data-product-id="${product.id}"]`);
         if (productRow) {
             productRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
             productRow.classList.add('highlight-row');
             setTimeout(() => {
                 productRow.classList.remove('highlight-row');
             }, 2000);
         }
         
         // Add to history
         addToHistory({
             type: 'scan_barcode',
             productId: product.id,
             productName: product.name,
             barcode: barcode,
             timestamp: new Date().toISOString()
         });
     } else {
        // Product not found, ask if user wants to add it
        if (confirm(t('No product found with barcode {barcode}. Would you like to add it?').replace('{barcode}', barcode))) {
             // Pre-fill the add item form
             document.getElementById('itemName').value = `Product ${barcode}`;
             document.getElementById('itemQuantity').value = '1';
             document.getElementById('itemPrice').value = '0.00';
             
             // Focus on the name field for editing
             document.getElementById('itemName').focus();
         }
     }
 }
 
 // Add this to the style section
 document.head.insertAdjacentHTML('beforeend', `
     <style>
         .highlight-row {
             animation: highlight 2s ease-out;
         }
         
         @keyframes highlight {
             0% { background-color: rgba(255, 255, 0, 0.5); }
             100% { background-color: transparent; }
         }
     </style>
 `);

 // Add barcode assignment functions
 let currentBarcodeProductId = null;
 let currentScannedBarcode = null;
 
 function openBarcodeModal(productId) {
     const product = products.find(p => p.id === productId);
     if (!product) return;
     
     currentBarcodeProductId = productId;
     document.getElementById('barcodeProductName').textContent = product.name;
     document.getElementById('barcodeInput').value = product.barcode || '';
     document.getElementById('barcodeModal').style.display = 'block';
     document.getElementById('barcodeInput').focus();
 }

 function showBarcodeAssignmentModal(barcode) {
     // Create a select dropdown with all products
     const modal = document.getElementById('assignBarcodeModal') || createAssignBarcodeModal();
     const productSelect = document.getElementById('assignBarcodeProductSelect');
     
     // Clear previous options
     productSelect.innerHTML = '';
     
     // Add options for all products without barcodes
     products.forEach(product => {
         const option = document.createElement('option');
         option.value = product.id;
         option.textContent = product.name;
         productSelect.appendChild(option);
     });
     
     // Set the scanned barcode
     currentScannedBarcode = barcode;
     document.getElementById('assignBarcodeValue').textContent = barcode;
     
     // Show modal
     modal.style.display = 'block';
 }

 function createAssignBarcodeModal() {
     // Create modal if it doesn't exist
     const modal = document.createElement('div');
     modal.id = 'assignBarcodeModal';
     modal.className = 'modal';
     
      modal.innerHTML = `
         <div class="modal-content">
              <div class="modal-header">
                  <h2 data-i18n="Assign Barcode">Assign Barcode</h2>
                 <span class="close" onclick="closeAssignBarcodeModal()">&times;</span>
             </div>
             <div class="modal-body">
                 <p>Barcode: <strong id="assignBarcodeValue"></strong></p>
                  <p data-i18n="Select product to assign this barcode to:">Select product to assign this barcode to:</p>
                 <select id="assignBarcodeProductSelect" class="form-control"></select>
             </div>
             <div class="modal-footer">
                  <button onclick="assignBarcodeToExistingProduct()" data-i18n="Assign Barcode">Assign Barcode</button>
                  <button onclick="closeAssignBarcodeModal()" data-i18n="Cancel">Cancel</button>
             </div>
         </div>
     `;
     
     document.body.appendChild(modal);
     return modal;
 }

 function closeAssignBarcodeModal() {
     const modal = document.getElementById('assignBarcodeModal');
     if (modal) modal.style.display = 'none';
     currentScannedBarcode = null;
 }

 async function assignBarcodeToExistingProduct() {
     const productId = document.getElementById('assignBarcodeProductSelect').value;
     const product = products.find(p => p.id === productId);
     
     if (!product || !currentScannedBarcode) return;
     
     // Update the product barcode
     const oldBarcode = product.barcode || '';
     product.barcode = currentScannedBarcode;
     
     // Add to history
     await addToHistory({
         type: 'assign_barcode',
         productId: product.id,
         productName: product.name,
         oldValue: oldBarcode,
         newValue: currentScannedBarcode,
         timestamp: new Date().toISOString()
     });
     
     // Save to database
     await save();
     
     // Close modal
     closeAssignBarcodeModal();
     closeBarcodeScanner();
     
     // Show success message
      alert(t('Barcode {barcode} assigned to {name}').replace('{barcode}', currentScannedBarcode).replace('{name}', product.name));
     
     // Update UI
     updateTable();
 }

 async function assignBarcodeToNewProduct(barcode) {
     // Pre-fill the item form
     document.getElementById('itemName').value = `Product ${barcode}`;
     document.getElementById('itemQuantity').value = '1';
     document.getElementById('itemPrice').value = '0.00';
     
     // Close barcode scanner
     closeBarcodeScanner();
     
     // Focus on the name field
     document.getElementById('itemName').focus();
     
     // Create a new product with the barcode
     const product = { 
         id: Date.now().toString(),
         name: `Product ${barcode}`,
         price: 0,
         comments: '',
         barcode: barcode,
     };
     
     // Add to products array
     products.push(product);
     
     // Add to history
     await addToHistory({
         type: 'create_product',
         productId: product.id,
         productName: product.name,
         barcode: barcode,
         timestamp: new Date().toISOString()
     });
     
     // Save to database
     await save();
     
     // Update UI
     updateTable();
     
     // Show success message
      alert(t('New product created with barcode {barcode}. Please update the details.').replace('{barcode}', barcode));
 }
 
 function closeBarcodeModal() {
     document.getElementById('barcodeModal').style.display = 'none';
     currentBarcodeProductId = null;
 }
 
 // Function to scan a barcode for a product
 function scanBarcodeForProduct() {
     // Close the barcode modal temporarily
     document.getElementById('barcodeModal').style.display = 'none';
     
     // Remember that we're scanning for a product
     const scanningForProduct = true;
     const productId = currentBarcodeProductId;
     
     // Show the scanner modal
     document.getElementById('scannerModal').style.display = 'block';
     
     // Reset the results
     document.getElementById('scannerResult').textContent = '';
     document.getElementById('productResult').textContent = '';
     
     // Get video element
     const videoElement = document.getElementById('video');
     
     // Create instance of the reader
     codeReader = new window.BrowserMultiFormatReader();
     
     // Get available video devices
     codeReader.listVideoInputDevices()
         .then(videoInputDevices => {
            if (videoInputDevices.length === 0) {
                alert(t('No camera devices found'));
                 cancelBarcodeScanning();
                 return;
             }
             
             // Use first device by default
             const firstDeviceId = videoInputDevices[0].deviceId;
             
             // Start decoding from video device
             codeReader.decodeFromVideoDevice(firstDeviceId, videoElement, (result, error) => {
                 if (result) {
                     // Barcode found!
                     const barcode = result.getText();
                     document.getElementById('scannerResult').textContent = `Found barcode: ${barcode}`;
                     
                     // Check if the barcode is already assigned to a different product
                     const existingProduct = products.find(p => p.barcode === barcode && p.id !== productId);
                     if (existingProduct) {
                          document.getElementById('productResult').innerHTML = `
                              <div class=\"alert alert-warning mt-3\">
                                  <p>${t('Barcode {barcode} is already assigned to product \"{name}\"').replace('{barcode}', barcode).replace('{name}', existingProduct.name)}</p>
                                  <button class=\"btn btn-primary\" onclick=\"useScannedBarcodeForProduct('${barcode}')\">${t('Use Anyway')}</button>
                                  <button class=\"btn btn-secondary\" onclick=\"cancelBarcodeScanning()\">${t('Cancel')}</button>
                              </div>
                          `;
                     } else {
                         // Use the barcode for the current product
                         useScannedBarcodeForProduct(barcode);
                     }
                 }
                 
                 if (error && !(error instanceof window.NotFoundException)) {
                     // Only log critical errors, not the common "not found" errors
                     console.error('ZXing error:', error);
                 }
             });
         })
            .catch(err => {
            console.error('Error accessing camera:', err);
            alert(t('Error accessing camera:') + ' ' + err);
             cancelBarcodeScanning();
         });
 }
 
 // Function to use a scanned barcode for a product
 function useScannedBarcodeForProduct(barcode) {
     // Close the scanner
     closeBarcodeScanner();
     
     // Reopen the barcode modal
     document.getElementById('barcodeModal').style.display = 'block';
     
     // Set the scanned barcode value in the input field
     document.getElementById('barcodeInput').value = barcode;
     
     // Focus on the save button
     setTimeout(() => {
         const saveButton = document.querySelector('.barcode-form .save-btn');
         if (saveButton) saveButton.focus();
     }, 100);
 }
 
 // Function to cancel barcode scanning and go back to the barcode modal
 function cancelBarcodeScanning() {
     // Close the scanner
     closeBarcodeScanner();
     
     // Reopen the barcode modal
     document.getElementById('barcodeModal').style.display = 'block';
 }
 
 async function saveBarcode() {
     if (!currentBarcodeProductId) return;
     
     const barcode = document.getElementById('barcodeInput').value.trim();
     const product = products.find(p => p.id === currentBarcodeProductId);
     
     if (!product) return;
     
     // Check if barcode already exists on another product
     const existingProduct = products.find(p => p.barcode === barcode && p.id !== currentBarcodeProductId);
     if (barcode && existingProduct) {
         if (!confirm(`This barcode is already assigned to product "${existingProduct.name}". Do you want to reassign it?`)) {
             return;
         }
         
         // Remove barcode from existing product
         const oldBarcode = existingProduct.barcode;
         existingProduct.barcode = '';
         
         // Add to history
         await addToHistory({
             type: 'remove_barcode',
             productId: existingProduct.id,
             productName: existingProduct.name,
             oldValue: oldBarcode,
             newValue: '',
             timestamp: new Date().toISOString()
         });
     }
     
     const oldBarcode = product.barcode || '';
     product.barcode = barcode;
     
     await addToHistory({
         type: 'assign_barcode',
         productId: product.id,
         productName: product.name,
         oldValue: oldBarcode,
         newValue: barcode,
         timestamp: new Date().toISOString()
     });
     
     await save();
     closeBarcodeModal();
     updateTable();
 }

 // Function to open scanner modal and start scanning
 function openBarcodeScanner() {
    // Reset previous results
    document.getElementById('scannerResult').textContent = '';
    document.getElementById('productResult').textContent = '';
    
    // Show the scanner modal
    document.getElementById('scannerModal').style.display = 'block';
    
    // Get video element
    const videoElement = document.getElementById('video');
    
    // Create instance of the reader
    codeReader = new window.BrowserMultiFormatReader();
    
    // Get available video devices
    codeReader.listVideoInputDevices()
        .then(videoInputDevices => {
            if (videoInputDevices.length === 0) {
                alert(t('No camera devices found'));
                closeBarcodeScanner();
                return;
            }
            
            // Use first device by default
            const firstDeviceId = videoInputDevices[0].deviceId;
            
            // Start decoding from video device
            codeReader.decodeFromVideoDevice(firstDeviceId, videoElement, (result, error) => {
                if (result) {
                    // Barcode found!
                    const barcode = result.getText();
                    document.getElementById('scannerResult').textContent = t('Found barcode: {barcode}').replace('{barcode}', barcode);
                    
                    // Look up product by barcode
                    const product = products.find(p => p.barcode === barcode);
                    if (product) {
                        handleProductFoundByBarcode(product);
                    } else {
                        // No product found with this barcode
                        document.getElementById('productResult').innerHTML = `
                            <div class=\"alert alert-warning mt-3\">
                                <p>${t('Product with barcode {barcode} not found').replace('{barcode}', barcode)}</p>
                                <button class=\"btn btn-primary\" onclick=\"assignBarcodeToNewProduct('${barcode}')\">${t('Create New Product')}</button>
                                <button class=\"btn btn-secondary\" onclick=\"showBarcodeAssignmentModal('${barcode}')\">${t('Assign to Existing Product')}</button>
                            </div>
                        `;
                    }
                }
                
                if (error && !(error instanceof window.NotFoundException)) {
                    // Only log critical errors, not the common "not found" errors
                    console.error('ZXing error:', error);
                }
            });
        })
        .catch(err => {
            console.error('Error accessing camera:', err);
            alert(t('Error accessing camera:') + ' ' + err);
            closeBarcodeScanner();
        });
}

// Function to close scanner and clean up
function closeBarcodeScanner() {
    // Hide the scanner modal
    document.getElementById('scannerModal').style.display = 'none';
    
    // Stop the scanner if it's running
    if (codeReader) {
        codeReader.reset();
        codeReader = null;
    }
}

// Function to switch between available cameras
function switchCamera() {
    if (!codeReader) return;
    
    // Get available cameras
    codeReader.listVideoInputDevices()
        .then(videoInputDevices => {
            availableCameras = videoInputDevices;
            
            if (availableCameras.length <= 1) {
                alert(t('Only one camera available'));
                return;
            }
            
            // Reset the scanner
            codeReader.reset();
            
            // Switch to next camera
            currentCameraIndex = (currentCameraIndex + 1) % availableCameras.length;
            const nextDeviceId = availableCameras[currentCameraIndex].deviceId;
            
            // Get video element
            const videoElement = document.getElementById('video');
            
            // Start decoding from the new camera
            codeReader.decodeFromVideoDevice(nextDeviceId, videoElement, (result, error) => {
                if (result) {
                    // Barcode found!
                    const barcode = result.getText();
                    document.getElementById('scannerResult').textContent = t('Found barcode: {barcode}').replace('{barcode}', barcode);
                    
                    // Look up product by barcode
                    const product = products.find(p => p.barcode === barcode);
                    if (product) {
                        handleProductFoundByBarcode(product);
                    } else {
                        // No product found with this barcode
                        document.getElementById('productResult').innerHTML = `
                            <div class=\"alert alert-warning mt-3\">
                                <p>${t('Product with barcode {barcode} not found').replace('{barcode}', barcode)}</p>
                                <button class=\"btn btn-primary\" onclick=\"assignBarcodeToNewProduct('${barcode}')\">${t('Create New Product')}</button>
                                <button class=\"btn btn-secondary\" onclick=\"showBarcodeAssignmentModal('${barcode}')\">${t('Assign to Existing Product')}</button>
                            </div>
                        `;
                    }
                }
                
                if (error && !(error instanceof window.NotFoundException)) {
                    // Only log critical errors, not the common "not found" errors
                    console.error('ZXing error:', error);
                }
            });
            
            document.getElementById('scanner-status').textContent = t('Using camera {current} of {total}').replace('{current}', currentCameraIndex + 1).replace('{total}', availableCameras.length);
        })
        .catch(err => {
            console.error('Error accessing cameras:', err);
            alert(t('Error accessing camera:') + ' ' + err);
        });
}

// Handle product found by barcode
function handleProductFoundByBarcode(product) {
    // Display product info
    document.getElementById('productResult').innerHTML = `
        <div class=\"alert alert-success mt-3\">\n            <h4>${product.name}</h4>\n            <p>${t('Price')}: ${product.price}</p>\n            <p>${t('Quantity')}: ${product.stock ?? 0}</p>\n        </div>
    `;
    
    // Set the product name in the search bar
    document.getElementById('searchInput').value = product.name;
    
    // Automatically stop scanning after finding a valid barcode
    closeBarcodeScanner();
    
    // Update the table to show filtered results
    updateTable();
}