document.addEventListener('DOMContentLoaded', function () {
  AUTH.requireAuth();

  document.getElementById('supportBtn').href = UI.supportLink();

  document.getElementById('cardCatalogo').addEventListener('click', function () {
    window.location.href = 'catalogo.html';
  });
  document.getElementById('cardCatalogo').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') window.location.href = 'catalogo.html';
  });

  const lockedCards = [
    { el: document.getElementById('cardVentas'), name: 'Ventas y Gastos' },
    { el: document.getElementById('cardFacturas'), name: 'Facturas de Proveedores' }
  ];

  lockedCards.forEach(({ el, name }) => {
    el.addEventListener('click', () => UI.triggerLockedModule(el, name));
    el.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') UI.triggerLockedModule(el, name);
    });
  });

  // El registro de actividad solo lo ve el perfil administrador.
  const cardActividad = document.getElementById('cardActividad');
  if (AUTH.isAdmin()) {
    cardActividad.classList.remove('hidden');
    cardActividad.addEventListener('click', () => window.location.href = 'actividad.html');
    cardActividad.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') window.location.href = 'actividad.html';
    });
  }
});
