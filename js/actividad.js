document.addEventListener('DOMContentLoaded', function () {
  AUTH.requireAdmin();

  const wrap = document.getElementById('activityListWrap');

  function formatDateTime(timestamp) {
    return new Date(timestamp).toLocaleString('es-CO', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  }

  function rowHtml(entry) {
    const roleLabel = entry.role === 'admin' ? 'Administrador' : 'Auxiliar';
    return (
      '<tr>' +
        '<td data-label="Fecha y hora">' + formatDateTime(entry.timestamp) + '</td>' +
        '<td data-label="Usuario">' + UI.escapeHtml(entry.user) + '</td>' +
        '<td data-label="Rol"><span class="role-pill ' + entry.role + '">' + roleLabel + '</span></td>' +
        '<td data-label="Acción">' + UI.escapeHtml(entry.action) + '</td>' +
        '<td data-label="Detalle" class="desc-cell">' + UI.escapeHtml(entry.details || '—') + '</td>' +
      '</tr>'
    );
  }

  DataService.getActivityLog().then(log => {
    if (log.length === 0) {
      wrap.innerHTML =
        '<div class="empty-state"><div class="emoji">📋</div><p>Todavía no hay actividad registrada.</p></div>';
      return;
    }

    wrap.innerHTML =
      '<div class="product-table-wrap"><table class="product-table">' +
      '<thead><tr><th>Fecha y hora</th><th>Usuario</th><th>Rol</th><th>Acción</th><th>Detalle</th></tr></thead>' +
      '<tbody>' + log.map(rowHtml).join('') + '</tbody></table></div>';
  });
});
