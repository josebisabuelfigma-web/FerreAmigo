document.addEventListener('DOMContentLoaded', function () {
  AUTH.requireAuth();

  const listWrap = document.getElementById('invoiceListWrap');
  const searchInput = document.getElementById('invoiceSearch');
  const countEl = document.getElementById('invoiceCount');

  let allInvoices = [];

  function todayStr() {
    return new Date().toISOString().slice(0, 10);
  }

  function loadInvoices() {
    DataService.getInvoices().then(list => {
      allInvoices = list;
      renderList(searchInput.value);
    });
  }

  function filtered(query) {
    const q = (query || '').trim().toLowerCase();
    if (!q) return allInvoices;
    return allInvoices.filter(i =>
      i.provider.toLowerCase().includes(q) || i.invoiceNumber.toLowerCase().includes(q)
    );
  }

  function isImage(fileName) {
    return /\.(png|jpe?g|gif|webp|bmp)$/i.test(fileName || '');
  }

  function rowHtml(inv) {
    const fileCell = inv.fileData
      ? '<div class="row-actions">' +
          '<button class="btn btn-secondary btn-sm" data-view="' + inv.id + '">👁️ Ver</button>' +
          '<a class="btn btn-secondary btn-sm" download="' + UI.escapeHtml(inv.fileName || 'factura') + '" href="' + inv.fileData + '">⬇️ Descargar</a>' +
        '</div>'
      : '<span class="file-chip">Sin archivo</span>';

    return (
      '<tr data-id="' + inv.id + '">' +
        '<td data-label="Proveedor"><strong>' + UI.escapeHtml(inv.provider) + '</strong></td>' +
        '<td data-label="N° Factura">' + UI.escapeHtml(inv.invoiceNumber) + '</td>' +
        '<td data-label="Fecha">' + inv.date + '</td>' +
        '<td data-label="Valor" class="price-cell">' + UI.formatCurrency(inv.amount) + '</td>' +
        '<td data-label="Archivo">' + fileCell + '</td>' +
        '<td data-label="Acciones"><div class="row-actions">' +
          '<button class="btn btn-secondary btn-sm" data-edit="' + inv.id + '">✏️ Editar</button>' +
          '<button class="btn btn-danger btn-sm" data-delete="' + inv.id + '">🗑️ Eliminar</button>' +
        '</div></td>' +
      '</tr>'
    );
  }

  function renderList(query) {
    const list = filtered(query);
    countEl.textContent = list.length + ' factura' + (list.length === 1 ? '' : 's');

    if (list.length === 0) {
      listWrap.innerHTML =
        '<div class="empty-state"><div class="emoji">🧾</div>' +
        '<p>' + (query ? 'No se encontraron facturas con ese criterio.' : 'Aún no hay facturas registradas.') + '</p></div>';
      return;
    }

    listWrap.innerHTML =
      '<div class="product-table-wrap"><table class="product-table">' +
      '<thead><tr><th>Proveedor</th><th>N° Factura</th><th>Fecha</th><th>Valor</th><th>Archivo</th><th>Acciones</th></tr></thead>' +
      '<tbody>' + list.map(rowHtml).join('') + '</tbody></table></div>';

    wireRowEvents();
  }

  function wireRowEvents() {
    listWrap.querySelectorAll('[data-view]').forEach(btn => {
      btn.addEventListener('click', () => openViewModal(btn.getAttribute('data-view')));
    });
    listWrap.querySelectorAll('[data-edit]').forEach(btn => {
      btn.addEventListener('click', () => openInvoiceModal(btn.getAttribute('data-edit')));
    });
    listWrap.querySelectorAll('[data-delete]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-delete');
        const inv = allInvoices.find(i => i.id === id);
        if (confirm('¿Eliminar la factura de "' + inv.provider + '" N° ' + inv.invoiceNumber + '?')) {
          DataService.deleteInvoice(id).then(() => {
            UI.showToast('Factura eliminada', 'success');
            loadInvoices();
          });
        }
      });
    });
  }

  function openViewModal(id) {
    const inv = allInvoices.find(i => i.id === id);
    if (!inv || !inv.fileData) return;

    const preview = isImage(inv.fileName)
      ? '<img src="' + inv.fileData + '" alt="Factura ' + UI.escapeHtml(inv.invoiceNumber) + '" style="width:100%;border-radius:8px;">'
      : '<iframe class="invoice-preview-frame" src="' + inv.fileData + '"></iframe>';

    UI.openModal(
      '<h2>🧾 ' + UI.escapeHtml(inv.provider) + ' — N° ' + UI.escapeHtml(inv.invoiceNumber) + '</h2>' +
      '<p class="modal-subtitle">' + inv.date + ' · ' + UI.formatCurrency(inv.amount) + '</p>' +
      preview +
      '<div class="modal-actions">' +
        '<a class="btn btn-secondary" download="' + UI.escapeHtml(inv.fileName || 'factura') + '" href="' + inv.fileData + '">⬇️ Descargar</a>' +
        '<button type="button" class="btn btn-primary" id="viewCloseBtn">Cerrar</button>' +
      '</div>',
      { wide: true }
    );
    document.getElementById('viewCloseBtn').addEventListener('click', UI.closeModal);
  }

  function openInvoiceModal(editId) {
    const editing = editId ? allInvoices.find(i => i.id === editId) : null;

    UI.openModal(
      '<h2>' + (editing ? '✏️ Editar factura' : '🧾 Nueva factura') + '</h2>' +
      '<form id="invoiceForm">' +
        '<div class="field"><label for="i_provider">Proveedor</label>' +
          '<input type="text" id="i_provider" required placeholder="Ej: Distribuciones El Tornillo S.A.S" value="' + (editing ? UI.escapeHtml(editing.provider) : '') + '"></div>' +
        '<div class="form-grid-2">' +
          '<div class="field"><label for="i_number">Número de factura</label>' +
            '<input type="text" id="i_number" required placeholder="Ej: FV-00123" value="' + (editing ? UI.escapeHtml(editing.invoiceNumber) : '') + '"></div>' +
          '<div class="field"><label for="i_date">Fecha</label>' +
            '<input type="date" id="i_date" required value="' + (editing ? editing.date : todayStr()) + '"></div>' +
        '</div>' +
        '<div class="field"><label for="i_amount">Valor</label>' +
          '<input type="number" id="i_amount" min="0" required value="' + (editing ? editing.amount : 0) + '"></div>' +
        '<div class="field">' +
          '<label for="i_file">Cargar factura (imagen o PDF)</label>' +
          '<input type="file" id="i_file" accept="image/*,application/pdf">' +
          '<div class="file-preview hidden" id="filePreviewBox"></div>' +
          (editing && editing.fileName ? '<div class="file-chip" id="currentFileChip" style="margin-top:6px;">Archivo actual: ' + UI.escapeHtml(editing.fileName) + '</div>' : '') +
        '</div>' +
        '<input type="hidden" id="i_fileData" value="' + (editing && editing.fileData ? editing.fileData : '') + '">' +
        '<input type="hidden" id="i_fileName" value="' + (editing && editing.fileName ? UI.escapeHtml(editing.fileName) : '') + '">' +
        '<div class="modal-actions">' +
          '<button type="button" class="btn btn-secondary" id="iCancelBtn">Cancelar</button>' +
          '<button type="submit" class="btn btn-primary">' + (editing ? 'Guardar cambios' : 'Registrar factura') + '</button>' +
        '</div>' +
      '</form>'
    );

    document.getElementById('i_file').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        document.getElementById('i_fileData').value = reader.result;
        document.getElementById('i_fileName').value = file.name;
        const previewBox = document.getElementById('filePreviewBox');
        const chip = document.getElementById('currentFileChip');
        if (chip) chip.textContent = 'Archivo actual: ' + file.name;
        if (isImage(file.name)) {
          previewBox.classList.remove('hidden');
          previewBox.innerHTML = '<img src="' + reader.result + '" alt="Vista previa">';
        } else {
          previewBox.classList.add('hidden');
        }
      };
      reader.readAsDataURL(file);
    });

    document.getElementById('iCancelBtn').addEventListener('click', UI.closeModal);
    document.getElementById('invoiceForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const data = {
        provider: document.getElementById('i_provider').value.trim(),
        invoiceNumber: document.getElementById('i_number').value.trim(),
        date: document.getElementById('i_date').value,
        amount: document.getElementById('i_amount').value,
        fileData: document.getElementById('i_fileData').value || null,
        fileName: document.getElementById('i_fileName').value || null
      };

      const action = editing ? DataService.updateInvoice(editing.id, data) : DataService.addInvoice(data);
      action.then(() => {
        UI.showToast(editing ? 'Factura actualizada' : 'Factura registrada', 'success');
        UI.closeModal();
        loadInvoices();
      });
    });
  }

  document.getElementById('addInvoiceBtn').addEventListener('click', () => openInvoiceModal(null));
  searchInput.addEventListener('input', (e) => renderList(e.target.value));

  loadInvoices();
});
