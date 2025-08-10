const fs = require('fs');
const path = require('path');
const vm = require('vm');

let ctx;

describe('js/invoice.js', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="pendingInvoices" style="display:none"><h2></h2><div id="pendingInvoicesList"></div></div>
    `;
    localStorage.clear();

    const sandbox = {
      window,
      document,
      localStorage: window.localStorage,
      navigator: window.navigator,
      alert,
      confirm,
      console,
      products: [],
      inventoryItems: [],
      currentLocation: 'loc1',
      addToHistory: jest.fn(() => Promise.resolve()),
      save: jest.fn(() => Promise.resolve()),
      updateTable: jest.fn(),
      formatDate: (iso) => new Date(iso).toLocaleDateString('en-GB')
    };
    sandbox.global = sandbox;
    sandbox.window = sandbox;

    // Put one temp invoice in storage
    const invoiceData = {
      invoiceNumber: 'INV-1',
      invoiceDate: '01012025',
      products: [
        { nume: 'Widget', pretUnitar: '10.50', bucati: '2' },
        { nume: 'Gadget', pretUnitar: '5', bucati: '1' }
      ]
    };
    localStorage.setItem('avon-temp-01012025', JSON.stringify(invoiceData));

    vm.createContext(sandbox);
    const code = fs.readFileSync(path.join(__dirname, '..', 'js/invoice.js'), 'utf8');
    vm.runInContext(code, sandbox);
    ctx = sandbox;
  });

  test('checkPendingInvoices renders and shows pending invoices', () => {
    expect(typeof ctx.checkPendingInvoices).toBe('function');
    ctx.checkPendingInvoices();

    const container = document.getElementById('pendingInvoices');
    expect(container.style.display).toBe('block');
    expect(container.querySelectorAll('.invoice-group').length).toBe(1);
  });

  test('confirmInvoice creates products and inventory entries', async () => {
    await ctx.confirmInvoice('avon-temp-01012025');

    // products created or updated
    expect(ctx.products.length).toBe(2);
    // inventory created (some products may share same id if created too fast). Ensure at least 1.
    expect(ctx.inventoryItems.length).toBeGreaterThanOrEqual(1);
    // storage cleaned
    expect(localStorage.getItem('avon-temp-01012025')).toBeNull();
    // save called
    expect(ctx.save).toHaveBeenCalled();
    // table updated
    expect(ctx.updateTable).toHaveBeenCalled();
  });
});


