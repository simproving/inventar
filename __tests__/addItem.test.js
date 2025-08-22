const fs = require('fs');
const path = require('path');
const vm = require('vm');

let ctx;

describe('addItem function', () => {
    beforeEach(() => {
        // Set up DOM elements that addItem function expects
        document.body.innerHTML = `
            <div>
                <input id="itemName" type="text" />
                <input id="itemQuantity" type="number" />
                <input id="itemPrice" type="number" />
                <input id="searchInput" type="text" />
                <div id="inventoryTable"></div>
                <div id="inventoryBody"></div>
                <div id="historyList"></div>
                <div id="sortIconName"></div>
                <div id="sortIconQuantity"></div>
                <div id="sortIconPrice"></div>
                <div class="theme-toggle-label">🌙</div>
                <input type="checkbox" id="themeCheckbox" />
                <input type="checkbox" id="settingsThemeCheckbox" />
            </div>`;

        // Mock localStorage
        const mockLocalStorage = {
            getItem: jest.fn(),
            setItem: jest.fn(),
            clear: jest.fn()
        };
        Object.defineProperty(window, 'localStorage', {
            value: mockLocalStorage,
            writable: true
        });

        // Mock alert function
        window.alert = jest.fn();

        // Fresh sandbox per test
        const sandbox = {
            window,
            document,
            localStorage: window.localStorage,
            navigator: { language: 'en' },
            alert: window.alert,
            console,
            setTimeout,
            clearTimeout,
            Date,
            Math,
            // Mock event listener methods
            addEventListener: jest.fn(),
            removeEventListener: jest.fn(),
            // Mock helper functions that addItem calls
            save: jest.fn().mockResolvedValue(),
            updateTable: jest.fn(),
            clearForm: jest.fn(),
            addToHistory: jest.fn().mockResolvedValue()
        };
        sandbox.global = sandbox;
        sandbox.window = sandbox;

        // Load localization.js first to get the t() function
        vm.createContext(sandbox);
        const localizationCode = fs.readFileSync(path.join(__dirname, '..', 'js/localization.js'), 'utf8');
        vm.runInContext(localizationCode, sandbox);

        // Load the main index.js code
        const indexCode = fs.readFileSync(path.join(__dirname, '..', 'index.js'), 'utf8');
        vm.runInContext(indexCode, sandbox);

        ctx = sandbox;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('Code parsing mode (with barcode-like codes)', () => {
        test('should parse single code and create product', async () => {
            // Set up input values
            document.getElementById('itemName').value = 'Test Item 4b1123';
            document.getElementById('itemQuantity').value = '10';
            document.getElementById('itemPrice').value = '15.50';

            // Mock the global variables
            ctx.products = [];
            ctx.inventoryItems = [];
            ctx.currentLocation = 'warehouse1';
            ctx.locationFilter = null;

            // Call addItem function
            await ctx.addItem();

            // Verify product was created
            expect(ctx.products).toHaveLength(1);
            expect(ctx.products[0]).toMatchObject({
                name: '23-11 Test Item',
                price: 15.50,
                comments: '',
                barcode: ''
            });

            // Verify inventory entry was created
            expect(ctx.inventoryItems).toHaveLength(1);
            expect(ctx.inventoryItems[0]).toMatchObject({
                productId: ctx.products[0].id,
                locationId: 'warehouse1',
                quantity: 4 // from the code '4b1123'
            });

            // Verify helper functions were called
            expect(ctx.save).toHaveBeenCalled();
            expect(ctx.updateTable).toHaveBeenCalled();
            expect(ctx.clearForm).toHaveBeenCalled();
            expect(ctx.addToHistory).toHaveBeenCalledWith({
                type: 'add_inventory',
                productId: expect.any(String),
                productName: '23-11 Test Item',
                locationId: 'warehouse1',
                quantity: 4,
                timestamp: expect.any(String)
            });
        });

        test('should parse multiple codes and create multiple products', async () => {
            document.getElementById('itemName').value = 'Test Item 4b1123 2b1224';
            document.getElementById('itemQuantity').value = '10';
            document.getElementById('itemPrice').value = '20.00';

            ctx.products = [];
            ctx.inventoryItems = [];
            ctx.currentLocation = 'warehouse1';

            await ctx.addItem();

            // Should create 2 products
            expect(ctx.products).toHaveLength(2);
            expect(ctx.products[0].name).toBe('23-11 Test Item');
            expect(ctx.products[1].name).toBe('24-12 Test Item');

            // Should create 2 inventory entries
            expect(ctx.inventoryItems).toHaveLength(2);
            expect(ctx.inventoryItems[0].quantity).toBe(4); // from '4b1123'
            expect(ctx.inventoryItems[1].quantity).toBe(2); // from '2b1224'
        });

        test('should handle various code formats', async () => {
            const testCases = [
                'Test 4b1123',      // Standard format
                'Test 4B1123',      // Uppercase B
                'Test 4B 1123',     // With space
                'Test 10 b 01 23',  // Multiple spaces
                'Test 99 b 01 26'   // Different numbers
            ];

            for (const testCase of testCases) {
                // Reset state
                ctx.products = [];
                ctx.inventoryItems = [];
                document.getElementById('itemName').value = testCase;
                document.getElementById('itemQuantity').value = '1';
                document.getElementById('itemPrice').value = '10';

                await ctx.addItem();

                expect(ctx.products).toHaveLength(1);
                expect(ctx.inventoryItems).toHaveLength(1);
            }
        });

        test('should update existing product if name matches', async () => {
            const existingProduct = {
                id: 'existing123',
                name: '23-11 Test Item',
                price: 10.00,
                comments: '',
                barcode: ''
            };

            ctx.products = [existingProduct];
            ctx.inventoryItems = [];
            ctx.currentLocation = 'warehouse1';

            document.getElementById('itemName').value = 'Test Item 4b1123';
            document.getElementById('itemQuantity').value = '5';
            document.getElementById('itemPrice').value = '15.00';

            await ctx.addItem();

            // Should not create new product
            expect(ctx.products).toHaveLength(1);
            expect(ctx.products[0]).toBe(existingProduct);

            // Should create inventory entry
            expect(ctx.inventoryItems).toHaveLength(1);
            expect(ctx.inventoryItems[0].productId).toBe('existing123');
        });

        test('should update existing inventory entry', async () => {
            const existingProduct = {
                id: 'prod123',
                name: '23-11 Test Item',
                price: 10.00,
                comments: '',
                barcode: ''
            };
            const existingInventory = {
                id: 'inv123',
                productId: 'prod123',
                locationId: 'warehouse1',
                quantity: 5
            };

            ctx.products = [existingProduct];
            ctx.inventoryItems = [existingInventory];
            ctx.currentLocation = 'warehouse1';

            document.getElementById('itemName').value = 'Test Item 4b1123';
            document.getElementById('itemQuantity').value = '3';
            document.getElementById('itemPrice').value = '12.00';

            await ctx.addItem();

            // Should not create new inventory entry
            expect(ctx.inventoryItems).toHaveLength(1);
            expect(ctx.inventoryItems[0]).toBe(existingInventory);
            expect(ctx.inventoryItems[0].quantity).toBe(9); // 5 + 4 (from code)

            // Verify update history was logged
            expect(ctx.addToHistory).toHaveBeenCalledWith({
                type: 'update_quantity',
                productId: 'prod123',
                productName: '23-11 Test Item',
                locationId: 'warehouse1',
                oldQuantity: 5,
                newQuantity: 9,
                timestamp: expect.any(String)
            });
        });

        test('should handle invalid price (NaN)', async () => {
            ctx.products = [];
            ctx.inventoryItems = [];
            ctx.currentLocation = 'warehouse1';

            document.getElementById('itemName').value = 'Test Item 4b1123';
            document.getElementById('itemQuantity').value = '5';
            document.getElementById('itemPrice').value = 'invalid';

            await ctx.addItem();

            // Should set price to 0
            expect(ctx.products[0].price).toBe(0);
        });
    });

    describe('Standard format mode (YY-MM prefix)', () => {
        test('should create product with YY-MM format', async () => {
            ctx.products = [];
            ctx.inventoryItems = [];
            ctx.currentLocation = 'warehouse1';

            document.getElementById('itemName').value = '25-01 Test Product';
            document.getElementById('itemQuantity').value = '10';
            document.getElementById('itemPrice').value = '25.99';

            await ctx.addItem();

            expect(ctx.products).toHaveLength(1);
            expect(ctx.products[0].name).toBe('25-01 Test Product');
            expect(ctx.products[0].price).toBe(25.99);

            expect(ctx.inventoryItems).toHaveLength(1);
            expect(ctx.inventoryItems[0].quantity).toBe(10);
        });

        test('should reject name without YY-MM prefix', async () => {
            ctx.products = [];
            ctx.inventoryItems = [];
            ctx.currentLocation = 'warehouse1';

            document.getElementById('itemName').value = 'Test Product Without Prefix';
            document.getElementById('itemQuantity').value = '5';
            document.getElementById('itemPrice').value = '10.00';

            await ctx.addItem();

            // Should show alert and not create product
            expect(window.alert).toHaveBeenCalledWith('error_name_prefix');
            expect(ctx.products).toHaveLength(0);
            expect(ctx.inventoryItems).toHaveLength(0);
        });

        test('should handle invalid inputs', async () => {
            ctx.products = [];
            ctx.inventoryItems = [];

            document.getElementById('itemName').value = ''; // empty name
            document.getElementById('itemQuantity').value = 'invalid'; // invalid quantity
            document.getElementById('itemPrice').value = 'invalid'; // invalid price

            await ctx.addItem();

            expect(window.alert).toHaveBeenCalledWith('Please fill all fields with valid values');
            expect(ctx.products).toHaveLength(0);
        });

        test('should handle negative values', async () => {
            ctx.products = [];
            ctx.inventoryItems = [];

            document.getElementById('itemName').value = '25-01 Test Product';
            document.getElementById('itemQuantity').value = '-5'; // negative quantity
            document.getElementById('itemPrice').value = '-10.00'; // negative price

            await ctx.addItem();

            expect(window.alert).toHaveBeenCalledWith('Please fill all fields with valid values');
            expect(ctx.products).toHaveLength(0);
        });
    });

    describe('Edge cases', () => {
        test('should use locationFilter when set', async () => {
            ctx.products = [];
            ctx.inventoryItems = [];
            ctx.currentLocation = 'warehouse1';
            ctx.locationFilter = 'filteredLocation';

            document.getElementById('itemName').value = 'Test Item 4b1123';
            document.getElementById('itemQuantity').value = '1';
            document.getElementById('itemPrice').value = '10.00';

            await ctx.addItem();

            expect(ctx.inventoryItems[0].locationId).toBe('filteredLocation');
        });

        test('should handle empty or whitespace-only name', async () => {
            ctx.products = [];
            ctx.inventoryItems = [];

            document.getElementById('itemName').value = '   '; // whitespace only
            document.getElementById('itemQuantity').value = '5';
            document.getElementById('itemPrice').value = '10.00';

            await ctx.addItem();

            expect(window.alert).toHaveBeenCalledWith('Please fill all fields with valid values');
        });

        test('should trim whitespace from name', async () => {
            ctx.products = [];
            ctx.inventoryItems = [];
            ctx.currentLocation = 'warehouse1';

            document.getElementById('itemName').value = '  25-01 Test Product  ';
            document.getElementById('itemQuantity').value = '5';
            document.getElementById('itemPrice').value = '10.00';

            await ctx.addItem();

            expect(ctx.products[0].name).toBe('25-01 Test Product');
        });
    });
});
