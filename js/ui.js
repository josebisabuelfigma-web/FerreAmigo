/**
 * ui.js — Componentes de interfaz compartidos entre todas las páginas:
 * footer, modales, toast y utilidades varias.
 */

const UI = (function () {
  const WHATSAPP_NUMBER = '573193034610';

  function whatsappLink(message) {
    const text = message ? '?text=' + encodeURIComponent(message) : '';
    return 'https://wa.me/' + WHATSAPP_NUMBER + text;
  }

  function formatCurrency(value) {
    const n = Number(value) || 0;
    return n.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /* ------------------------------ Footer ------------------------------ */

  function injectFooter() {
    if (document.querySelector('.site-footer')) return;
    const footer = document.createElement('footer');
    footer.className = 'site-footer';
    footer.innerHTML = 'Desarrollado por <a class="dev-link" id="devLink">NOVA STUDIO — Contáctanos</a>';
    document.body.appendChild(footer);
    document.getElementById('devLink').addEventListener('click', function () {
      window.open(whatsappLink('Hola NOVA STUDIO, quiero información sobre mi página web.'), '_blank');
    });
  }

  /* ------------------------------ Toast ------------------------------ */

  let toastTimer = null;
  function showToast(message, type) {
    let toast = document.querySelector('.toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'toast';
      document.body.appendChild(toast);
    }
    toast.className = 'toast' + (type ? ' toast-' + type : '');
    toast.textContent = message;
    requestAnimationFrame(() => toast.classList.add('show'));
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2800);
  }

  /* ------------------------------ Modal genérico ------------------------------ */

  function openModal(innerHtml, options) {
    options = options || {};
    closeModal();
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'activeModal';
    overlay.innerHTML = '<div class="modal-box">' + innerHtml + '</div>';
    document.body.appendChild(overlay);

    if (options.closeOnOverlay !== false) {
      overlay.addEventListener('click', function (e) {
        if (e.target === overlay) closeModal();
      });
    }
    requestAnimationFrame(() => overlay.classList.add('open'));
    return overlay;
  }

  function closeModal() {
    const existing = document.getElementById('activeModal');
    if (existing) existing.remove();
  }

  /* ------------------------------ Módulo bloqueado ------------------------------ */

  function triggerLockedModule(cardEl, moduleName) {
    const lockIcon = cardEl.querySelector('.module-card__badge-lock');
    if (lockIcon) {
      lockIcon.classList.remove('shake-lock');
      void lockIcon.offsetWidth; // reinicia la animación
      lockIcon.classList.add('shake-lock');
    }

    openModal(
      '<div class="modal-lock-icon">🔒</div>' +
      '<h2 style="justify-content:center;">Módulo no disponible</h2>' +
      '<p class="modal-subtitle" style="text-align:center;">' +
      '¿Quieres adquirir el módulo de <strong>' + escapeHtml(moduleName) + '</strong>? Contacta al administrador.' +
      '</p>' +
      '<div class="modal-actions" style="justify-content:center;">' +
      '<button class="btn btn-secondary" id="lockCloseBtn">Cerrar</button>' +
      '<a class="btn btn-success" id="lockWaBtn" target="_blank" rel="noopener">Contactar por WhatsApp</a>' +
      '</div>'
    );
    document.getElementById('lockCloseBtn').addEventListener('click', closeModal);
    document.getElementById('lockWaBtn').href = whatsappLink(
      'Hola, quiero adquirir una de sus soluciones de software (módulo de ' + moduleName + ').'
    );
  }

  /* ------------------------------ Soporte ------------------------------ */

  function supportLink() {
    return whatsappLink('Hola, necesito soporte para el producto FerreAmigo.');
  }

  /* ------------------------------ Header: sesión y volver ------------------------------ */

  function wireHeaderCommon() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.addEventListener('click', () => AUTH.logout());

    // Navegación "Volver" siempre hacia la página padre definida en data-fallback,
    // en vez de history.back(): así nunca saca al usuario fuera de la app aunque
    // haya recargado la página o entrado por URL directa.
    const backBtn = document.getElementById('backBtn');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        const fallback = backBtn.getAttribute('data-fallback');
        window.location.href = fallback || 'modulos.html';
      });
    }

    const userPill = document.getElementById('userPill');
    if (userPill && AUTH.getSession()) {
      userPill.textContent = 'Usuario: ' + AUTH.getSession().user;
    }
  }

  function init() {
    injectFooter();
    wireHeaderCommon();
  }

  return {
    whatsappLink, formatCurrency, escapeHtml,
    showToast, openModal, closeModal,
    triggerLockedModule, supportLink, init
  };
})();

document.addEventListener('DOMContentLoaded', UI.init);
