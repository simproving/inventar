// Localization module for the Inventory System
// Handles language switching, translations, and UI updates

// Translation data
const translations = {
    en: {
        'Inventory System': 'Inventory System',
        'Current User:': 'Current User:',
        'Current Location:': 'Current Location:',
        'Floor Plan': 'Floor Plan',
        'Scan Barcode': 'Scan Barcode',
        'Settings': 'Settings',
        'Search items...': 'Search items...',
        'Pending Invoices': 'Pending Invoices',
        'Item Name': 'Item Name',
        'Quantity': 'Quantity',
        'Price': 'Price',
        'Add Item': 'Add Item',
        'Name': 'Name',
        'Actions': 'Actions',
        'Change History': 'Change History',
        'Theme': 'Theme',
        'Data': 'Data',
        'Users': 'Users',
        'Locations': 'Locations',
        'Theme Settings': 'Theme Settings',
        'Dark Mode': 'Dark Mode',
        'Data Management': 'Data Management',
        'Export Data': 'Export Data',
        'Export to JSON': 'Export to JSON',
        'Import Data': 'Import Data',
        'Import from JSON': 'Import from JSON',
        'Rebuild from History': 'Rebuild from History',
        'Rebuild': 'Rebuild',
        'Clear All Data': 'Clear All Data',
        'Clear Database': 'Clear Database',
        'Are you sure you want to rebuild all data from the transaction history? This will overwrite current products, inventory and locations.': 'Are you sure you want to rebuild all data from the transaction history? This will overwrite current products, inventory and locations.',
        'Rebuild complete': 'Rebuild complete',
        'Error rebuilding from history': 'Error rebuilding from history',
        'User Management': 'User Management',
        'Add New User': 'Add New User',
        'User Name': 'User Name',
        'Add': 'Add',
        'Existing Users': 'Existing Users',
        'Location Management': 'Location Management',
        'Add New Location': 'Add New Location',
        'Location Name': 'Location Name',
        'Existing Locations': 'Existing Locations',
        'settings_theme': 'Theme',
        'settings_data': 'Data',
        'settings_users': 'Users',
        'settings_locations': 'Locations',
        'settings_language': 'Language',
        'Language': 'Language',
        'Delete': 'Delete',
        'Edit Barcode': 'Edit Barcode',
        'Add Barcode': 'Add Barcode',
        'Total:': 'Total:',
        'Comments:': 'Comments:',
        'No matching history items found.': 'No matching history items found.',
        'Select': 'Select',
        'Rectangle': 'Rectangle',
        'Circle': 'Circle',
        'Text': 'Text',
        'Delete Floor Plan': 'Delete Floor Plan',
        'Reset': 'Reset',
        'Clear All': 'Clear All',
        'Place Products on Floor Plan': 'Place Products on Floor Plan',
        'Drag products onto the floor plan to show their locations': 'Drag products onto the floor plan to show their locations',
        'View Mode': 'View Mode',
        'Ready to scan...': 'Ready to scan...',
        'Switch Camera': 'Switch Camera',
        'Close': 'Close',
        'Assign Barcode': 'Assign Barcode',
        'Enter barcode': 'Enter barcode',
        'Scan': 'Scan',
        'Save Barcode': 'Save Barcode',
        'Rename': 'Rename',
        '(Current)': '(Current)',
        'Duplicate': 'Duplicate',
        'log_add_inventory': '[{user}] Added {quantity} {productName} to {locationName}',
        'log_delete_inventory': '[{user}] Deleted {productName} from {locationName}',
        'log_delete_product': '[{user}] Removed product {productName} completely',
        'log_update_quantity': '[{user}] Changed quantity of {productName} from {oldQuantity} to {newQuantity} in {locationName}',
        'log_edit_product': '[{user}] Changed {field} of {productName} from {oldValue} to {newValue}',
        'log_update_details': '[{user}] Updated details for {productName}',
        'log_add_location': '[{user}] Added new location: {locationName}',
        'log_delete_location': '[{user}] Deleted location: {locationName}',
        'log_rename_location': '[{user}] Renamed {oldName} to {newName}',
        'log_update_comments': '[{user}] Updated comments for {productName}',
        'log_scan_barcode': '[{user}] Scanned barcode {barcode} for {productName}',
        'log_assign_barcode': '[{user}] Assigned barcode {newValue} to {productName}',
        'log_remove_barcode': '[{user}] Removed barcode from {productName}',
        'log_create_product': '[{user}] Created product {productName} with barcode {barcode}',
        'log_duplicate_product': '[{user}] Duplicated product {sourceProductName} as {productName}',
        'log_unknown': '[{user}] Unknown transaction type: {type}',
        'log_error': 'Error: Invalid transaction entry',
        'per_page': 'per page',
        'pagination_prev': 'Prev',
        'pagination_next': 'Next',
        'pagination_page_of': 'Page {current} of {total}'
    },
    ro: {
        'Inventory System': 'Sistem Inventar',
        'Current User:': 'Utilizator curent:',
        'Current Location:': 'Locație curentă:',
        'Floor Plan': 'Plan Etaj',
        'Scan Barcode': 'Scanează codul de bare',
        'Settings': 'Setări',
        'Search items...': 'Caută produse...',
        'Pending Invoices': 'Facturi în așteptare',
        'Item Name': 'Nume produs',
        'Quantity': 'Cantitate',
        'Price': 'Preț',
        'Add Item': 'Adaugă produs',
        'Name': 'Nume',
        'Actions': 'Acțiuni',
        'Change History': 'Istoric modificări',
        'Theme': 'Temă',
        'Data': 'Date',
        'Users': 'Utilizatori',
        'Locations': 'Locații',
        'Theme Settings': 'Setări temă',
        'Dark Mode': 'Mod întunecat',
        'Data Management': 'Administrare date',
        'Export Data': 'Exportă date',
        'Export to JSON': 'Exportă în JSON',
        'Import Data': 'Importă date',
        'Import from JSON': 'Importă din JSON',
        'Rebuild from History': 'Reconstruiește din istoric',
        'Rebuild': 'Reconstruiește',
        'Clear All Data': 'Șterge toate datele',
        'Clear Database': 'Șterge baza de date',
        'Are you sure you want to rebuild all data from the transaction history? This will overwrite current products, inventory and locations.': 'Sigur doriți să reconstruiți toate datele din istoricul tranzacțiilor? Aceasta va suprascrie produsele, inventarul și locațiile curente.',
        'Rebuild complete': 'Reconstrucție finalizată',
        'Error rebuilding from history': 'Eroare la reconstrucția din istoric',
        'User Management': 'Administrare utilizatori',
        'Add New User': 'Adaugă utilizator nou',
        'User Name': 'Nume utilizator',
        'Add': 'Adaugă',
        'Existing Users': 'Utilizatori existenți',
        'Location Management': 'Administrare locații',
        'Add New Location': 'Adaugă locație nouă',
        'Location Name': 'Nume locație',
        'Existing Locations': 'Locații existente',
        'settings_theme': 'Temă',
        'settings_data': 'Date',
        'settings_users': 'Utilizatori',
        'settings_locations': 'Locații',
        'settings_language': 'Limbă',
        'Language': 'Limbă',
        'Delete': 'Șterge',
        'Edit Barcode': 'Editează codul de bare',
        'Add Barcode': 'Adaugă cod de bare',
        'Total:': 'Total:',
        'Comments:': 'Comentarii:',
        'No matching history items found.': 'Nu s-au găsit rezultate.',
        'Select': 'Select',
        'Rectangle': 'Rectangle',
        'Circle': 'Circle',
        'Text': 'Text',
        'Delete Floor Plan': 'Șterge planului de etaj',
        'Reset': 'Resetat',
        'Clear All': 'Șterge tot',
        'Place Products on Floor Plan': 'Plasează produsele pe planul de etaj pentru a le arăta locurile',
        'Drag products onto the floor plan to show their locations': 'Trage produsele pe planul de etaj pentru a le arăta locurile',
        'View Mode': 'Mod vizual',
        'Ready to scan...': 'Pregătește scanarea...',
        'Switch Camera': 'Schimbă camera',
        'Close': 'Închide',
        'Assign Barcode': 'Atribuie cod de bare',
        'Enter barcode': 'Introduceți codul de bare',
        'Scan': 'Scan',
        'Save Barcode': 'Salvează codul de bare',
        'Rename': 'Redenumire',
        '(Current)': '(Curent)',
        'Duplicate': 'Duplică',
        'log_add_inventory': '[{user}] A adăugat {quantity} {productName} la {locationName}',
        'log_delete_inventory': '[{user}] A șters {productName} din {locationName}',
        'log_delete_product': '[{user}] A eliminat complet produsul {productName}',
        'log_update_quantity': '[{user}] A schimbat cantitatea pentru {productName} de la {oldQuantity} la {newQuantity} în {locationName}',
        'log_edit_product': '[{user}] A schimbat {field} pentru {productName} de la {oldValue} la {newValue}',
        'log_update_details': '[{user}] A actualizat detaliile pentru {productName}',
        'log_add_location': '[{user}] A adăugat locația nouă: {locationName}',
        'log_delete_location': '[{user}] A șters locația: {locationName}',
        'log_rename_location': '[{user}] A redenumit {oldName} în {newName}',
        'log_update_comments': '[{user}] A actualizat comentariile pentru {productName}',
        'log_scan_barcode': '[{user}] A scanat codul de bare {barcode} pentru {productName}',
        'log_assign_barcode': '[{user}] A atribuit codul de bare {newValue} la {productName}',
        'log_remove_barcode': '[{user}] A eliminat codul de bare de la {productName}',
        'log_create_product': '[{user}] A creat produsul {productName} cu codul de bare {barcode}',
        'log_duplicate_product': '[{user}] A duplicat produsul {sourceProductName} ca {productName}',
        'log_unknown': '[{user}] Tip de tranzacție necunoscut: {type}',
        'log_error': 'Eroare: Înregistrare de tranzacție invalidă',
        'per_page': 'pe pagină',
        'pagination_prev': 'Înapoi',
        'pagination_next': 'Înainte',
        'pagination_page_of': 'Pagina {current} din {total}'
    }
};

