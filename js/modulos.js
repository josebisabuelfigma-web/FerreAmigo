document.addEventListener('DOMContentLoaded', function () {
  AUTH.requireAuth();

  document.getElementById('supportBtn').href = UI.supportLink();

  function wireNavigableCard(id, targetUrl) {
    const el = document.getElementById(id);
    el.addEventListener('click', () => window.location.href = targetUrl);
    el.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') window.location.href = targetUrl;
    });
  }

  wireNavigableCard('cardCatalogo', 'catalogo.html');
  wireNavigableCard('cardVentas', 'ventas.html');
  wireNavigableCard('cardFacturas', 'facturas.html');

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
