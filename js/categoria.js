document.addEventListener('DOMContentLoaded', function () {
  AUTH.requireAuth();

  const params = new URLSearchParams(window.location.search);
  const categoryId = params.get('cat');
  const highlightId = params.get('highlight');

  if (!categoryId) {
    window.location.href = 'catalogo.html';
    return;
  }

  const listWrap = document.getElementById('productListWrap');
  const localSearch = document.getElementById('localSearch');
  const productCountEl = document.getElementById('productCount');
  const LOW_STOCK_THRESHOLD = 10;

  let currentCategory = null;
  let allProducts = [];
  let editingId = null;

  function loadCategory() {
    DataService.getCategoryById(categoryId).then(cat => {
      if (!cat) {
        window.location.href = 'catalogo.html';
        return;
      }
      currentCategory = cat;
      document.getElementById('categoryIcon').textContent = cat.icon;
      document.getElementById('categoryName').textContent = cat.name;
      document.getElementById('breadcrumbCat').textContent = cat.name;
      document.title = cat.name + ' — Ferretería FerreAmigo';
      loadProducts();
    });
  }

  function loadProducts() {
    DataService.getProducts(categoryId).then(products => {
      allProducts = products;
      renderList(localSearch.value);
    });
  }

  function filteredProducts(query) {
    const q = (query || '').trim().toLowerCase();
    if (!q) return allProducts;
    return allProducts.filter(p => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
  }

  function renderList(query) {
    const list = filteredProducts(query);
    productCountEl.textContent = list.length + ' producto' + (list.length === 1 ? '' : 's');

    if (list.length === 0) {
      listWrap.innerHTML =
        '<div class="empty-state"><div class="emoji">📭</div>' +
        '<p>' + (query ? 'No se encontraron productos con ese criterio.' : 'Esta categoría aún no tiene productos.') + '</p></div>';
      return;
    }

    listWrap.innerHTML =
      '<div class="product-table-wrap"><table class="product-table">' +
      '<thead><tr>' +
        '<th>Nombre</th><th>Cantidad</th><th>Descripción</th><th>Precio compra</th><th>Precio venta</th><th>Acciones</th>' +
      '</tr></thead>' +
      '<tbody id="productsTbody">' +
      list.map(p => rowHtml(p)).join('') +
      '</tbody></table></div>';

    wireRowEvents();

    if (highlightId) {
      const row = listWrap.querySelector('tr[data-id="' + highlightId + '"]');
      if (row) {
        row.classList.add('highlight-row');
        setTimeout(() => row.scrollIntoView({ behavior: 'smooth', block: 'center' }), 150);
      }
    }
  }

  function rowHtml(p) {
    const isEditing = editingId === p.id;
    const qtyClass = p.quantity <= LOW_STOCK_THRESHOLD ? 'qty-low' : '';

    if (isEditing) {
      return (
        '<tr data-id="' + p.id + '">' +
          '<td data-label="Nombre"><input class="cell-input" id="edit_name" value="' + UI.escapeHtml(p.name) + '"></td>' +
          '<td data-label="Cantidad"><input class="cell-input" id="edit_qty" type="number" min="0" value="' + p.quantity + '"></td>' +
          '<td data-label="Descripción" class="desc-cell"><input class="cell-input" id="edit_desc" value="' + UI.escapeHtml(p.description) + '"></td>' +
          '<td data-label="Precio compra" class="price-cell"><input class="cell-input" id="edit_purchase" type="number" min="0" value="' + p.purchasePrice + '"></td>' +
          '<td data-label="Precio venta" class="price-cell"><input class="cell-input" id="edit_sale" type="number" min="0" value="' + p.salePrice + '"></td>' +
          '<td data-label="Acciones"><div class="row-actions">' +
            '<button class="btn btn-success btn-sm" data-save="' + p.id + '">Guardar</button>' +
            '<button class="btn btn-secondary btn-sm" data-cancel="' + p.id + '">Cancelar</button>' +
          '</div></td>' +
        '</tr>'
      );
    }

    return (
      '<tr data-id="' + p.id + '">' +
        '<td data-label="Nombre"><strong>' + UI.escapeHtml(p.name) + '</strong></td>' +
        '<td data-label="Cantidad" class="' + qtyClass + '">' + p.quantity + '</td>' +
        '<td data-label="Descripción" class="desc-cell">' + UI.escapeHtml(p.description) + '</td>' +
        '<td data-label="Precio compra" class="price-cell">' + UI.formatCurrency(p.purchasePrice) + '</td>' +
        '<td data-label="Precio venta" class="price-cell">' + UI.formatCurrency(p.salePrice) + '</td>' +
        '<td data-label="Acciones"><div class="row-actions">' +
          '<button class="btn btn-secondary btn-sm" data-edit="' + p.id + '">✏️ Editar</button>' +
          '<button class="btn btn-danger btn-sm" data-delete="' + p.id + '">🗑️ Eliminar</button>' +
        '</div></td>' +
      '</tr>'
    );
  }

  function wireRowEvents() {
    listWrap.querySelectorAll('[data-edit]').forEach(btn => {
      btn.addEventListener('click', () => {
        editingId = btn.getAttribute('data-edit');
        renderList(localSearch.value);
      });
    });

    listWrap.querySelectorAll('[data-cancel]').forEach(btn => {
      btn.addEventListener('click', () => {
        editingId = null;
        renderList(localSearch.value);
      });
    });

    listWrap.querySelectorAll('[data-save]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-save');
        const name = document.getElementById('edit_name').value.trim();
        if (!name) { UI.showToast('El nombre no puede estar vacío', 'danger'); return; }
        const data = {
          name,
          quantity: document.getElementById('edit_qty').value,
          description: document.getElementById('edit_desc').value.trim(),
          purchasePrice: document.getElementById('edit_purchase').value,
          salePrice: document.getElementById('edit_sale').value
        };
        DataService.updateProduct(id, data).then(() => {
          editingId = null;
          UI.showToast('Producto actualizado', 'success');
          loadProducts();
        });
      });
    });

    listWrap.querySelectorAll('[data-delete]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-delete');
        const prod = allProducts.find(p => p.id === id);
        if (confirm('¿Eliminar el producto "' + prod.name + '"?')) {
          DataService.deleteProduct(id).then(() => {
            UI.showToast('Producto eliminado', 'success');
            loadProducts();
          });
        }
      });
    });
  }

  function openAddProductModal() {
    UI.openModal(
      '<h2>➕ Nuevo producto</h2>' +
      '<p class="modal-subtitle">Se agregará a la categoría <strong>' + UI.escapeHtml(currentCategory.name) + '</strong>.</p>' +
      '<form id="productForm">' +
        '<div class="field"><label for="p_name">Nombre</label>' +
          '<input type="text" id="p_name" required placeholder="Ej: Tornillo cabeza plana 1/4&quot;"></div>' +
        '<div class="form-grid-2">' +
          '<div class="field"><label for="p_qty">Cantidad disponible</label>' +
            '<input type="number" id="p_qty" min="0" value="0" required></div>' +
          '<div class="field"><label for="p_desc">Descripción corta</label>' +
            '<input type="text" id="p_desc" placeholder="Ej: Para madera"></div>' +
        '</div>' +
        '<div class="form-grid-2">' +
          '<div class="field"><label for="p_purchase">Precio de compra</label>' +
            '<input type="number" id="p_purchase" min="0" value="0" required></div>' +
          '<div class="field"><label for="p_sale">Precio de venta</label>' +
            '<input type="number" id="p_sale" min="0" value="0" required></div>' +
        '</div>' +
        '<div class="modal-actions">' +
          '<button type="button" class="btn btn-secondary" id="pCancelBtn">Cancelar</button>' +
          '<button type="submit" class="btn btn-primary">Guardar producto</button>' +
        '</div>' +
      '</form>'
    );

    document.getElementById('pCancelBtn').addEventListener('click', UI.closeModal);
    document.getElementById('productForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('p_name').value.trim();
      if (!name) return;
      DataService.addProduct(categoryId, {
        name,
        quantity: document.getElementById('p_qty').value,
        description: document.getElementById('p_desc').value.trim(),
        purchasePrice: document.getElementById('p_purchase').value,
        salePrice: document.getElementById('p_sale').value
      }).then(() => {
        UI.showToast('Producto agregado', 'success');
        UI.closeModal();
        loadProducts();
      });
    });
  }

  document.getElementById('addProductBtn').addEventListener('click', openAddProductModal);
  localSearch.addEventListener('input', (e) => renderList(e.target.value));

  loadCategory();
});
