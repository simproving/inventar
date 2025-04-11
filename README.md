
# Inventory Management System - Project Requirements & Features

## Project Overview
The application should provide a comprehensive solution for tracking products across multiple locations, managing stock levels, and recording inventory changes over time.

## Core Features

### Product Management
1. Add new products with name, price, and initial quantity
2. Edit existing product details (name, price)
3. Delete products with confirmation dialog
4. Support for product search functionality
5. Optional support for product comments

### Location Management
1. Create locations with custom or default names
2. Rename existing locations
3. Delete locations with appropriate safeguards
4. Visual interface showing all available locations

### Inventory Tracking
1. Display total quantity of each product across all locations
2. Track product quantities per location
3. Increment/decrement quantities with intuitive controls
4. Prevent negative quantities (disable decrement when at zero)
5. Support for quick quantity changes with debounced updates

### User Interface
1. Clean, responsive dashboard layout
3. Tabular view of inventory with sorting capabilities
6. Confirmation dialogs for destructive actions
7. Toast notifications for action feedback

### Database & Storage
1. IndexedDB implementation for offline capability
2. Data structure supporting:
   - Products (id, name, price, barcode, comments)
   - Locations (id, name)
   - Inventory items (id, productId, locationId, quantity)
   - Transaction history
   - Users (id, name)
   - Floorplan

3. CRUD operations for all entity types
4. Data integrity when updating related records

## Technical Requirements

### Data Layer
1. IndexedDB for persistent storage
4. Error handling for database operations
5. Loading state management

### Data Integrity
1. Ensure product updates cascade across related inventory items
2. Maintain consistent product information across locations
3. Prevent data loss during location deletion
4. Transaction history recording for inventory changes

### User Experience
1. Fast initial loading time
2. Responsive design for various screen sizes
3. Intuitive UI with clear action buttons
4. Helpful error messages
5. confirmation for destructive actions
6. Search functionality for larger inventories

## Implementation Details

### Database Schema
1. Products table (id, name, price, optional: comments)
2. Locations table (id, name)
3. Inventory table (id, productId, locationId, quantity)
4. Transaction table (for tracking changes)
5. Users table (id, name)

## Optional Extensions
1. Import/export functionality for inventory data
2. Barcode scanning support
3. User authentication and role-based permissions
4. Advanced reporting and analytics
5. Low stock alerts/notifications
6. Mobile-optimized views
7. Multi-language support
8. Dark/light theme toggle
9. Customizable dashboard widgets

This inventory management system should prioritize usability, performance, and data integrity, while maintaining a clean and modern user interface. The offline-first approach using IndexedDB ensures the application remains functional without an internet connection.


WebRTC communication
1. Device A (Offerer) creates a WebRTC offer and ICE candidates, encodes them in a QR code.

2. Device B (Answerer) scans the QR, sets remote description, creates an answer and its own ICE candidates, and shows its own QR.

3. Device A scans the answer QR to complete the handshake.

4. Once both ends set the descriptions and ICE candidates, they connect directly — no servers needed!

