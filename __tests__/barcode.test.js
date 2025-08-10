const fs = require('fs');
const path = require('path');
const vm = require('vm');

let ctx;

describe('js/barcode.js', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div>
        <div id="scannerModal" style="display:none"></div>
        <div id="scannerResult"></div>
        <div id="productResult"></div>
        <div id="video"></div>
        <input id="searchInput" />
        <div id="barcodeModal" style="display:none"></div>
        <input id="barcodeInput" />
        <div id="scanner-status"></div>
        <table><tbody><tr data-product-id="p1"></tr></tbody></table>
      </div>
    `;

    const sandbox = {
      window,
      document,
      localStorage: window.localStorage,
      navigator: window.navigator,
      alert,
      confirm,
      setTimeout,
      clearTimeout,
      console,
      products: [
      { id: 'p1', name: 'Item 1', price: 10, stock: 5, barcode: '111' },
      { id: 'p2', name: 'Item 2', price: 5, stock: 3, barcode: '' }
    ],
      addToHistory: jest.fn(() => Promise.resolve()),
      save: jest.fn(() => Promise.resolve()),
      updateTable: jest.fn()
    };
    sandbox.global = sandbox;
    sandbox.window = { ...sandbox.window, ...sandbox };
    vm.createContext(sandbox);
    vm.createContext(sandbox);
    const code = fs.readFileSync(path.join(__dirname, '..', 'js/barcode.js'), 'utf8');
    vm.runInContext(code, sandbox);
    ctx = sandbox;
  });

  test('lookupProductByBarcode highlights and logs when found', () => {
    expect(typeof ctx.lookupProductByBarcode).toBe('function');
    // jsdom element lacks scrollIntoView; stub
    const tr = document.querySelector('tr[data-product-id="p1"]');
    tr.scrollIntoView = () => {};
    ctx.lookupProductByBarcode('111');
    // should have created a history entry
    expect(ctx.addToHistory).toHaveBeenCalled();
  });

  test('saveBarcode assigns barcode and persists', async () => {
    // set current product id by opening modal
    // elements expected by openBarcodeModal
    document.body.insertAdjacentHTML('beforeend', `
      <div id="barcodeProductName"></div>
      <div id="barcodeModal" style="display:none"></div>
    `);
    ctx.openBarcodeModal('p2');
    document.getElementById('barcodeInput').value = '222';
    await ctx.saveBarcode();
    expect(ctx.products.find(p=>p.id==='p2').barcode).toBe('222');
    expect(ctx.save).toHaveBeenCalled();
    expect(ctx.updateTable).toHaveBeenCalled();
  });
});


