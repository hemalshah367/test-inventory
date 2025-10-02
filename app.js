document.addEventListener('DOMContentLoaded', async () => {
    
    // --- IMPORTANT: PASTE YOUR SUPABASE URL AND KEY HERE ---
    const SUPABASE_URL = 'https://kcdgshenzcazfhchgysi.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjZGdzaGVuemNhemZoY2hneXNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ4NDIxNzIsImV4cCI6MjA3MDQxODE3Mn0.uJMrKeg3uELaDtJ67fefeMo3-lwOFp52pvB_7uFmCKc';
    // ----------------------------------------------------

    if (!SUPABASE_URL || SUPABASE_URL === 'YOUR_SUPABASE_URL') {
        if (document.body.id !== 'login-page') window.location.href = 'login.html';
        const errorEl = document.getElementById('error-message');
        if (errorEl) { errorEl.textContent = "Supabase URL & Key not configured in app.js!"; errorEl.classList.remove('hidden'); }
        return;
    }

    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

    let categories = [], products = [], rawCategories = [], rawProducts = [];

    const { data: { user } } = await supabase.auth.getUser();
    const pageId = document.body.id;

    if (!user && pageId !== 'login-page') { window.location.href = 'login.html'; return; }
    if (user && pageId === 'login-page') { window.location.href = 'index.html'; return; }

    if (pageId !== 'login-page') {
        const logoutBtn = document.getElementById('logout-btn');
        if(logoutBtn) { logoutBtn.addEventListener('click', async () => { await supabase.auth.signOut(); window.location.href = 'login.html'; }); }
    }

    async function loadAllData() {
        const [catRes, prodRes, rawCatRes, rawProdRes] = await Promise.all([
            supabase.from('categories').select('*'),
            supabase.from('products').select('*'),
            supabase.from('raw_material_categories').select('*'),
            supabase.from('raw_materials').select('*')
        ]);
        if (catRes.error) console.error("Error loading categories:", catRes.error.message); else categories = catRes.data;
        if (prodRes.error) console.error("Error loading products:", prodRes.error.message); else products = prodRes.data;
        if (rawCatRes.error) console.error("Error loading raw categories:", rawCatRes.error.message); else rawCategories = rawCatRes.data;
        if (rawProdRes.error) console.error("Error loading raw products:", rawProdRes.error.message); else rawProducts = rawProdRes.data;
    }

    async function runPageLogic() {
        if (pageId !== 'login-page') await loadAllData();
        
        if (pageId === 'login-page') initLoginPage();
        else if (pageId === 'dashboard-page') initDashboard();
        else if (pageId === 'categories-page') initGenericCategoriesPage('Products', categories, products, "products.html");
        else if (pageId === 'products-page') initGenericProductsPage('Products', categories, products);
        else if (pageId === 'raw-categories-page') initGenericCategoriesPage('Raw Materials', rawCategories, rawProducts, "raw_materials.html");
        else if (pageId === 'raw-products-page') initGenericProductsPage('Raw Materials', rawCategories, rawProducts);
    }
    
    function initLoginPage() {
        const form = document.getElementById('login-form');
        const errorEl = document.getElementById('error-message');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = form.email.value;
            const password = form.password.value;
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) { errorEl.textContent = error.message; errorEl.classList.remove('hidden'); } 
            else { window.location.href = 'index.html'; }
        });
    }

    function initDashboard() {
        const productValueEl = document.getElementById('product-value');
        const rawMaterialValueEl = document.getElementById('raw-material-value');
        const entireValueEl = document.getElementById('entire-inventory-value');
        const productValue = products.reduce((sum, p) => sum + ((p.quantity || 0) * (p.price || 0)), 0);
        const rawMaterialValue = rawProducts.reduce((sum, p) => sum + ((p.quantity || 0) * (p.price || 0)), 0);
        const entireValue = productValue + rawMaterialValue;
        productValueEl.textContent = `₹${productValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        rawMaterialValueEl.textContent = `₹${rawMaterialValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        entireValueEl.textContent = `₹${entireValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }

    function initGenericCategoriesPage(systemName, categoriesRef, productsRef, productPageUrl) {
        const grid = document.getElementById('category-grid'), modal = document.getElementById('category-modal'), form = document.getElementById('category-form'), addBtn = document.getElementById('add-category-btn'), removeImageBtn = document.getElementById('remove-image-btn');
        let categoryImage = "";
        const renderCategories = () => {
            grid.innerHTML = '';
            const noCatMsg = document.getElementById('no-categories-message');
            if (!categoriesRef || categoriesRef.length === 0) { noCatMsg.classList.remove('hidden'); return; }
            noCatMsg.classList.add('hidden');
            categoriesRef.forEach(cat => {
                const productCount = (productsRef || []).filter(p => p.category_id === cat.id).length;
                const card = document.createElement('a'); card.className = 'category-card'; card.href = `${productPageUrl}?categoryId=${cat.id}`;
                const defaultImg = 'https://via.placeholder.com/260x180/cccccc/FFFFFF?text=No+Image';
                card.innerHTML = `<div class="category-card-img-container"><img src="${cat.image || defaultImg}" alt="${cat.name}"><button type="button" class="edit-category-btn" data-id="${cat.id}"><i class="fas fa-pencil-alt"></i></button></div><div class="category-card-info"><h3>${cat.name}</h3><span class="product-count">${productCount}</span></div>`;
                grid.appendChild(card);
            });
        };
        const openCategoryModal = (catId = null) => {
            form.reset();
            const preview = document.getElementById('category-image-preview'), titleEl = document.getElementById('category-modal-title'), idEl = document.getElementById('category-id'), nameEl = document.getElementById('category-name'), deleteBtn = document.getElementById('delete-category-btn');
            preview.innerHTML = ''; categoryImage = "";
            if (catId) {
                const cat = categoriesRef.find(c => c.id === catId);
                titleEl.textContent = `Edit ${systemName} Category`; idEl.value = cat.id; nameEl.value = cat.name;
                if (cat.image) { preview.innerHTML = `<img src="${cat.image}" class="primary">`; categoryImage = cat.image; removeImageBtn.classList.remove('hidden'); } 
                else { removeImageBtn.classList.add('hidden'); }
                deleteBtn.classList.remove('hidden');
            } else {
                titleEl.textContent = `Add New ${systemName} Category`; idEl.value = '';
                deleteBtn.classList.add('hidden'); removeImageBtn.classList.add('hidden');
            }
            modal.classList.remove('hidden');
        };
        grid.addEventListener('click', e => { if (e.target.closest('.edit-category-btn')) { e.preventDefault(); openCategoryModal(e.target.closest('.edit-category-btn').dataset.id); } });
        addBtn.addEventListener('click', () => openCategoryModal());
        modal.querySelector('.modal-close-btn').addEventListener('click', () => modal.classList.add('hidden'));
        modal.addEventListener('click', e => { if (e.target === modal) modal.classList.add('hidden'); });
        removeImageBtn.addEventListener('click', () => { categoryImage = ''; document.getElementById('category-image-preview').innerHTML = ''; removeImageBtn.classList.add('hidden'); });
        document.getElementById('category-image-upload').addEventListener('change', e => { const file = e.target.files[0]; if (!file) return; const reader = new FileReader(); reader.onloadend = () => { categoryImage = reader.result; document.getElementById('category-image-preview').innerHTML = `<img src="${categoryImage}" class="primary">`; removeImageBtn.classList.remove('hidden'); }; reader.readAsDataURL(file); });
        form.addEventListener('submit', async (e) => {
            e.preventDefault(); const id = document.getElementById('category-id').value; const name = document.getElementById('category-name').value.trim();
            if (!name) { alert('Category name is required.'); return; }
            const isProducts = systemName === 'Products';
            const tableName = isProducts ? 'categories' : 'raw_material_categories';
            let error;
            if (id) {
                const { data: updatedData, error: updateError } = await supabase.from(tableName).update({ name: name, image: categoryImage }).eq('id', id).select().single();
                error = updateError;
                if (!error) { const index = categoriesRef.findIndex(c => c.id === id); if (index > -1) categoriesRef[index] = updatedData; }
            } else {
                const { data: newData, error: insertError } = await supabase.from(tableName).insert({ name: name, image: categoryImage }).select().single();
                error = insertError;
                if (!error) categoriesRef.push(newData);
            }
            if (error) { alert(error.message); } 
            else { renderCategories(); modal.classList.add('hidden'); }
        });
        document.getElementById('delete-category-btn').addEventListener('click', async () => {
            const id = document.getElementById('category-id').value;
            if (confirm(`Are you sure? This will also delete all items inside this category.`)) {
                const isProducts = systemName === 'Products';
                const tableName = isProducts ? 'categories' : 'raw_material_categories';
                const { error } = await supabase.from(tableName).delete().eq('id', id);
                if (error) { alert(error.message); } 
                else { const index = categoriesRef.findIndex(c => c.id === id); if (index > -1) categoriesRef.splice(index, 1); await loadAllData(); renderCategories(); modal.classList.add('hidden'); }
            }
        });
        renderCategories();
    }
    
    function initGenericProductsPage(systemName, categoriesRef, productsRef) {
        const urlParams = new URLSearchParams(window.location.search), categoryId = urlParams.get('categoryId'), category = categoriesRef.find(c => c.id === categoryId);
        if (!category) { document.getElementById('page-title').textContent = "Category Not Found"; document.getElementById('add-product-btn').style.display = 'none'; return; }
        document.title = `${systemName} in ${category.name}`; document.getElementById('page-title').innerHTML = `<i class="fas fa-folder-open"></i> ${category.name}`;
        
        const productGrid = document.getElementById('product-grid'), searchBar = document.getElementById('search-bar'), addProductBtn = document.getElementById('add-product-btn'), noProductsMessage = document.getElementById('no-products-message'), productModal = document.getElementById('product-modal'), productForm = document.getElementById('product-form'), stockModal = document.getElementById('manage-stock-modal'), deleteBtn = document.getElementById('delete-product-btn'), imageUpload = document.getElementById('image-upload'), addComponentBtn = document.getElementById('add-component-btn'), stockForm = document.getElementById('stock-form');
        let currentComponents = [], uploadedImages = [];
        const isProducts = systemName === 'Products';
        const tableName = isProducts ? 'products' : 'raw_materials';

        const renderProducts = () => {
            const searchTerm = searchBar.value.toLowerCase();
            const productsInCategory = productsRef.filter(p => p.category_id === categoryId && (p.name.toLowerCase().includes(searchTerm) || (p.id && p.id.toLowerCase().includes(searchTerm))));
            productGrid.innerHTML = ''; if (productsInCategory.length === 0) { noProductsMessage.classList.remove('hidden'); return; }
            noProductsMessage.classList.add('hidden');
            productsInCategory.forEach(product => {
                const isLowStock = product.quantity <= product.low_stock_threshold; const inventoryValue = (product.quantity || 0) * (product.price || 0);
                const card = document.createElement('div'); card.className = 'product-card'; if (isLowStock) card.classList.add('low-stock');
                const primaryImage = product.images && product.images.length > 0 ? product.images[0] : 'https://via.placeholder.com/250/cccccc/FFFFFF?text=No+Image';
                const unitLabel = isProducts ? 'Stock' : 'Length'; const unitSuffix = isProducts ? '' : ' m';
                card.innerHTML = `<img src="${primaryImage}" alt="${product.name}"><div class="product-card-info"><h3>${product.name}</h3><p class="price">₹${parseFloat(product.price || 0).toLocaleString('en-IN')}</p><p class="quantity">${unitLabel}: ${product.quantity}${unitSuffix}</p></div><div class="product-card-actions"><button class="action-btn manage-btn" data-id="${product.id}" data-action="manage"><i class="fas fa-boxes"></i> Manage Stock</button><button class="action-btn edit-btn" data-id="${product.id}" data-action="edit"><i class="fas fa-edit"></i> Edit</button></div><div class="product-manage-bar"><span class="inventory-value">Value: ₹${inventoryValue.toLocaleString('en-IN')}</span><span class="stock-status ${isLowStock ? 'low' : 'ok'}">${isLowStock ? 'Low Stock' : 'In Stock'}</span></div>`;
                productGrid.appendChild(card);
            });
        };
        
        const openEditModal = (productId = null) => {
            productForm.reset(); const categorySelect = document.getElementById('product-category');
            categorySelect.innerHTML = categoriesRef.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
            let product = { category_id: categoryId, quantity: 0, price: 0, low_stock_threshold: 5, components: [], images: [] };
            if (productId) { const found = productsRef.find(p => p.id === productId); if (found) product = found; document.getElementById('modal-title').textContent = `Edit ${systemName.slice(0, -1)}`; document.getElementById('product-sku').disabled = true; deleteBtn.classList.remove('hidden'); } 
            else { document.getElementById('modal-title').textContent = `Add New ${systemName.slice(0, -1)}`; document.getElementById('product-sku').disabled = false; deleteBtn.classList.add('hidden'); if (isProducts) { document.getElementById('product-sku').value = 'PROD-'; } else { document.getElementById('product-sku').value = 'RAW-'; } }
            document.getElementById('product-id').value = product.id || ''; document.getElementById('product-name').value = product.name || ''; document.getElementById('product-sku').value = product.id || document.getElementById('product-sku').value; document.getElementById('product-quantity').value = product.quantity; document.getElementById('product-price').value = product.price; document.getElementById('low-stock-threshold').value = product.low_stock_threshold; categorySelect.value = product.category_id; uploadedImages = [...(product.images || [])]; currentComponents = JSON.parse(JSON.stringify(product.components || []));
            renderImagePreviews(); renderComponentsInModal(); productModal.classList.remove('hidden');
        };

        const renderImagePreviews = () => { document.getElementById('image-previews').innerHTML = uploadedImages.map((src, i) => `<img src="${src}" class="${i === 0 ? 'primary' : ''}">`).join(''); };
        const renderComponentsInModal = () => { document.getElementById('component-list').innerHTML = (currentComponents || []).map(c => `<div class="variant-item"><span>${c.name}</span><span class="variant-qty">Qty: ${c.quantity}</span><button type="button" class="delete-variant-btn" data-name="${c.name}">&times;</button></div>`).join(''); };
        const closeEditModal = () => productModal.classList.add('hidden'); const closeStockModal = () => stockModal.classList.add('hidden');
        const handleFormSubmit = async (e) => {
            e.preventDefault(); const id = document.getElementById('product-id').value; const sku = document.getElementById('product-sku').value.trim();
            if (!sku) { alert('SKU is required.'); return; } if (!id && productsRef.some(p => p.id === sku)) { alert('SKU already exists.'); return; }
            const productData = { id: id || sku, category_id: document.getElementById('product-category').value, name: document.getElementById('product-name').value.trim(), images: uploadedImages, quantity: parseInt(document.getElementById('product-quantity').value, 10) || 0, price: parseFloat(document.getElementById('product-price').value) || 0, low_stock_threshold: parseInt(document.getElementById('low-stock-threshold').value, 10) || 0, components: currentComponents };
            let error;
            if (id) {
                const { data: updatedData, error: updateError } = await supabase.from(tableName).update(productData).eq('id', id).select().single();
                error = updateError;
                if (!error) { const index = productsRef.findIndex(p => p.id === id); if (index > -1) productsRef[index] = updatedData; }
            } else {
                const { data: newData, error: insertError } = await supabase.from(tableName).insert(productData).select().single();
                error = insertError;
                if (!error) productsRef.push(newData);
            }
            if (error) { alert(error.message); } else { renderProducts(); closeEditModal(); }
        };
        const openStockModal = (productId) => { const product = productsRef.find(p => p.id === productId); if (!product) return; document.getElementById('stock-product-id').value = productId; document.getElementById('stock-modal-product-name').textContent = product.name; const list = document.getElementById('stock-variant-list'); list.innerHTML = ''; const mainItem = document.createElement('div'); mainItem.className = 'stock-variant-item main-product'; mainItem.innerHTML = `<label for="stock-qty-main">${product.name} (Main)</label><div class="quantity-input"><button type="button" class="quantity-btn" data-action="decrement">-</button><input type="number" id="stock-qty-main" value="${product.quantity}" min="0" data-name="--main--"><button type="button" class="quantity-btn" data-action="increment">+</button></div>`; list.appendChild(mainItem);(product.components || []).forEach(c => { const item = document.createElement('div'); item.className = 'stock-variant-item'; const safeNameId = c.name.replace(/[^a-zA-Z0-9]/g, ''); item.innerHTML = `<label for="stock-qty-${safeNameId}">${c.name}</label><div class="quantity-input"><button type="button" class="quantity-btn" data-action="decrement">-</button><input type="number" id="stock-qty-${safeNameId}" value="${c.quantity}" min="0" data-name="${c.name}"><button type="button" class="quantity-btn" data-action="increment">+</button></div>`; list.appendChild(item); }); stockModal.classList.remove('hidden'); };
        const handleStockFormSubmit = async (event) => {
            event.preventDefault(); const productId = document.getElementById('stock-product-id').value; const product = productsRef.find(p => p.id === productId); if (!product) return;
            const updates = {};
            document.getElementById('stock-variant-list').querySelectorAll('input[type="number"]').forEach(input => { const name = input.dataset.name; const newQuantity = parseInt(input.value, 10); if (name === '--main--') { updates.quantity = newQuantity; } else { const compIndex = (product.components || []).findIndex(c => c.name === name); if (compIndex > -1) product.components[compIndex].quantity = newQuantity; } });
            updates.components = product.components;
            const { data: updatedData, error } = await supabase.from(tableName).update(updates).eq('id', productId).select().single();
            if(error) { alert(error.message); }
            else { const index = productsRef.findIndex(p => p.id === productId); if (index > -1) productsRef[index] = updatedData; renderProducts(); closeStockModal(); }
        };
        const handleImageUpload = (event) => { Array.from(event.target.files).forEach(file => { const reader = new FileReader(); reader.onloadend = () => { uploadedImages.push(reader.result); renderImagePreviews(); }; reader.readAsDataURL(file); }); };
        const handleDelete = async () => { const id = document.getElementById('product-id').value; if (confirm(`Are you sure you want to delete this item?`)) { const { error } = await supabase.from(tableName).delete().eq('id', id); if (error) { alert(error.message); } else { const index = productsRef.findIndex(p => p.id === id); if (index > -1) productsRef.splice(index, 1); renderProducts(); closeEditModal(); } } };
        const handleAddComponent = () => { const name = document.getElementById('component-name').value.trim(); const quantity = parseInt(document.getElementById('component-quantity').value, 10) || 0; if (!name) { alert('Component Name is required.'); return; } if ((currentComponents || []).some(c => c.name.toLowerCase() === name.toLowerCase())) { alert('Component Name must be unique.'); return; } if(!currentComponents) currentComponents = []; currentComponents.push({ name, quantity }); renderComponentsInModal(); document.getElementById('component-name').value = ''; document.getElementById('component-quantity').value = ''; };

        productGrid.addEventListener('click', (event) => { const btn = event.target.closest('.action-btn'); if (btn) { if (btn.dataset.action === 'manage') openStockModal(btn.dataset.id); else if (btn.dataset.action === 'edit') openEditModal(btn.dataset.id); } });
        productModal.addEventListener('click', (e) => { if (e.target.matches('.delete-variant-btn')) { currentComponents = currentComponents.filter(c => c.name !== e.target.dataset.name); renderComponentsInModal(); } });
        productForm.addEventListener('click', e => { if (e.target.matches('.quantity-btn')) { const input = e.target.parentElement.querySelector('input'); let val = parseInt(input.value, 10); if(!isNaN(val)) { if(e.target.dataset.action === 'increment') input.value = val + 1; else if (val > 0) input.value = val - 1; } else { input.value = 0; } } });
        stockForm.addEventListener('click', e => { if (e.target.matches('.quantity-btn')) { const input = e.target.parentElement.querySelector('input'); let val = parseInt(input.value, 10); if(!isNaN(val)) { if(e.target.dataset.action === 'increment') input.value = val + 1; else if (val > 0) input.value = val - 1; } else { input.value = 0; } } });
        addProductBtn.addEventListener('click', () => openEditModal());
        addComponentBtn.addEventListener('click', handleAddComponent);
        productForm.addEventListener('submit', handleFormSubmit);
        stockForm.addEventListener('submit', handleStockFormSubmit);
        searchBar.addEventListener('input', renderProducts);
        deleteBtn.addEventListener('click', handleDelete);
        imageUpload.addEventListener('change', handleImageUpload);
        productModal.querySelector('.modal-close-btn').addEventListener('click', closeEditModal);
        stockModal.querySelector('.modal-close-btn').addEventListener('click', closeStockModal);
        productModal.addEventListener('click', e => { if (e.target === productModal) closeEditModal(); });
        stockModal.addEventListener('click', e => { if (e.target === stockModal) closeStockModal(); });
        
        renderProducts();
    }
    
    runPageLogic();
});
