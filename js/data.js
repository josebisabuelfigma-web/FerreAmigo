/**
 * data.js — Capa de datos de la aplicación.
 *
 * Toda la app llama únicamente a los métodos de "DataService".
 * Hoy los datos viven en localStorage (para poder mostrar el proyecto
 * funcionando sin backend). El día que haya API/base de datos real,
 * basta con reescribir el CUERPO de estos métodos para que hagan
 * fetch() al servidor — el resto del código (páginas y UI) no cambia
 * porque ya se consume como Promesas (async/await).
 */

const DataService = (function () {
  const KEYS = {
    categories: 'fa_categories',
    products: 'fa_products',
    sales: 'fa_sales',       // reservado para el módulo de Ventas y Gastos
    invoices: 'fa_invoices', // reservado para el módulo de Facturas
    activityLog: 'fa_activity_log',
    seedVersion: 'fa_seed_version'
  };

  const SEED_VERSION = '1';

  function read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      console.error('Error leyendo', key, e);
      return fallback;
    }
  }

  function write(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function uid(prefix) {
    return prefix + '_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
  }

  /* ------------------------------------------------------------------ */
  /* Semilla inicial de datos de demostración                            */
  /* ------------------------------------------------------------------ */

  function seedIfNeeded() {
    const currentVersion = localStorage.getItem(KEYS.seedVersion);
    if (currentVersion === SEED_VERSION) return;

    const categories = [
      { id: 'cat_tornilleria', name: 'Tornillería', icon: '🔩', color: '#D97706', image: null },
      { id: 'cat_griferia', name: 'Llaves y Grifería', icon: '🚰', color: '#2563EB', image: null },
      { id: 'cat_herramientas', name: 'Herramientas Manuales', icon: '🔧', color: '#4B5563', image: null },
      { id: 'cat_pinturas', name: 'Pinturas y Acabados', icon: '🎨', color: '#DC2626', image: null },
      { id: 'cat_electricos', name: 'Eléctricos', icon: '💡', color: '#CA8A04', image: null },
      { id: 'cat_cerrajeria', name: 'Cerrajería', icon: '🔑', color: '#7C3AED', image: null },
      { id: 'cat_plomeria', name: 'Plomería y Tuberías', icon: '🚿', color: '#0891B2', image: null },
      { id: 'cat_adhesivos', name: 'Adhesivos y Selladores', icon: '🧴', color: '#059669', image: null },
      { id: 'cat_medicion', name: 'Medición y Nivelación', icon: '📏', color: '#EA580C', image: null },
      { id: 'cat_jardineria', name: 'Jardinería', icon: '🌱', color: '#16A34A', image: null }
    ];

    const p = (categoryId, name, quantity, description, purchasePrice, salePrice) => ({
      id: uid('prod'),
      categoryId,
      name,
      quantity,
      description,
      purchasePrice,
      salePrice
    });

    const products = [
      // Tornillería
      p('cat_tornilleria', 'Tornillo cabeza plana 1/4" x 1"', 500, 'Tornillo punta plana para madera', 50, 100),
      p('cat_tornilleria', 'Tornillo autorroscante 8x1"', 350, 'Ideal para lámina metálica', 80, 150),
      p('cat_tornilleria', 'Tuerca hexagonal 3/8"', 200, 'Tuerca en acero galvanizado', 60, 120),
      p('cat_tornilleria', 'Arandela plana 1/2"', 400, 'Arandela de presión en acero', 30, 70),

      // Llaves y Grifería
      p('cat_griferia', 'Llave de agua tipo jardín 1/2"', 25, 'Llave de paso para exteriores', 12000, 22000),
      p('cat_griferia', 'Llave para lavamanos monocontrol', 15, 'Grifería cromada monomando', 45000, 78000),
      p('cat_griferia', 'Llave de paso de bola 1/2"', 30, 'Cierre rápido de cuarto de vuelta', 9000, 16000),
      p('cat_griferia', 'Registro de presión 1/2"', 20, 'Regula el flujo de agua', 14000, 25000),

      // Herramientas Manuales
      p('cat_herramientas', 'Destornillador plano 6"', 40, 'Mango ergonómico antideslizante', 6000, 12000),
      p('cat_herramientas', 'Destornillador de estrella #2', 40, 'Punta magnética', 6500, 13000),
      p('cat_herramientas', 'Alicate universal 8"', 22, 'Corte y sujeción multiusos', 15000, 28000),
      p('cat_herramientas', 'Martillo de uña 16oz', 18, 'Mango de fibra de vidrio', 20000, 38000),

      // Pinturas y Acabados
      p('cat_pinturas', 'Pintura vinilo blanco 1 galón', 30, 'Acabado mate para interiores', 45000, 75000),
      p('cat_pinturas', 'Esmalte sintético negro 1/4', 25, 'Alto brillo para metal y madera', 15000, 27000),
      p('cat_pinturas', 'Brocha 3"', 50, 'Cerda sintética para pintura al agua', 4000, 8500),
      p('cat_pinturas', 'Rodillo de espuma 9"', 35, 'Para pintura tipo vinilo', 5000, 10000),

      // Eléctricos
      p('cat_electricos', 'Bombillo LED 9W', 60, 'Luz blanca fría, bajo consumo', 6000, 12000),
      p('cat_electricos', 'Cable eléctrico THHN #12 (metro)', 300, 'Cable calibre 12 para instalaciones', 1800, 3200),
      p('cat_electricos', 'Toma corriente doble', 40, 'Toma polarizado 110V', 4500, 9000),
      p('cat_electricos', 'Interruptor sencillo', 45, 'Interruptor de palanca', 3500, 7000),

      // Cerrajería
      p('cat_cerrajeria', 'Candado 40mm', 30, 'Cuerpo de latón, alta seguridad', 12000, 22000),
      p('cat_cerrajeria', 'Cerradura de perilla', 15, 'Para puertas interiores', 25000, 45000),
      p('cat_cerrajeria', 'Bisagra 3" acero', 60, 'Bisagra reforzada para puertas', 3000, 6000),
      p('cat_cerrajeria', 'Cilindro de seguridad', 12, 'Reemplazo para cerraduras', 18000, 32000),

      // Plomería
      p('cat_plomeria', 'Tubo PVC 1/2" x 3m', 40, 'Tubería para agua fría', 8000, 14000),
      p('cat_plomeria', 'Codo PVC 1/2"', 100, 'Codo de 90 grados', 500, 1200),
      p('cat_plomeria', 'Cinta teflón', 80, 'Sellante para roscas', 800, 2000),
      p('cat_plomeria', 'Sifón para lavamanos', 20, 'Sifón en PVC blanco', 9000, 17000),

      // Adhesivos y Selladores
      p('cat_adhesivos', 'Silicona transparente 280ml', 45, 'Sellador multiuso', 7000, 13000),
      p('cat_adhesivos', 'Pegante para PVC', 30, 'Pegante de fraguado rápido', 9000, 16000),
      p('cat_adhesivos', 'Cinta doble faz 24mm', 50, 'Alta fijación', 3500, 7000),
      p('cat_adhesivos', 'Pegante epóxico', 25, 'Adhesivo bicomponente resistente', 12000, 21000),

      // Medición y Nivelación
      p('cat_medicion', 'Flexómetro 5m', 35, 'Cinta métrica con freno', 8000, 15000),
      p('cat_medicion', 'Nivel de burbuja 40cm', 20, 'Nivel de aluminio con 3 burbujas', 15000, 27000),
      p('cat_medicion', 'Escuadra metálica 12"', 18, 'Escuadra para trazos precisos', 9000, 16000),
      p('cat_medicion', 'Calibrador pie de rey', 10, 'Medición de precisión en acero', 22000, 38000),

      // Jardinería
      p('cat_jardineria', 'Tijera podadora', 20, 'Corte de ramas delgadas', 18000, 32000),
      p('cat_jardineria', 'Pala jardinera', 15, 'Mango de madera resistente', 20000, 36000),
      p('cat_jardineria', 'Manguera de jardín 15m', 12, 'Manguera reforzada 1/2"', 45000, 78000),
      p('cat_jardineria', 'Guantes de jardinería (par)', 30, 'Guantes reforzados', 6000, 11000)
    ];

    write(KEYS.categories, categories);
    write(KEYS.products, products);
    if (!localStorage.getItem(KEYS.sales)) write(KEYS.sales, []);
    if (!localStorage.getItem(KEYS.invoices)) write(KEYS.invoices, []);
    localStorage.setItem(KEYS.seedVersion, SEED_VERSION);
  }

  seedIfNeeded();

  /* ------------------------------------------------------------------ */
  /* Categorías                                                          */
  /* ------------------------------------------------------------------ */

  function getCategories() {
    return Promise.resolve(read(KEYS.categories, []));
  }

  function getCategoryById(id) {
    return getCategories().then(cats => cats.find(c => c.id === id) || null);
  }

  function addCategory({ name, icon, color, image }) {
    return getCategories().then(cats => {
      const category = {
        id: uid('cat'),
        name: name.trim(),
        icon: icon || '📦',
        color: color || '#374151',
        image: image || null
      };
      cats.push(category);
      write(KEYS.categories, cats);
      return category;
    });
  }

  function updateCategory(id, data) {
    return getCategories().then(cats => {
      const idx = cats.findIndex(c => c.id === id);
      if (idx === -1) throw new Error('Categoría no encontrada');
      cats[idx] = Object.assign({}, cats[idx], data);
      write(KEYS.categories, cats);
      return cats[idx];
    });
  }

  function deleteCategory(id) {
    return Promise.all([getCategories(), getProducts()]).then(([cats, products]) => {
      const remaining = cats.filter(c => c.id !== id);
      write(KEYS.categories, remaining);
      const remainingProducts = products.filter(p => p.categoryId !== id);
      write(KEYS.products, remainingProducts);
      return true;
    });
  }

  /* ------------------------------------------------------------------ */
  /* Productos                                                           */
  /* ------------------------------------------------------------------ */

  function getProducts(categoryId) {
    return Promise.resolve(read(KEYS.products, [])).then(all =>
      categoryId ? all.filter(p => p.categoryId === categoryId) : all
    );
  }

  function getProductById(id) {
    return getProducts().then(all => all.find(p => p.id === id) || null);
  }

  function addProduct(categoryId, { name, quantity, description, purchasePrice, salePrice }) {
    return getProducts().then(all => {
      const product = {
        id: uid('prod'),
        categoryId,
        name: (name || '').trim(),
        quantity: Number(quantity) || 0,
        description: (description || '').trim(),
        purchasePrice: Number(purchasePrice) || 0,
        salePrice: Number(salePrice) || 0
      };
      all.push(product);
      write(KEYS.products, all);
      return product;
    });
  }

  function updateProduct(id, data) {
    return getProducts().then(all => {
      const idx = all.findIndex(p => p.id === id);
      if (idx === -1) throw new Error('Producto no encontrado');
      const cleaned = Object.assign({}, all[idx], data);
      if (data.quantity !== undefined) cleaned.quantity = Number(data.quantity) || 0;
      if (data.purchasePrice !== undefined) cleaned.purchasePrice = Number(data.purchasePrice) || 0;
      if (data.salePrice !== undefined) cleaned.salePrice = Number(data.salePrice) || 0;
      all[idx] = cleaned;
      write(KEYS.products, all);
      return cleaned;
    });
  }

  function deleteProduct(id) {
    return getProducts().then(all => {
      const remaining = all.filter(p => p.id !== id);
      write(KEYS.products, remaining);
      return true;
    });
  }

  function searchProducts(query) {
    const q = (query || '').trim().toLowerCase();
    if (!q) return Promise.resolve([]);
    return getProducts().then(all => all.filter(p => p.name.toLowerCase().includes(q)));
  }

  /* ------------------------------------------------------------------ */
  /* Ventas y Gastos                                                     */
  /* (módulo con candado en modulos.html; la lógica ya está lista        */
  /* para cuando el cliente adquiera el módulo)                         */
  /* ------------------------------------------------------------------ */

  function getMovements() {
    return Promise.resolve(read(KEYS.sales, []));
  }

  function getMovementsByRange(dateFrom, dateTo) {
    return getMovements().then(all => all.filter(m => {
      if (dateFrom && m.date < dateFrom) return false;
      if (dateTo && m.date > dateTo) return false;
      return true;
    }));
  }

  function addMovement({ type, amount, description, date }) {
    return getMovements().then(all => {
      const movement = {
        id: uid('mov'),
        type: type === 'gasto' ? 'gasto' : 'venta',
        amount: Number(amount) || 0,
        description: (description || '').trim(),
        date: date || new Date().toISOString().slice(0, 10),
        createdAt: Date.now()
      };
      all.push(movement);
      write(KEYS.sales, all);
      return movement;
    });
  }

  function updateMovement(id, data) {
    return getMovements().then(all => {
      const idx = all.findIndex(m => m.id === id);
      if (idx === -1) throw new Error('Movimiento no encontrado');
      const cleaned = Object.assign({}, all[idx], data);
      if (data.amount !== undefined) cleaned.amount = Number(data.amount) || 0;
      all[idx] = cleaned;
      write(KEYS.sales, all);
      return cleaned;
    });
  }

  function deleteMovement(id) {
    return getMovements().then(all => {
      write(KEYS.sales, all.filter(m => m.id !== id));
      return true;
    });
  }

  /* ------------------------------------------------------------------ */
  /* Facturas de Proveedores                                             */
  /* (módulo con candado en modulos.html; la lógica ya está lista        */
  /* para cuando el cliente adquiera el módulo)                         */
  /* ------------------------------------------------------------------ */

  function getInvoices() {
    return Promise.resolve(read(KEYS.invoices, []));
  }

  function getInvoiceById(id) {
    return getInvoices().then(all => all.find(i => i.id === id) || null);
  }

  function addInvoice({ provider, invoiceNumber, date, amount, fileName, fileData }) {
    return getInvoices().then(all => {
      const invoice = {
        id: uid('inv'),
        provider: (provider || '').trim(),
        invoiceNumber: (invoiceNumber || '').trim(),
        date: date || new Date().toISOString().slice(0, 10),
        amount: Number(amount) || 0,
        fileName: fileName || null,
        fileData: fileData || null,
        createdAt: Date.now()
      };
      all.push(invoice);
      write(KEYS.invoices, all);
      return invoice;
    });
  }

  function updateInvoice(id, data) {
    return getInvoices().then(all => {
      const idx = all.findIndex(i => i.id === id);
      if (idx === -1) throw new Error('Factura no encontrada');
      const cleaned = Object.assign({}, all[idx], data);
      if (data.amount !== undefined) cleaned.amount = Number(data.amount) || 0;
      all[idx] = cleaned;
      write(KEYS.invoices, all);
      return cleaned;
    });
  }

  function deleteInvoice(id) {
    return getInvoices().then(all => {
      write(KEYS.invoices, all.filter(i => i.id !== id));
      return true;
    });
  }

  function searchInvoices(query) {
    const q = (query || '').trim().toLowerCase();
    if (!q) return getInvoices();
    return getInvoices().then(all => all.filter(i =>
      i.provider.toLowerCase().includes(q) || i.invoiceNumber.toLowerCase().includes(q)
    ));
  }

  /* ------------------------------------------------------------------ */
  /* Registro de actividad                                               */
  /* (visible solo para el perfil administrador, ver auth.js requireAdmin) */
  /* ------------------------------------------------------------------ */

  function logActivity({ user, role, action, details }) {
    return Promise.resolve(read(KEYS.activityLog, [])).then(log => {
      log.push({
        id: uid('log'),
        user: user || 'desconocido',
        role: role || 'auxiliar',
        action,
        details: details || '',
        timestamp: Date.now()
      });
      write(KEYS.activityLog, log);
      return true;
    });
  }

  function getActivityLog() {
    return Promise.resolve(read(KEYS.activityLog, [])).then(log =>
      log.slice().sort((a, b) => b.timestamp - a.timestamp)
    );
  }

  return {
    getCategories, getCategoryById, addCategory, updateCategory, deleteCategory,
    getProducts, getProductById, addProduct, updateProduct, deleteProduct, searchProducts,
    getMovements, getMovementsByRange, addMovement, updateMovement, deleteMovement,
    getInvoices, getInvoiceById, addInvoice, updateInvoice, deleteInvoice, searchInvoices,
    logActivity, getActivityLog
  };
})();
