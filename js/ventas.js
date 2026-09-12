document.addEventListener('DOMContentLoaded', function () {
  AUTH.requireAuth();

  const movementsWrap = document.getElementById('movementsWrap');
  const dateFromInput = document.getElementById('dateFrom');
  const dateToInput = document.getElementById('dateTo');
  const statVentas = document.getElementById('statVentas');
  const statGastos = document.getElementById('statGastos');
  const statBalance = document.getElementById('statBalance');

  let editingId = null;

  function todayStr() {
    return new Date().toISOString().slice(0, 10);
  }

  function setRangeToday() {
    dateFromInput.value = todayStr();
    dateToInput.value = todayStr();
  }

  function loadAndRender() {
    const from = dateFromInput.value || null;
    const to = dateToInput.value || null;
    DataService.getMovementsByRange(from, to).then(list => {
      list.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.createdAt - a.createdAt));
      renderStats(list);
      renderTable(list);
    });
  }

  function renderStats(list) {
    const totalVentas = list.filter(m => m.type === 'venta').reduce((sum, m) => sum + m.amount, 0);
    const totalGastos = list.filter(m => m.type === 'gasto').reduce((sum, m) => sum + m.amount, 0);
    statVentas.textContent = UI.formatCurrency(totalVentas);
    statGastos.textContent = UI.formatCurrency(totalGastos);
    statBalance.textContent = UI.formatCurrency(totalVentas - totalGastos);
  }

  function rowHtml(m) {
    if (editingId === m.id) {
      return (
        '<tr data-id="' + m.id + '">' +
          '<td data-label="Fecha"><input class="cell-input" id="edit_date" type="date" value="' + m.date + '"></td>' +
          '<td data-label="Tipo">' +
            '<select class="cell-input" id="edit_type">' +
              '<option value="venta"' + (m.type === 'venta' ? ' selected' : '') + '>Venta</option>' +
              '<option value="gasto"' + (m.type === 'gasto' ? ' selected' : '') + '>Gasto</option>' +
            '</select>' +
          '</td>' +
          '<td data-label="Descripción" class="desc-cell"><input class="cell-input" id="edit_desc" value="' + UI.escapeHtml(m.description) + '"></td>' +
          '<td data-label="Monto" class="price-cell"><input class="cell-input" id="edit_amount" type="number" min="0" value="' + m.amount + '"></td>' +
          '<td data-label="Acciones"><div class="row-actions">' +
            '<button class="btn btn-success btn-sm" data-save="' + m.id + '">Guardar</button>' +
            '<button class="btn btn-secondary btn-sm" data-cancel="' + m.id + '">Cancelar</button>' +
          '</div></td>' +
        '</tr>'
      );
    }

    return (
      '<tr data-id="' + m.id + '">' +
        '<td data-label="Fecha">' + m.date + '</td>' +
        '<td data-label="Tipo"><span class="type-pill ' + m.type + '">' + (m.type === 'venta' ? 'Venta' : 'Gasto') + '</span></td>' +
        '<td data-label="Descripción" class="desc-cell">' + UI.escapeHtml(m.description || '—') + '</td>' +
        '<td data-label="Monto" class="amount-cell ' + m.type + '">' + (m.type === 'gasto' ? '- ' : '+ ') + UI.formatCurrency(m.amount) + '</td>' +
        '<td data-label="Acciones"><div class="row-actions">' +
          '<button class="btn btn-secondary btn-sm" data-edit="' + m.id + '">✏️ Editar</button>' +
          '<button class="btn btn-danger btn-sm" data-delete="' + m.id + '">🗑️ Eliminar</button>' +
        '</div></td>' +
      '</tr>'
    );
  }

  function renderTable(list) {
    if (list.length === 0) {
      movementsWrap.innerHTML =
        '<div class="empty-state"><div class="emoji">🧾</div><p>No hay movimientos registrados en este rango de fechas.</p></div>';
      return;
    }

    movementsWrap.innerHTML =
      '<div class="product-table-wrap"><table class="product-table">' +
      '<thead><tr><th>Fecha</th><th>Tipo</th><th>Descripción</th><th>Monto</th><th>Acciones</th></tr></thead>' +
      '<tbody>' + list.map(rowHtml).join('') + '</tbody></table></div>';

    wireRowEvents(list);
  }

  function wireRowEvents(list) {
    movementsWrap.querySelectorAll('[data-edit]').forEach(btn => {
      btn.addEventListener('click', () => {
        editingId = btn.getAttribute('data-edit');
        renderTable(list);
      });
    });
    movementsWrap.querySelectorAll('[data-cancel]').forEach(btn => {
      btn.addEventListener('click', () => {
        editingId = null;
        renderTable(list);
      });
    });
    movementsWrap.querySelectorAll('[data-save]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-save');
        DataService.updateMovement(id, {
          date: document.getElementById('edit_date').value,
          type: document.getElementById('edit_type').value,
          description: document.getElementById('edit_desc').value.trim(),
          amount: document.getElementById('edit_amount').value
        }).then(() => {
          editingId = null;
          UI.showToast('Movimiento actualizado', 'success');
          loadAndRender();
        });
      });
    });
    movementsWrap.querySelectorAll('[data-delete]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-delete');
        if (confirm('¿Eliminar este movimiento?')) {
          DataService.deleteMovement(id).then(() => {
            UI.showToast('Movimiento eliminado', 'success');
            loadAndRender();
          });
        }
      });
    });
  }

  function openMovementModal(type) {
    const isVenta = type === 'venta';
    UI.openModal(
      '<h2>' + (isVenta ? '💰 Registrar venta' : '📉 Registrar gasto') + '</h2>' +
      '<form id="movementForm">' +
        '<div class="field">' +
          '<label>Tipo de movimiento</label>' +
          '<div class="type-toggle" id="typeToggle">' +
            '<button type="button" data-type="venta" class="' + (isVenta ? 'selected' : '') + '">Venta</button>' +
            '<button type="button" data-type="gasto" class="' + (!isVenta ? 'selected' : '') + '">Gasto</button>' +
          '</div>' +
        '</div>' +
        '<div class="form-grid-2">' +
          '<div class="field"><label for="m_date">Fecha</label>' +
            '<input type="date" id="m_date" value="' + todayStr() + '" required></div>' +
          '<div class="field"><label for="m_amount">Monto</label>' +
            '<input type="number" id="m_amount" min="0" value="0" required></div>' +
        '</div>' +
        '<div class="field"><label for="m_desc">Descripción</label>' +
          '<input type="text" id="m_desc" placeholder="Ej: Venta mostrador / Pago de servicios"></div>' +
        '<div class="modal-actions">' +
          '<button type="button" class="btn btn-secondary" id="mCancelBtn">Cancelar</button>' +
          '<button type="submit" class="btn btn-primary">Guardar</button>' +
        '</div>' +
      '</form>'
    );

    const toggle = document.getElementById('typeToggle');
    toggle.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => {
        toggle.querySelectorAll('button').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
      });
    });

    document.getElementById('mCancelBtn').addEventListener('click', UI.closeModal);
    document.getElementById('movementForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const selectedType = toggle.querySelector('button.selected').getAttribute('data-type');
      DataService.addMovement({
        type: selectedType,
        amount: document.getElementById('m_amount').value,
        description: document.getElementById('m_desc').value.trim(),
        date: document.getElementById('m_date').value
      }).then((mov) => {
        UI.logAction(
          selectedType === 'venta' ? 'Venta registrada' : 'Gasto registrado',
          UI.formatCurrency(mov.amount) + (mov.description ? ' — ' + mov.description : '')
        );
        UI.showToast(selectedType === 'venta' ? 'Venta registrada' : 'Gasto registrado', 'success');
        UI.closeModal();
        loadAndRender();
      });
    });
  }

  document.getElementById('addSaleBtn').addEventListener('click', () => openMovementModal('venta'));
  document.getElementById('addExpenseBtn').addEventListener('click', () => openMovementModal('gasto'));
  document.getElementById('todayBtn').addEventListener('click', () => { setRangeToday(); loadAndRender(); });
  document.getElementById('consultarBtn').addEventListener('click', loadAndRender);

  // El rango de fechas solo se aplica cuando el usuario da clic en "Consultar"
  // (o "Hoy"), no automáticamente al cambiar las fechas.

  setRangeToday();
  loadAndRender();
});
