(function () {
  // Ensure the idb library is available
  if (!window.idb || typeof window.idb.openDB !== 'function') {
    console.error('idb library is not loaded. Ensure the CDN script is included before js/db.js');
    return;
  }

  // Expose a global db handle
  window.db = window.db || undefined;

  // Initialize database and create object stores on upgrade
  window.initDB = async () => {
    try {
      window.db = await idb.openDB('inventoryDB', 4, {
        upgrade(db, oldVersion, newVersion, transaction) {
          console.log(`Upgrading database from version ${oldVersion} to ${newVersion}`);

          // Create object stores matching the schema in README
          if (!db.objectStoreNames.contains('products')) {
            const productStore = db.createObjectStore('products', { keyPath: 'id' });
            productStore.createIndex('name', 'name', { unique: false });
          }

          if (!db.objectStoreNames.contains('locations')) {
            const locationStore = db.createObjectStore('locations', { keyPath: 'id' });
            locationStore.createIndex('name', 'name', { unique: false });
          }

          if (!db.objectStoreNames.contains('inventory')) {
            const inventoryStore = db.createObjectStore('inventory', { keyPath: 'id', autoIncrement: false });
            inventoryStore.createIndex('productId', 'productId', { unique: false });
            inventoryStore.createIndex('locationId', 'locationId', { unique: false });
            inventoryStore.createIndex('product_location', ['productId', 'locationId'], { unique: true });
          }

          if (!db.objectStoreNames.contains('transactions')) {
            db.createObjectStore('transactions', { keyPath: 'timestamp' });
          }

          // Add floor plans store
          if (!db.objectStoreNames.contains('floorPlans')) {
            db.createObjectStore('floorPlans', { keyPath: 'locationId' });
          }

          // Add users store
          if (!db.objectStoreNames.contains('users')) {
            console.log('Creating users object store');
            db.createObjectStore('users', { keyPath: 'id' });
          }
        },
      });

      console.log('IndexedDB initialized with idb module');
      return window.db;
    } catch (error) {
      console.error('Error initializing database:', error);
      throw error;
    }
  };

  // Save entire array to a store (clear then add all items)
  window.saveToIndexedDB = async (storeName, data) => {
    try {
      const tx = window.db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);

      await store.clear();
      for (const item of data) {
        store.add(item);
      }

      await tx.done;
      console.log(`Data saved to ${storeName} successfully`);
    } catch (error) {
      console.error(`Error saving data to ${storeName}:`, error);
      throw error;
    }
  };

  // Load all records from a store
  window.loadFromIndexedDB = async (storeName) => {
    try {
      const data = await window.db.getAll(storeName);
      return data;
    } catch (error) {
      console.error(`Error loading data from ${storeName}:`, error);
      throw error;
    }
  };
})();


