
# Inventory System (Offline, Browser)

An offline-first, single-page inventory manager that runs entirely in the browser. No server required. Data is stored in the browser via IndexedDB, and you can import/export JSON backups at any time.

## Highlights

- **Offline-first storage**: IndexedDB via the `idb` helper library
- **Multi-location**: Track products across multiple locations
- **Inventory history**: Append-only transactions with rebuild-from-history
- **Floor plan editor**: Visual placement of products per location using Konva
- **Barcode scanning**: ZXing-based scanner (camera permissions required)
- **Import/Export**: Backup/restore all app data as JSON
- **Users and locations**: Manage users and locations in-app
- **Search, sort, pagination**: Quickly find and navigate items
- **Internationalization**: English and Romanian UI, switchable at runtime
- **Theme**: Light/Dark toggle
- **Toasts and confirmations**: Clear feedback and safe destructive actions

## Getting Started

This is a static web app.

1. Open `index.html` in a modern browser (Chrome, Edge, Firefox, Safari).
2. Grant camera permission when using the barcode scanner.
3. Your data is stored locally in the browser. Clearing site data will reset the app.

Optional: You can use any static file server during development, but it is not required.

## UI Overview

- Top bar: Save-to-file, user select, floor plan, scanner, settings
- Search: Filter items by name
- Table: Sortable columns for name, quantity, and price; pagination controls
- Change history: Paginated list of transactions
- Modals: Floor plan, barcode assign/scan, settings (Theme, Data, Users, Locations)

## Data Model (IndexedDB)

Database name: `inventoryDB` (version 4)

- `products` (keyPath: `id`)
  - Index: `name`
  - Shape: `{ id, name, price, barcode, comments }`
- `locations` (keyPath: `id`)
  - Index: `name`
  - Shape: `{ id, name }`
- `inventory` (keyPath: `id`)
  - Indexes: `productId`, `locationId`, `product_location` (unique on `[productId, locationId]`)
  - Shape: `{ id, productId, locationId, quantity }`
- `transactions` (keyPath: `timestamp`)
  - Append-only change log
  - Used by “Rebuild from History” to regenerate products/locations/inventory
- `floorPlans` (keyPath: `locationId`)
  - Konva JSON representing shapes and placed products for a location
- `users` (keyPath: `id`)
  - Shape: `{ id, name }`

## Features in Detail

- **Save to file**: Exports a snapshot as `inventory_export_YYYY-MM-DD.json`
- **Import from JSON**: Replaces all current data after confirmation
- **Rebuild from History**: Reconstructs state from the transaction log
- **Floor plan**:
  - Zoom with mouse wheel (0.1x–3x)
  - Hold Shift to pan the canvas
  - Select, move, resize, rotate shapes; place products on the map
- **Barcode scanner**: Uses ZXing in the browser; assign barcodes to products
- **Internationalization**: Language switch in Settings (English, Română)

## Tech Stack

- HTML, CSS, vanilla JavaScript
- IndexedDB via `idb` (CDN)
- Konva (CDN) for canvas-based floor plans
- ZXing (ESM CDN) for barcode scanning
- Jest + jsdom for unit tests

## Development

No build step is required for the app itself. Open `index.html` directly or via a static file server.

### Run tests

Requires Node.js. Install dev dependencies and run:

```bash
npm install
npm test
```

The test runner is configured via `jest.config.cjs` and uses `jest-environment-jsdom`.

## Project Structure (top-level)

- `index.html`: Main SPA entry
- `style.css`: Styles for the application
- `js/`
  - `db.js`: IndexedDB initialization and helpers
  - `localization.js`: i18n (en, ro) and runtime switching
  - `floorplan.js`: Konva floor plan editor and product placement
  - `settings.js`: Export/import, rebuild-from-history, and settings actions
  - `toast.js`: Lightweight toast notifications
- `__tests__/`: Jest tests
- `package.json`: Test scripts and dev deps

## Data Safety and Privacy

- All data stays in your browser. To reset, clear site data or use Settings → Clear Database.
- Export your data regularly for backups.

## Known Limitations

- Camera access is required for barcode scanning.
- Clearing site data or using a different browser/profile will not preserve your inventory.

# Run tests
node ./node_modules/jest/bin/jest.js --config jest.config.cjs --runInBand --verbose
