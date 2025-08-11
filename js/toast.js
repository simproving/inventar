"use strict";

(function () {
  function ensureToastContainer() {
    let container = document.getElementById('toastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toastContainer';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    return container;
  }

  function showToast(message, type = 'info', duration = 2500) {
    const container = ensureToastContainer();
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    // Animate in
    requestAnimationFrame(() => {
      toast.classList.add('show');
    });

    // Auto-remove after duration
    const remove = () => {
      toast.classList.remove('show');
      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 200);
    };

    const timeoutId = setTimeout(remove, duration);

    // Allow manual dismiss on click
    toast.addEventListener('click', () => {
      clearTimeout(timeoutId);
      remove();
    });
  }

  // Expose globally
  window.showToast = showToast;
})();


