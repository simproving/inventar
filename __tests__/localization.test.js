const fs = require('fs');
const path = require('path');
const vm = require('vm');

let ctx;

describe('js/localization.js', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div>
        <h1></h1>
        <h2 data-i18n="Pending Invoices"></h2>
        <input id="searchInput" data-i18n-placeholder="Search items..." />
        <table>
          <thead>
            <tr>
              <th id="thName"><span></span></th>
              <th id="thQuantity"><span></span></th>
              <th id="thPrice"><span></span></th>
            </tr>
          </thead>
        </table>
        <section class="history-section"><h2></h2></section>
        <div id="pendingInvoices"><h2></h2></div>
        <div class="add-item-form"><button></button></div>
        <select id="languageSelect"></select>
      </div>`;

    // ensure a clean language
    window.localStorage.clear();
    // fresh sandbox per test
    const sandbox = {
      window,
      document,
      localStorage: window.localStorage,
      navigator: window.navigator,
      alert,
      confirm,
      console,
      setTimeout,
      clearTimeout
    };
    sandbox.global = sandbox;
    sandbox.window = sandbox;
    vm.createContext(sandbox);
    const code = fs.readFileSync(path.join(__dirname, '..', 'js/localization.js'), 'utf8');
    vm.runInContext(code, sandbox);
    ctx = sandbox;
  });

  test('updateTranslations sets static texts in English by default', () => {
    // call exported global functions
    expect(typeof ctx.updateTranslations).toBe('function');
    ctx.updateTranslations();

    expect(document.querySelector('h1').textContent).toBe('Inventory System');
    expect(document.querySelector('[data-i18n="Pending Invoices"]').textContent).toBe('Pending Invoices');
    expect(document.querySelector('#thName span').textContent.trim()).toBe('Name');
    expect(document.querySelector('#thQuantity span').textContent.trim()).toBe('Quantity');
    expect(document.querySelector('#thPrice span').textContent.trim()).toBe('Price');
    expect(document.getElementById('searchInput').placeholder).toBe('Search items...');
  });

  test('changeLanguage switches to Romanian', () => {
    expect(typeof ctx.changeLanguage).toBe('function');
    ctx.changeLanguage('ro');
    expect(document.querySelector('h1').textContent).toBe('Sistem Inventar');
    expect(document.querySelector('#thName span').textContent.trim()).toBe('Nume');
    expect(document.getElementById('searchInput').placeholder).toBe('Caută produse...');
    // language is persisted
    expect(localStorage.getItem('language')).toBe('ro');
  });
});


