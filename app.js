document.addEventListener('DOMContentLoaded', async () => {
    console.log("Checkpoint 1: DOMContentLoaded event fired. app.js is running.");

    const SUPABASE_URL = 'YOUR_SUPABASE_URL';
    const SUPABASE_KEY = 'YOUR_SUPABASE_ANON_KEY';

    if (!SUPABASE_URL || SUPABASE_URL === 'YOUR_SUPABASE_URL') {
        console.error("STOP: Supabase URL & Key not configured.");
        if (document.body.id !== 'login-page') window.location.href = 'login.html';
        const errorEl = document.getElementById('error-message');
        if (errorEl) { errorEl.textContent = "Supabase URL & Key not configured in app.js!"; errorEl.classList.remove('hidden'); }
        return;
    }

    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    console.log("Checkpoint 2: Supabase client created.");

    let categories = [], products = [], rawCategories = [], rawProducts = [];

    const { data: { user } } = await supabase.auth.getUser();
    console.log("Checkpoint 3: User authentication checked. User:", user);
    const pageId = document.body.id;

    if (!user && pageId !== 'login-page') { window.location.href = 'login.html'; return; }
    if (user && pageId === 'login-page') { window.location.href = 'index.html'; return; }

    if (pageId !== 'login-page') {
        const logoutBtn = document.getElementById('logout-btn');
        if(logoutBtn) { logoutBtn.addEventListener('click', async () => { await supabase.auth.signOut(); window.location.href = 'login.html'; }); }
    }

    async function loadAllData() {
        console.log("Checkpoint 4: Starting to load all data from Supabase...");
        const [catRes, prodRes, rawCatRes, rawProdRes] = await Promise.all([
            supabase.from('categories').select('*'),
            supabase.from('products').select('*'),
            supabase.from('raw_material_categories').select('*'),
            supabase.from('raw_materials').select('*')
        ]);
        console.log("Checkpoint 5: Data loading finished.");

        if (catRes.error) console.error("Error loading categories:", catRes.error.message); else categories = catRes.data;
        if (prodRes.error) console.error("Error loading products:", prodRes.error.message); else products = prodRes.data;
        if (rawCatRes.error) console.error("Error loading raw categories:", rawCatRes.error.message); else rawCategories = rawCatRes.data;
        if (rawProdRes.error) console.error("Error loading raw products:", rawProdRes.error.message); else rawProducts = rawProdRes.data;
        console.log("Data loaded into arrays:", { categories, products, rawCategories, rawProducts });
    }

    async function runPageLogic() {
        console.log("Checkpoint 6: Running page logic for page ID:", pageId);
        if(pageId !== 'login-page') await loadAllData();
        
        if (pageId === 'login-page') initLoginPage();
        else if (pageId === 'dashboard-page') initDashboard();
        else if (pageId === 'categories-page') initGenericCategoriesPage('Products', categories, products, "products.html");
        else if (pageId === 'products-page') initGenericProductsPage('Products', categories, products);
        else if (pageId === 'raw-categories-page') initGenericCategoriesPage('Raw Materials', rawCategories, rawProducts, "raw_materials.html");
        else if (pageId === 'raw-products-page') initGenericProductsPage('Raw Materials', rawCategories, rawProducts);
    }

    // All other function definitions are below, unchanged.
    // ...

    // --- RUN THE APP ---
    runPageLogic();


    function initLoginPage() { /* ... function code ... */ }
    function initDashboard() { /* ... function code ... */ }
    function initGenericCategoriesPage(systemName, categoriesRef, productsRef, productPageUrl) {
        console.log(`Checkpoint 7: Initializing Generic Categories Page for "${systemName}"`);
        const grid = document.getElementById('category-grid');
        const modal = document.getElementById('category-modal');
        const form = document.getElementById('category-form');
        const addBtn = document.getElementById('add-category-btn');

        const renderCategories = () => {
            console.log("Rendering categories...");
            grid.innerHTML = '';
            if(!categoriesRef || categoriesRef.length === 0) {
                console.log("No categories to render.");
                document.getElementById('no-categories-message').classList.remove('hidden');
                return;
            }
            document.getElementById('no-categories-message').classList.add('hidden');
            categoriesRef.forEach(cat => { /* ... rendering logic ... */ });
        };
        
        console.log("Attaching button listeners...");
        addBtn.addEventListener('click', () => openCategoryModal());
        // ... all other listeners
        console.log("Listeners attached.");

        renderCategories();
    }
    
    function initGenericProductsPage(systemName, categoriesRef, productsRef) {
         console.log(`Checkpoint 7: Initializing Generic Products Page for "${systemName}"`);
        // ... all the code for this function
    }

    // --- PASTE THE FULL, CORRECT CODE FROM THE PREVIOUS "FINAL" VERSION HERE ---
    // Make sure all functions are complete.
});
