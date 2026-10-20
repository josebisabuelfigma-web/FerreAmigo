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

  function hasItems(m) {
    return Array.isArray(m.items) && m.items.length > 0;
  }

  function paymentLabel(m) {
    if (m.type !== 'venta' || !m.paymentMethod) return '—';
    return m.paymentMethod === 'efectivo' ? '💵 Efectivo' : '🏦 Transferencia';
  }

  /** Detalle de la venta: por producto, cantidad, valor unitario y valor de la línea. */
  function detailHtml(m) {
    if (!hasItems(m)) return UI.escapeHtml(m.description || '—');
    return '<ul class="sale-lines">' + m.items.map(it =>
      '<li><strong>' + it.quantity + ' × ' + UI.escapeHtml(it.name) + '</strong>' +
      '<span>' + UI.formatCurrency(it.unitPrice) + ' c/u = ' + UI.formatCurrency(it.subtotal) + '</span></li>'
    ).join('') + '</ul>';
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
          '<td data-label="Pago">' + paymentLabel(m) + '</td>' +
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
        '<td data-label="Descripción" class="desc-cell">' + detailHtml(m) + '</td>' +
        '<td data-label="Pago">' + paymentLabel(m) + '</td>' +
        '<td data-label="Monto" class="amount-cell ' + m.type + '">' + (m.type === 'gasto' ? '- ' : '+ ') + UI.formatCurrency(m.amount) + '</td>' +
        '<td data-label="Acciones"><div class="row-actions">' +
          // Las ventas de productos no se editan (afectan el inventario): se eliminan y se registran de nuevo.
          (hasItems(m) ? '' : '<button class="btn btn-secondary btn-sm" data-edit="' + m.id + '">✏️ Editar</button>') +
          // Eliminar una venta es exclusivo del administrador; los gastos los puede eliminar cualquiera.
          (m.type === 'venta' && !AUTH.isAdmin() ? '' : '<button class="btn btn-danger btn-sm" data-delete="' + m.id + '">🗑️ Eliminar</button>') +
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
      '<thead><tr><th>Fecha</th><th>Tipo</th><th>Descripción</th><th>Pago</th><th>Monto</th><th>Acciones</th></tr></thead>' +
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
        const mov = list.find(m => m.id === id);
        if (mov.type === 'venta' && !AUTH.isAdmin()) {
          UI.showToast('Solo el administrador puede eliminar ventas', 'danger');
          return;
        }
        const msg = hasItems(mov)
          ? '¿Eliminar esta venta? Las unidades vendidas volverán al inventario.'
          : '¿Eliminar este movimiento?';
        if (confirm(msg)) {
          DataService.deleteMovement(id).then(() => {
            UI.logAction(mov.type === 'venta' ? 'Venta eliminada' : 'Gasto eliminado',
              UI.formatCurrency(mov.amount) + (mov.description ? ' — ' + mov.description : ''));
            UI.showToast('Movimiento eliminado', 'success');
            loadAndRender();
          });
        }
      });
    });
  }

  function normalize(text) {
    return String(text || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  }

  /* ------------------------------ Registrar venta (carrito) ------------------------------ */

  function openSaleModal() {
    DataService.getProducts().then(products => {
      const cart = []; // { productId, qty }
      let paymentMethod = null;

      const byId = id => products.find(p => p.id === id);
      const noStockMsg = p => 'No hay unidades suficientes (disponibles: ' + p.quantity + ')';

      UI.openModal(
        '<h2>💰 Registrar venta</h2>' +
        '<form id="saleForm" autocomplete="off">' +
          '<div class="field search-field">' +
            '<label for="s_search">Buscar producto</label>' +
            '<input type="text" id="s_search" placeholder="Escriba el nombre del producto…" autocomplete="off">' +
            '<div class="search-results hidden" id="s_results"></div>' +
          '</div>' +
          '<div id="s_cart"></div>' +
          '<div class="sale-total"><span>Total de la venta</span><strong id="s_total">$0</strong></div>' +
          '<div class="form-grid-2">' +
            '<div class="field"><label>Método de pago</label>' +
              '<div class="type-toggle" id="payToggle">' +
                '<button type="button" data-pay="efectivo">💵 Efectivo</button>' +
                '<button type="button" data-pay="transferencia">🏦 Transferencia</button>' +
              '</div>' +
            '</div>' +
            '<div class="field"><label for="s_date">Fecha</label>' +
              '<input type="date" id="s_date" value="' + todayStr() + '" required></div>' +
          '</div>' +
          '<div class="modal-actions">' +
            '<button type="button" class="btn btn-secondary" id="sCancelBtn">Cancelar</button>' +
            '<button type="submit" class="btn btn-success" id="sConfirmBtn" disabled>Confirmar venta</button>' +
          '</div>' +
        '</form>',
        { wide: true, closeOnOverlay: false }
      );

      const searchInput = document.getElementById('s_search');
      const resultsEl = document.getElementById('s_results');
      const cartEl = document.getElementById('s_cart');
      const totalEl = document.getElementById('s_total');
      const confirmBtn = document.getElementById('sConfirmBtn');
      const payToggle = document.getElementById('payToggle');

      /* --- búsqueda por nombre de producto --- */
      function renderResults() {
        const words = normalize(searchInput.value).split(/\s+/).filter(Boolean);
        if (words.length === 0) { resultsEl.classList.add('hidden'); return; }
        const found = products
          .filter(p => { const n = normalize(p.name); return words.every(w => n.includes(w)); })
          .slice(0, 8);
        resultsEl.classList.remove('hidden');
        if (found.length === 0) {
          resultsEl.innerHTML = '<div class="search-empty">No se encontraron productos con ese nombre.</div>';
          return;
        }
        resultsEl.innerHTML = found.map(p =>
          '<button type="button" class="search-result' + (p.quantity <= 0 ? ' out' : '') + '" data-add="' + p.id + '">' +
            '<span class="sr-name">' + UI.escapeHtml(p.name) + '</span>' +
            '<span class="sr-meta">' + UI.formatCurrency(p.salePrice) + ' · ' +
              (p.quantity <= 0 ? 'Agotado' : p.quantity + ' disp.') + '</span>' +
          '</button>'
        ).join('');
        resultsEl.querySelectorAll('[data-add]').forEach(btn => {
          btn.addEventListener('click', () => addToCart(btn.getAttribute('data-add')));
        });
      }

      function addToCart(productId) {
        const p = byId(productId);
        const line = cart.find(l => l.productId === productId);
        if (p.quantity <= 0) { UI.showToast('No hay unidades de "' + p.name + '"', 'danger'); return; }
        if (line) {
          if ((line.qty || 0) + 1 > p.quantity) { UI.showToast(noStockMsg(p), 'danger'); return; }
          line.qty = (line.qty || 0) + 1;
        } else {
          cart.push({ productId, qty: 1 });
        }
        searchInput.value = '';
        resultsEl.classList.add('hidden');
        renderCart();
        searchInput.focus();
      }

      /* --- carrito --- */
      function renderCart() {
        if (cart.length === 0) {
          cartEl.innerHTML = '<div class="cart-empty">Busque un producto y selecciónelo para agregarlo a la venta.</div>';
          refreshCart();
          return;
        }
        cartEl.innerHTML =
          '<div class="cart-wrap"><table class="cart-table"><thead><tr>' +
            '<th>Producto</th><th>Valor unidad</th><th>Cantidad</th><th>Valor total</th><th></th>' +
          '</tr></thead><tbody>' +
          cart.map((l, i) => {
            const p = byId(l.productId);
            return '<tr data-i="' + i + '">' +
              '<td><strong>' + UI.escapeHtml(p.name) + '</strong><div class="line-error hidden"></div></td>' +
              '<td class="nowrap">' + UI.formatCurrency(p.salePrice) + '</td>' +
              '<td><div class="qty-stepper">' +
                '<button type="button" data-minus="' + i + '">−</button>' +
                '<input type="number" min="1" step="1" value="' + l.qty + '" data-qty="' + i + '">' +
                '<button type="button" data-plus="' + i + '">+</button>' +
              '</div></td>' +
              '<td class="nowrap line-subtotal"></td>' +
              '<td><button type="button" class="btn-remove" data-remove="' + i + '" title="Quitar">✕</button></td>' +
            '</tr>';
          }).join('') +
          '</tbody></table></div>';

        cartEl.querySelectorAll('[data-qty]').forEach(inp => {
          inp.addEventListener('input', () => {
            const n = parseInt(inp.value, 10);
            cart[Number(inp.getAttribute('data-qty'))].qty = isNaN(n) ? 0 : n;
            refreshCart();
          });
        });
        cartEl.querySelectorAll('[data-minus]').forEach(btn => {
          btn.addEventListener('click', () => stepQty(Number(btn.getAttribute('data-minus')), -1));
        });
        cartEl.querySelectorAll('[data-plus]').forEach(btn => {
          btn.addEventListener('click', () => stepQty(Number(btn.getAttribute('data-plus')), 1));
        });
        cartEl.querySelectorAll('[data-remove]').forEach(btn => {
          btn.addEventListener('click', () => {
            cart.splice(Number(btn.getAttribute('data-remove')), 1);
            renderCart();
          });
        });
        refreshCart();
      }

      function stepQty(i, delta) {
        cart[i].qty = Math.max(1, (cart[i].qty || 0) + delta);
        cartEl.querySelector('[data-qty="' + i + '"]').value = cart[i].qty;
        refreshCart();
      }

      /** Actualiza subtotales, mensajes de stock y total sin volver a dibujar (no pierde el foco). */
      function refreshCart() {
        let total = 0;
        let allValid = cart.length > 0;
        cart.forEach((l, i) => {
          const p = byId(l.productId);
          const row = cartEl.querySelector('tr[data-i="' + i + '"]');
          if (!row) return;
          const errEl = row.querySelector('.line-error');
          let error = '';
          if (!(l.qty >= 1)) error = 'Ingrese una cantidad válida';
          else if (l.qty > p.quantity) error = noStockMsg(p);
          errEl.textContent = error;
          errEl.classList.toggle('hidden', !error);
          row.classList.toggle('line-invalid', !!error);
          row.querySelector('.line-subtotal').textContent = UI.formatCurrency(error ? 0 : p.salePrice * l.qty);
          if (error) allValid = false; else total += p.salePrice * l.qty;
        });
        totalEl.textContent = UI.formatCurrency(total);
        confirmBtn.disabled = !allValid;
      }

      searchInput.addEventListener('input', renderResults);
      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          const first = resultsEl.querySelector('[data-add]');
          if (first) first.click();
        }
      });

      payToggle.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', () => {
          payToggle.querySelectorAll('button').forEach(b => b.classList.remove('selected'));
          btn.classList.add('selected');
          paymentMethod = btn.getAttribute('data-pay');
        });
      });

      document.getElementById('sCancelBtn').addEventListener('click', UI.closeModal);
      document.getElementById('saleForm').addEventListener('submit', (e) => {
        e.preventDefault();
        if (!paymentMethod) { UI.showToast('Seleccione el método de pago', 'danger'); return; }
        const session = AUTH.getSession();
        DataService.registerSale({
          items: cart.map(l => ({ productId: l.productId, quantity: l.qty })),
          paymentMethod,
          date: document.getElementById('s_date').value,
          user: session ? session.user : ''
        }).then(mov => {
          UI.logAction('Venta registrada',
            UI.formatCurrency(mov.amount) + ' (' + mov.paymentMethod + ') — ' + mov.description);
          UI.showToast('Venta registrada', 'success');
          UI.closeModal();
          loadAndRender();
        }).catch(err => {
          UI.showToast(err.message, 'danger');
        });
      });

      renderCart();
      searchInput.focus();
    });
  }

  /* ------------------------------ Registrar gasto ------------------------------ */

  function openExpenseModal() {
    UI.openModal(
      '<h2>📉 Registrar gasto</h2>' +
      '<form id="movementForm">' +
        '<div class="form-grid-2">' +
          '<div class="field"><label for="m_date">Fecha</label>' +
            '<input type="date" id="m_date" value="' + todayStr() + '" required></div>' +
          '<div class="field"><label for="m_amount">Monto</label>' +
            '<input type="number" id="m_amount" min="0" value="0" required></div>' +
        '</div>' +
        '<div class="field"><label for="m_desc">Descripción</label>' +
          '<input type="text" id="m_desc" placeholder="Ej: Pago de servicios"></div>' +
        '<div class="modal-actions">' +
          '<button type="button" class="btn btn-secondary" id="mCancelBtn">Cancelar</button>' +
          '<button type="submit" class="btn btn-primary">Guardar</button>' +
        '</div>' +
      '</form>'
    );

    document.getElementById('mCancelBtn').addEventListener('click', UI.closeModal);
    document.getElementById('movementForm').addEventListener('submit', (e) => {
      e.preventDefault();
      DataService.addMovement({
        type: 'gasto',
        amount: document.getElementById('m_amount').value,
        description: document.getElementById('m_desc').value.trim(),
        date: document.getElementById('m_date').value
      }).then((mov) => {
        UI.logAction('Gasto registrado', UI.formatCurrency(mov.amount) + (mov.description ? ' — ' + mov.description : ''));
        UI.showToast('Gasto registrado', 'success');
        UI.closeModal();
        loadAndRender();
      });
    });
  }

  /* ------------------------------ Reporte de ventas (CSV para Excel) ------------------------------ */

  function csvCell(value) {
    const s = String(value == null ? '' : value);
    return /[;"\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }

  function downloadSalesReport() {
    const from = dateFromInput.value || null;
    const to = dateToInput.value || null;
    DataService.getMovementsByRange(from, to).then(list => {
      const sales = list
        .filter(m => m.type === 'venta')
        .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.createdAt - b.createdAt));
      if (sales.length === 0) {
        UI.showToast('No hay ventas en el rango seleccionado', 'danger');
        return;
      }

      const payLabel = m => m.paymentMethod === 'efectivo' ? 'Efectivo'
        : m.paymentMethod === 'transferencia' ? 'Transferencia' : 'Sin especificar';
      const rows = [['Fecha', 'Hora', 'Producto', 'Cantidad', 'Valor unitario', 'Valor total producto', 'Total de la venta', 'Método de pago', 'Registrado por']];
      const totals = { 'Efectivo': 0, 'Transferencia': 0, 'Sin especificar': 0 };
      let grand = 0;

      sales.forEach(m => {
        const hora = new Date(m.createdAt).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
        const lines = hasItems(m)
          ? m.items.map(it => [it.name, it.quantity, it.unitPrice, it.subtotal])
          : [[m.description || 'Venta general', 1, m.amount, m.amount]];
        lines.forEach((l, idx) => {
          rows.push([m.date, hora, l[0], l[1], l[2], l[3], idx === 0 ? m.amount : '', payLabel(m), m.user || '']);
        });
        totals[payLabel(m)] += m.amount;
        grand += m.amount;
      });

      rows.push([]);
      rows.push(['Cantidad de ventas', sales.length]);
      rows.push(['Total en efectivo', totals['Efectivo']]);
      rows.push(['Total en transferencia', totals['Transferencia']]);
      if (totals['Sin especificar'] > 0) rows.push(['Total sin método de pago', totals['Sin especificar']]);
      rows.push(['TOTAL VENTAS', grand]);

      // Separador ";" y BOM UTF-8: Excel en español lo abre en columnas y con tildes correctas.
      const csv = '﻿' + rows.map(r => r.map(csvCell).join(';')).join('\r\n');
      const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'reporte-ventas_' + (from || 'inicio') + '_a_' + (to || 'hoy') + '.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      UI.logAction('Reporte de ventas descargado', (from || 'inicio') + ' a ' + (to || 'hoy'));
      UI.showToast('Reporte descargado', 'success');
    });
  }

  document.getElementById('addSaleBtn').addEventListener('click', openSaleModal);
  document.getElementById('addExpenseBtn').addEventListener('click', openExpenseModal);
  document.getElementById('reportBtn').addEventListener('click', downloadSalesReport);
  document.getElementById('todayBtn').addEventListener('click', () => { setRangeToday(); loadAndRender(); });
  document.getElementById('consultarBtn').addEventListener('click', loadAndRender);

  // El rango de fechas solo se aplica cuando el usuario da clic en "Consultar"
  // (o "Hoy"), no automáticamente al cambiar las fechas.

  setRangeToday();
  loadAndRender();
});
