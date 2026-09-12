document.addEventListener('DOMContentLoaded', function () {
  AUTH.requireAuth();

  const grid = document.getElementById('categoryGrid');
  const searchInput = document.getElementById('globalSearch');
  const resultsPanel = document.getElementById('searchResultsPanel');
  const categoriesToolbar = document.getElementById('categoriesToolbar');

  const ICON_OPTIONS = ['🔩', '🚰', '🔧', '🎨', '💡', '🔑', '🚿', '🧴', '📏', '🌱', '🛠️', '🪛', '🧰', '🪵', '🧱', '📦', '🚪', '🧯', '🛒', '⚙️', '🪝', '🔨'];
  const COLOR_OPTIONS = ['#D97706', '#2563EB', '#4B5563', '#DC2626', '#CA8A04', '#7C3AED', '#0891B2', '#059669', '#EA580C', '#16A34A', '#DB2777', '#0D9488'];

  let categoriesCache = [];
  let productsCache = [];

  function pickColor(index) {
    return COLOR_OPTIONS[index % COLOR_OPTIONS.length];
  }

  function categoryCoverHtml(cat) {
    if (cat.image) {
      return '<div class="category-card__cover" style="background:' + cat.color + '"><img src="' + cat.image + '" alt="' + UI.escapeHtml(cat.name) + '"></div>';
    }
    return '<div class="category-card__cover" style="background:' + cat.color + '">' + cat.icon + '</div>';
  }

  function renderCategories() {
    Promise.all([DataService.getCategories(), DataService.getProducts()]).then(([cats, products]) => {
      categoriesCache = cats;
      productsCache = products;

      if (cats.length === 0) {
        grid.innerHTML = '';
      } else {
        grid.innerHTML = cats.map(cat => {
          const count = products.filter(p => p.categoryId === cat.id).length;
          return (
            '<div class="category-card" data-cat="' + cat.id + '">' +
              categoryCoverHtml(cat) +
              '<div class="category-card__body">' +
                '<h3>' + UI.escapeHtml(cat.name) + '</h3>' +
                '<span>' + count + ' producto' + (count === 1 ? '' : 's') + '</span>' +
              '</div>' +
              '<div class="category-card__actions">' +
                '<button class="icon-btn" data-edit="' + cat.id + '" title="Editar categoría">✏️</button>' +
                '<button class="icon-btn danger" data-delete="' + cat.id + '" title="Eliminar categoría">🗑️</button>' +
              '</div>' +
            '</div>'
          );
        }).join('');
      }

      const addCard = document.createElement('div');
      addCard.className = 'category-card add-card';
      addCard.id = 'addCategoryCardInline';
      addCard.innerHTML = '<span class="plus">+</span><span>Agregar categoría</span>';
      grid.appendChild(addCard);

      wireCategoryCardEvents();
    });
  }

  function wireCategoryCardEvents() {
    grid.querySelectorAll('.category-card[data-cat]').forEach(card => {
      const id = card.getAttribute('data-cat');
      card.addEventListener('click', (e) => {
        if (e.target.closest('[data-edit]') || e.target.closest('[data-delete]')) return;
        window.location.href = 'categoria.html?cat=' + encodeURIComponent(id);
      });
    });
    grid.querySelectorAll('[data-edit]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        openCategoryModal(btn.getAttribute('data-edit'));
      });
    });
    grid.querySelectorAll('[data-delete]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-delete');
        const cat = categoriesCache.find(c => c.id === id);
        if (confirm('¿Eliminar la categoría "' + cat.name + '" y todos sus productos? Esta acción no se puede deshacer.')) {
          DataService.deleteCategory(id).then(() => {
            UI.showToast('Categoría eliminada', 'success');
            renderCategories();
          });
        }
      });
    });
    const addCardInline = document.getElementById('addCategoryCardInline');
    if (addCardInline) addCardInline.addEventListener('click', () => openCategoryModal(null));
  }

  function openCategoryModal(editId) {
    const editing = editId ? categoriesCache.find(c => c.id === editId) : null;
    const suggestedColor = pickColor(categoriesCache.length);

    UI.openModal(
      '<h2>' + (editing ? '✏️ Editar categoría' : '🗂️ Nueva categoría') + '</h2>' +
      '<p class="modal-subtitle">Define el nombre y elige un ícono o sube una imagen de portada.</p>' +
      '<form id="categoryForm">' +
        '<div class="field">' +
          '<label for="catName">Nombre de la categoría</label>' +
          '<input type="text" id="catName" required placeholder="Ej: Tornillería" value="' + (editing ? UI.escapeHtml(editing.name) : '') + '">' +
        '</div>' +
        '<div class="field">' +
          '<label>Ícono</label>' +
          '<div class="icon-picker" id="iconPicker">' +
            ICON_OPTIONS.map(icon => '<button type="button" data-icon="' + icon + '">' + icon + '</button>').join('') +
          '</div>' +
        '</div>' +
        '<div class="field">' +
          '<label for="catImage">Imagen de portada (opcional)</label>' +
          '<input type="file" id="catImage" accept="image/*">' +
          '<div class="file-preview hidden" id="catImagePreview"><img id="catImagePreviewImg" alt="Vista previa"></div>' +
        '</div>' +
        '<input type="hidden" id="catColor" value="' + (editing ? editing.color : suggestedColor) + '">' +
        '<input type="hidden" id="catImageData" value="">' +
        '<div class="modal-actions">' +
          '<button type="button" class="btn btn-secondary" id="catCancelBtn">Cancelar</button>' +
          '<button type="submit" class="btn btn-primary">' + (editing ? 'Guardar cambios' : 'Crear categoría') + '</button>' +
        '</div>' +
      '</form>'
    );

    const picker = document.getElementById('iconPicker');
    const selectedIcon = editing ? editing.icon : ICON_OPTIONS[0];
    picker.querySelectorAll('button').forEach(btn => {
      if (btn.getAttribute('data-icon') === selectedIcon) btn.classList.add('selected');
      btn.addEventListener('click', () => {
        picker.querySelectorAll('button').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
      });
    });

    if (editing && editing.image) {
      document.getElementById('catImageData').value = editing.image;
      document.getElementById('catImagePreview').classList.remove('hidden');
      document.getElementById('catImagePreviewImg').src = editing.image;
    }

    document.getElementById('catImage').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        document.getElementById('catImageData').value = reader.result;
        document.getElementById('catImagePreview').classList.remove('hidden');
        document.getElementById('catImagePreviewImg').src = reader.result;
      };
      reader.readAsDataURL(file);
    });

    document.getElementById('catCancelBtn').addEventListener('click', UI.closeModal);

    document.getElementById('categoryForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('catName').value.trim();
      const icon = picker.querySelector('button.selected').getAttribute('data-icon');
      const color = document.getElementById('catColor').value;
      const image = document.getElementById('catImageData').value || null;
      if (!name) return;

      const action = editing
        ? DataService.updateCategory(editing.id, { name, icon, color, image })
        : DataService.addCategory({ name, icon, color, image });

      action.then(() => {
        UI.showToast(editing ? 'Categoría actualizada' : 'Categoría creada', 'success');
        UI.closeModal();
        renderCategories();
      });
    });
  }

  /* ------------------------------ Búsqueda global ------------------------------ */

  function renderSearchResults(query) {
    const q = query.trim().toLowerCase();
    if (!q) {
      resultsPanel.innerHTML = '';
      categoriesToolbar.classList.remove('hidden');
      document.getElementById('categoryGrid').classList.remove('hidden');
      return;
    }
    categoriesToolbar.classList.add('hidden');
    document.getElementById('categoryGrid').classList.add('hidden');

    const matches = productsCache.filter(p => p.name.toLowerCase().includes(q));

    if (matches.length === 0) {
      resultsPanel.innerHTML =
        '<div class="search-results-panel"><div class="search-empty">😕 No se encontraron productos para "' + UI.escapeHtml(query) + '"</div></div>';
      return;
    }

    resultsPanel.innerHTML =
      '<div class="search-results-panel">' +
        '<div class="search-results-panel__header">' + matches.length + ' resultado(s) para "' + UI.escapeHtml(query) + '"</div>' +
        matches.map(prod => {
          const cat = categoriesCache.find(c => c.id === prod.categoryId);
          return (
            '<div class="search-result-item" data-cat="' + prod.categoryId + '" data-prod="' + prod.id + '">' +
              '<div class="sr-icon" style="background:' + (cat ? cat.color : '#374151') + '">' + (cat ? cat.icon : '📦') + '</div>' +
              '<div class="sr-info"><strong>' + UI.escapeHtml(prod.name) + '</strong><span>' + (cat ? UI.escapeHtml(cat.name) : 'Sin categoría') + ' · Disponible: ' + prod.quantity + '</span></div>' +
              '<div class="sr-price">' + UI.formatCurrency(prod.salePrice) + '</div>' +
            '</div>'
          );
        }).join('') +
      '</div>';

    resultsPanel.querySelectorAll('.search-result-item').forEach(item => {
      item.addEventListener('click', () => {
        window.location.href = 'categoria.html?cat=' + encodeURIComponent(item.getAttribute('data-cat')) + '&highlight=' + encodeURIComponent(item.getAttribute('data-prod'));
      });
    });
  }

  searchInput.addEventListener('input', (e) => renderSearchResults(e.target.value));

  renderCategories();
});
