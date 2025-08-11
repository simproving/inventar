"use strict";

// Settings-related functionality extracted from index.html

// Theme toggle from settings
function toggleThemeFromSettings() {
  toggleTheme();
}

// Export/Import Functions
async function exportData() {
  try {
    const exportData = {
      products: (await loadFromIndexedDB('products')) || [],
      locations: (await loadFromIndexedDB('locations')) || [],
      inventory: (await loadFromIndexedDB('inventory')) || [],
      transactions: (await loadFromIndexedDB('transactions')) || [],
      users: (await loadFromIndexedDB('users')) || [],
      floorPlans: (await loadFromIndexedDB('floorPlans')) || [],
      exportDate: new Date().toISOString(),
      appVersion: '1.0.0',
    };

    const jsonData = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const date = new Date();
    const dateStr = date.toISOString().split('T')[0];

    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory_export_${dateStr}.json`;
    document.body.appendChild(a);
    a.click();

    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);

    console.log('Data exported successfully');
  } catch (error) {
    console.error('Error exporting data:', error);
    alert('Error exporting data: ' + error.message);
  }
}

function importData() {
  const importFile = document.getElementById('settingsImportFile');
  if (importFile) {
    importFile.click();
  } else {
    console.error('Import file input not found');
    alert('Error: Import functionality not available');
  }
}

async function handleImportFile(event) {
  try {
    const file = event.target.files[0];
    if (!file) return;

    if (!confirm('Importing data will replace all current data. Continue?')) {
      event.target.value = null;
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const importDataObj = JSON.parse(e.target.result);

        if (!importDataObj.products || !importDataObj.locations || !importDataObj.inventory) {
          throw new Error('Invalid import file format');
        }

        if (importDataObj.products && Array.isArray(importDataObj.products)) {
          await saveToIndexedDB('products', importDataObj.products);
          products = importDataObj.products;
        }
        if (importDataObj.locations && Array.isArray(importDataObj.locations)) {
          await saveToIndexedDB('locations', importDataObj.locations);
          locations = importDataObj.locations;
        }
        if (importDataObj.inventory && Array.isArray(importDataObj.inventory)) {
          await saveToIndexedDB('inventory', importDataObj.inventory);
          inventoryItems = importDataObj.inventory;
        }
        if (importDataObj.transactions && Array.isArray(importDataObj.transactions)) {
          await saveToIndexedDB('transactions', importDataObj.transactions);
          transactions = importDataObj.transactions;
        }
        if (importDataObj.users && Array.isArray(importDataObj.users)) {
          await saveToIndexedDB('users', importDataObj.users);
          users = importDataObj.users;
        }
        if (importDataObj.floorPlans && Array.isArray(importDataObj.floorPlans)) {
          const tx = db.transaction('floorPlans', 'readwrite');
          await tx.objectStore('floorPlans').clear();
          await tx.done;
          for (const floorPlan of importDataObj.floorPlans) {
            await db.put('floorPlans', floorPlan);
          }
        }

        if (locations.length > 0) {
          currentLocation = locations[0].id;
          locationFilter = locations[0].id;
        }

        await loadUsers();
        updateLocationSelect();
        updateTable();
        updateHistory();

        console.log('Data imported successfully');
        alert('Data imported successfully!');

        closeSettings();
      } catch (error) {
        console.error('Error parsing import file:', error);
        alert('Error importing data: ' + error.message);
      }
    };

    reader.onerror = () => {
      console.error('Error reading file');
      alert('Error reading file');
    };

    reader.readAsText(file);
    event.target.value = null;
  } catch (error) {
    console.error('Error handling import file:', error);
    alert('Error handling import file: ' + error.message);
  }
}

// Rebuild from History
function confirmRebuildFromHistory() {
  const proceed = confirm(
    t('Are you sure you want to rebuild all data from the transaction history? This will overwrite current products, inventory and locations.')
  );
  if (!proceed) return;
  rebuildFromHistory();
}

async function rebuildFromHistory() {
  try {
    const storedTransactions = await loadFromIndexedDB('transactions');
    const history = Array.isArray(storedTransactions)
      ? storedTransactions
      : Array.isArray(transactions)
      ? transactions
      : [];

    products = [];
    locations = [];
    inventoryItems = [];

    const productById = new Map();
    const locationById = new Map();

    function ensureDefaultLocation() {
      if (locations.length === 0) {
        const def = { id: '1', name: 'Location 1' };
        locations.push(def);
        locationById.set(def.id, def);
      }
    }

    const sorted = [...history].sort(
      (a, b) => new Date(a.timestamp || 0) - new Date(b.timestamp || 0)
    );

    for (const tx of sorted) {
      switch (tx.type) {
        case 'create_product': {
          if (!tx.productId) break;
          if (!productById.has(tx.productId)) {
            const prod = {
              id: tx.productId,
              name: tx.productName || `Product ${tx.productId}`,
              price: typeof tx.price === 'number' ? tx.price : 0,
              comments: '',
              barcode: tx.barcode || '',
            };
            products.push(prod);
            productById.set(prod.id, prod);
          }
          break;
        }
        case 'edit_product': {
          const prod = tx.productId ? productById.get(tx.productId) || null : null;
          if (!prod) break;
          if (tx.field === 'name' && typeof tx.newValue === 'string') prod.name = tx.newValue;
          if (tx.field === 'price' && typeof tx.newValue === 'number') prod.price = tx.newValue;
          break;
        }
        case 'update_comments': {
          const prod = tx.productId ? productById.get(tx.productId) || null : null;
          if (!prod) break;
          if (typeof tx.newValue === 'string') prod.comments = tx.newValue;
          break;
        }
        case 'assign_barcode': {
          const prod = tx.productId ? productById.get(tx.productId) || null : null;
          if (!prod) break;
          if (typeof tx.newValue === 'string') prod.barcode = tx.newValue;
          break;
        }
        case 'remove_barcode': {
          const prod = tx.productId ? productById.get(tx.productId) || null : null;
          if (!prod) break;
          prod.barcode = '';
          break;
        }
        case 'delete_product': {
          if (!tx.productId) break;
          products = products.filter((p) => p.id !== tx.productId);
          productById.delete(tx.productId);
          inventoryItems = inventoryItems.filter((item) => item.productId !== tx.productId);
          break;
        }
        case 'add_location': {
          if (tx.location && tx.location.id) {
            const loc = {
              id: String(tx.location.id),
              name: tx.location.name || `Location ${locations.length + 1}`,
            };
            if (!locationById.has(loc.id)) {
              locations.push(loc);
              locationById.set(loc.id, loc);
            }
          }
          break;
        }
        case 'rename_location': {
          const locId = tx.locationId ? String(tx.locationId) : null;
          if (locId && locationById.has(locId)) {
            locationById.get(locId).name = tx.newName || locationById.get(locId).name;
          }
          break;
        }
        case 'delete_location': {
          if (tx.location && tx.location.id) {
            const id = String(tx.location.id);
            locations = locations.filter((l) => l.id !== id);
            locationById.delete(id);
            inventoryItems = inventoryItems.filter((item) => item.locationId !== id);
          }
          break;
        }
        case 'add_inventory': {
          ensureDefaultLocation();
          const productId = tx.productId;
          const locationId = tx.locationId ? String(tx.locationId) : locations[0]?.id || '1';
          if (!productId) break;
          if (!productById.has(productId)) {
            const prod = {
              id: productId,
              name: tx.productName || `Product ${productId}`,
              price: 0,
              comments: '',
              barcode: '',
            };
            products.push(prod);
            productById.set(prod.id, prod);
          }
          if (!locationById.has(locationId)) {
            const loc = { id: locationId, name: `Location ${locations.length + 1}` };
            locations.push(loc);
            locationById.set(loc.id, loc);
          }
          const quantityToAdd = Number(tx.quantity) || 0;
          if (quantityToAdd <= 0) break;
          let inv = inventoryItems.find(
            (i) => i.productId === productId && i.locationId === locationId
          );
          if (inv) {
            inv.quantity += quantityToAdd;
          } else {
            inv = {
              id: Date.now().toString() + Math.random().toString(36).slice(2, 7),
              productId,
              locationId,
              quantity: quantityToAdd,
            };
            inventoryItems.push(inv);
          }
          break;
        }
        case 'update_quantity': {
          ensureDefaultLocation();
          const productId = tx.productId;
          const locationId = tx.locationId ? String(tx.locationId) : locations[0]?.id || '1';
          if (!productId) break;
          if (!productById.has(productId)) {
            const prod = {
              id: productId,
              name: tx.productName || `Product ${productId}`,
              price: 0,
              comments: '',
              barcode: '',
            };
            products.push(prod);
            productById.set(prod.id, prod);
          }
          if (!locationById.has(locationId)) {
            const loc = { id: locationId, name: `Location ${locations.length + 1}` };
            locations.push(loc);
            locationById.set(loc.id, loc);
          }
          const newQuantity = typeof tx.newQuantity === 'number' ? tx.newQuantity : null;
          if (newQuantity === null) break;
          let inv = inventoryItems.find(
            (i) => i.productId === productId && i.locationId === locationId
          );
          if (inv) {
            inv.quantity = newQuantity;
            if (inv.quantity <= 0) {
              inventoryItems = inventoryItems.filter(
                (i) => !(i.productId === productId && i.locationId === locationId)
              );
            }
          } else if (newQuantity > 0) {
            inv = {
              id: Date.now().toString() + Math.random().toString(36).slice(2, 7),
              productId,
              locationId,
              quantity: newQuantity,
            };
            inventoryItems.push(inv);
          }
          break;
        }
        case 'delete_inventory': {
          const productId = tx.productId;
          const locationId = tx.locationId ? String(tx.locationId) : null;
          if (!productId) break;
          if (locationId) {
            inventoryItems = inventoryItems.filter(
              (i) => !(i.productId === productId && i.locationId === locationId)
            );
          } else {
            inventoryItems = inventoryItems.filter((i) => i.productId !== productId);
          }
          break;
        }
        default:
          break;
      }
    }

    await saveToIndexedDB('products', products);
    await saveToIndexedDB('locations', locations);
    await saveToIndexedDB('inventory', inventoryItems);

    if (locations.length > 0) {
      currentLocation = locations[0].id;
      locationFilter = locations[0].id;
    } else {
      currentLocation = '';
      locationFilter = null;
    }

    await loadUsers();
    updateLocationSelect();
    updateTable();
    updateHistory();

    alert(t('Rebuild complete'));
  } catch (e) {
    console.error('Rebuild error:', e);
    alert(t('Error rebuilding from history') + ': ' + (e && e.message ? e.message : e));
  }
}

// Add ESC key support for settings modal: only close, never open
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    const settingsModal = document.getElementById('settingsModal');
    const floorPlanModal = document.getElementById('floorPlanModal');
    const isFloorPlanOpen = floorPlanModal && floorPlanModal.style.display === 'block';

    // If floor plan is open, let its handler manage ESC
    if (isFloorPlanOpen) return;

    if (settingsModal && settingsModal.style.display === 'block') {
      event.preventDefault();
      event.stopPropagation();
      closeSettings();
    }
  }
});

// Settings Functions
function openSettings() {
  const modal = document.getElementById('settingsModal');
  modal.style.display = 'block';

  const themeCheckbox = document.getElementById('settingsThemeCheckbox');
  if (themeCheckbox) themeCheckbox.checked = (typeof currentTheme !== 'undefined' ? currentTheme : 'light') === 'dark';

  updateUsersList();
  updateLocationsList();

  window.addEventListener('click', closeSettingsOnClickOutside);
}

function closeSettings() {
  const modal = document.getElementById('settingsModal');
  modal.style.display = 'none';
  window.removeEventListener('click', closeSettingsOnClickOutside);
}

function closeSettingsOnClickOutside(event) {
  const modal = document.getElementById('settingsModal');
  const content = document.querySelector('.settings-content');
  if (event.target === modal) {
    closeSettings();
  }
}

function switchSettingsTab(tabName) {
  document.querySelectorAll('.settings-panel').forEach((panel) => {
    panel.classList.remove('active');
  });
  document.querySelectorAll('.settings-tab').forEach((tab) => {
    tab.classList.remove('active');
  });
  const panel = document.getElementById(tabName + 'Settings');
  if (panel) panel.classList.add('active');
  const tabButton = document.querySelector(
    `.settings-tab[onclick="switchSettingsTab('${tabName}')"]`
  );
  if (tabButton) tabButton.classList.add('active');
}

function updateUsersList() {
  const usersList = document.getElementById('usersList');
  if (!usersList) return;
  usersList.innerHTML = '';
  users.forEach((user) => {
    const listItem = document.createElement('div');
    listItem.className = 'settings-list-item';
    const isCurrentUser = user.name === currentUser;
    listItem.innerHTML = `
                    <span>${user.name}${
                      isCurrentUser
                        ? ' <span data-i18n="(Current)">(Current)</span>'
                        : ''
                    }</span>
                    <div class="item-actions">
                        <button onclick="renameUserFromSettings('${user.id}')" data-i18n="Rename">Rename</button>
                        ${!isCurrentUser ? `<button onclick="deleteUserFromSettings('${user.id}')" class="danger-btn" data-i18n="Delete">Delete</button>` : ''}
                    </div>
                `;
    usersList.appendChild(listItem);
  });
}

function updateLocationsList() {
  const locationsList = document.getElementById('locationsList');
  if (!locationsList) return;
  locationsList.innerHTML = '';
  locations.forEach((location) => {
    const listItem = document.createElement('div');
    listItem.className = 'settings-list-item';
    const isCurrentLocation = location.id === currentLocation;
    listItem.innerHTML = `
                    <span>${location.name}${
                      isCurrentLocation
                        ? ' <span data-i18n="(Current)">(Current)</span>'
                        : ''
                    }</span>
                    <div class="item-actions">
                        <button onclick="renameLocationFromSettings('${location.id}')" data-i18n="Rename">Rename</button>
                        ${!isCurrentLocation ? `<button onclick="deleteLocationFromSettings('${location.id}')" class="danger-btn" data-i18n="Delete">Delete</button>` : ''}
                    </div>
                `;
    locationsList.appendChild(listItem);
  });
}

async function addUserFromSettings() {
  const nameInput = document.getElementById('newUserName');
  const newName = nameInput.value.trim();
  if (!newName) {
    alert('Please enter a user name');
    return;
  }
  if (users.some((user) => user.name === newName)) {
    alert('A user with this name already exists');
    return;
  }
  const newUser = { id: 'user-' + Date.now(), name: newName };
  users.push(newUser);
  await saveToIndexedDB('users', users);
  updateUsersList();
  nameInput.value = '';
  if (!locationFilter && locations.length > 0) {
    locationFilter = currentLocation || locations[0].id;
  }
  await loadUsers();
}

async function renameUserFromSettings(userId) {
  const user = users.find((u) => u.id === userId);
  if (!user) return;
  const newName = prompt('Enter new name for ' + user.name + ':', user.name);
  if (newName && newName.trim() !== '') {
    if (users.some((u) => u.id !== userId && u.name === newName)) {
      alert('A user with this name already exists');
      return;
    }
    const oldName = user.name;
    user.name = newName;
    if (user.id === currentUserId) {
      currentUser = newName;
    }
    updateUserInHistory(oldName, newName);
    await saveToIndexedDB('users', users);
    updateUsersList();
    if (!locationFilter && locations.length > 0) {
      locationFilter = currentLocation || locations[0].id;
    }
    await loadUsers();
  }
}

async function deleteUserFromSettings(userId) {
  const user = users.find((u) => u.id === userId);
  if (!user) return;
  if (users.length <= 1) {
    alert('Cannot delete the last user.');
    return;
  }
  if (confirm('Are you sure you want to delete user: ' + user.name + '?')) {
    users = users.filter((u) => u.id !== userId);
    if (userId === currentUserId) {
      currentUser = users[0].name;
      currentUserId = users[0].id;
    }
    if (!locationFilter && locations.length > 0) {
      locationFilter = currentLocation || locations[0].id;
    }
    await saveToIndexedDB('users', users);
    updateUsersList();
    if (!locationFilter && locations.length > 0) {
      locationFilter = currentLocation || locations[0].id;
    }
    await loadUsers();
  }
}

async function addLocationFromSettings() {
  const nameInput = document.getElementById('newLocationName');
  const newName = nameInput.value.trim();
  if (!newName) {
    alert('Please enter a location name');
    return;
  }
  if (locations.some((loc) => loc.name === newName)) {
    alert('A location with this name already exists');
    return;
  }
  const newLocationId = String(Date.now());
  const newLocation = { id: newLocationId, name: newName };
  locations.push(newLocation);
  if (locations.length === 1) {
    currentLocation = newLocationId;
    locationFilter = newLocationId;
  }
  await saveToIndexedDB('locations', locations);
  updateLocationsList();
  nameInput.value = '';
  updateLocationSelect();
  renderLocationFilterButtons();
  updateHistory();
}

async function renameLocationFromSettings(locationId) {
  const location = locations.find((loc) => loc.id === locationId);
  if (!location) return;
  const newName = prompt('Enter new name for ' + location.name + ':', location.name);
  if (newName && newName.trim() !== '') {
    if (locations.some((loc) => loc.id !== locationId && loc.name === newName)) {
      alert('A location with this name already exists');
      return;
    }
    const oldName = location.name;
    location.name = newName;
    await addToHistory({
      type: 'rename_location',
      locationId: locationId,
      oldName: oldName,
      newName: newName,
      timestamp: new Date().toISOString(),
    });
    await saveToIndexedDB('locations', locations);
    updateLocationsList();
    updateLocationSelect();
    renderLocationFilterButtons();
    updateHistory();
  }
}

async function deleteLocationFromSettings(locationId) {
  const location = locations.find((loc) => loc.id === locationId);
  if (!location) return;
  if (locations.length <= 1) {
    alert('Cannot delete the last location.');
    return;
  }
  if (
    confirm(
      'Are you sure you want to delete location: ' +
        location.name +
        '? All inventory items in this location will be deleted.'
    )
  ) {
    inventoryItems = inventoryItems.filter((item) => item.locationId !== locationId);
    locations = locations.filter((loc) => loc.id !== locationId);
    if (locationId === currentLocation) {
      currentLocation = locations[0].id;
      locationFilter = locations[0].id;
    }
    await addToHistory({
      type: 'delete_location',
      location: location,
      timestamp: new Date().toISOString(),
    });
    await saveToIndexedDB('locations', locations);
    await saveToIndexedDB('inventory', inventoryItems);
    updateLocationsList();
    renderLocationFilterButtons();
    updateTable();
    updateHistory();
  }
}

async function confirmClearData() {
  if (confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
    if (confirm('FINAL WARNING: All your data will be permanently deleted. Continue?')) {
      try {
        await db.clear('products');
        await db.clear('locations');
        await db.clear('inventory');
        await db.clear('transactions');
        await db.clear('floorPlans');
        products = [];
        locations = [{ id: '1', name: 'Location 1' }];
        inventoryItems = [];
        transactions = [];
        currentLocation = '1';
        locationFilter = '1';
        await saveToIndexedDB('locations', locations);
        updateLocationSelect();
        updateTable();
        updateHistory();
        alert('All data has been cleared. The application has been reset to default settings.');
      } catch (error) {
        console.error('Error clearing data:', error);
        alert('Error clearing data: ' + error.message);
      }
    }
  }
}