// Current language variable
let currentLanguage = localStorage.getItem('language') || navigator.language.slice(0,2) || 'en';
if (!['en','ro'].includes(currentLanguage)) currentLanguage = 'en';

// Translation function - gets translated text for a key
function t(key) {
    return translations[currentLanguage][key] || key;
}

// Updates all UI elements with current language translations
function updateTranslations() {
    // Static text with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        el.textContent = t(key);
    });
    // Placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        el.placeholder = t(el.getAttribute('data-i18n-placeholder'));
    });
    // Buttons and spans with data-i18n
    document.querySelectorAll('button[data-i18n], span[data-i18n], label[data-i18n], h2[data-i18n], h3[data-i18n], p[data-i18n]').forEach(el => {
        el.textContent = t(el.getAttribute('data-i18n'));
    });
    // Table headers
    const thName = document.getElementById('thName');
    const thQuantity = document.getElementById('thQuantity');
    const thPrice = document.getElementById('thPrice');
    if (thName && thName.childNodes[0]) thName.childNodes[0].textContent = t('Name') + ' ';
    if (thQuantity && thQuantity.childNodes[0]) thQuantity.childNodes[0].textContent = t('Quantity') + ' ';
    if (thPrice && thPrice.childNodes[0]) thPrice.childNodes[0].textContent = t('Price') + ' ';
    // Main title
    const h1 = document.querySelector('h1');
    if (h1) h1.textContent = t('Inventory System');
    // Pending invoices
    const pendingInvoices = document.getElementById('pendingInvoices');
    if (pendingInvoices) {
        const h2 = pendingInvoices.querySelector('h2');
        if (h2) h2.textContent = t('Pending Invoices');
    }
    // Change history
    const historySection = document.querySelector('.history-section h2');
    if (historySection) historySection.textContent = t('Change History');
    // Add item form button
    const addItemBtn = document.querySelector('.add-item-form button');
    if (addItemBtn) addItemBtn.textContent = t('Add Item');
    
    // Update dynamic user/location lists if functions exist
    if (typeof updateUsersList === 'function') updateUsersList();
    if (typeof updateLocationsList === 'function') updateLocationsList();
}

// Populates the language select dropdown
function populateLanguageSelect() {
    const select = document.getElementById('languageSelect');
    if (!select) return;
    select.innerHTML = '';
    const languages = [
        { code: 'en', label: 'English' },
        { code: 'ro', label: 'Română' }
    ];
    languages.forEach(lang => {
        const option = document.createElement('option');
        option.value = lang.code;
        option.textContent = lang.label;
        if (lang.code === currentLanguage) option.selected = true;
        select.appendChild(option);
    });
}

// Changes the current language and updates all UI
function changeLanguage(lang) {
    if (!['en','ro'].includes(lang)) lang = 'en';
    currentLanguage = lang;
    localStorage.setItem('language', lang);
    updateTranslations();
    
    // Update other UI components if functions exist
    if (typeof updateTable === 'function') updateTable();
    if (typeof updateHistory === 'function') updateHistory();
    if (typeof renderLocationFilterButtons === 'function') renderLocationFilterButtons();
    populateLanguageSelect();
}

// Initialize localization when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    populateLanguageSelect();
    updateTranslations();
});
