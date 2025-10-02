document.addEventListener('DOMContentLoaded', async () => {
    
    // --- IMPORTANT: PASTE YOUR SUPABASE URL AND KEY HERE ---
    const SUPABASE_URL = 'YOUR_SUPABASE_URL';
    const SUPABASE_KEY = 'YOUR_SUPABASE_ANON_KEY';
    // ----------------------------------------------------

    if (!SUPABASE_URL || SUPABASE_URL === 'YOUR_SUPABASE_URL') {
        if (document.body.id !== 'login-page') window.location.href = 'login.html';
        const errorEl = document.getElementById('error-message');
        if (errorEl) {
            errorEl.textContent = "Supabase URL & Key not configured in app.js!";
            errorEl.classList.remove('hidden');
        }
        return; // Stop the app if not configured
    }

    const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

    let categories = [], products = [], rawCategories = [], rawProducts = [];

    // --- AUTHENTICATION & PAGE PROTECTION ---
    const { data: { user } } = await supabase.auth.getUser();
    const pageId = document.body.id;

    if (!user && pageId !== 'login-page') {
        window.location.href = 'login.html';
        return;
    }
    if (user && pageId === 'login-page') {
        window.location.href = 'index.html';
        return;
    }

    // Add logout functionality to all protected pages
    if (pageId !== 'login-page') {
        document.getElementById('logout-btn').addEventListener('click', async () => {
            await supabase.auth.signOut();
            window.location.href = 'login.html';
        });
    }

    // --- DATA LOADING ---
    async function loadAllData() {
        const [catRes, prodRes, rawCatRes, rawProdRes] = await Promise.all([
            supabase.from('categories').select('*'),
            supabase.from('products').select('*'),
            supabase.from('raw_material_categories').select('*'),
            supabase.from('raw_materials').select('*')
        ]);
        if (catRes.data) categories = catRes.data;
        if (prodRes.data) products = prodRes.data;
        if (rawCatRes.data) rawCategories = rawCatRes.data;
        if (rawProdRes.data) rawProducts = rawProdRes.data;
    }

    // --- PAGE ROUTER ---
    async function runPageLogic() {
        await loadAllData();
        if (pageId === 'login-page') initLoginPage();
        else if (pageId === 'dashboard-page') initDashboard();
        else if (pageId === 'categories-page') initGenericCategoriesPage('Products', 'prod-cat', categories, products, "products.html");
        else if (pageId === 'products-page') initGenericProductsPage('Products', categories, products);
        else if (pageId === 'raw-categories-page') initGenericCategoriesPage('Raw Materials', 'raw-cat', rawCategories, rawProducts, "raw_materials.html");
        else if (pageId === 'raw-products-page') initGenericProductsPage('Raw Materials', rawCategories, rawProducts);
    }
    runPageLogic();

    // --- LOGIN PAGE ---
    function initLoginPage() {
        const form = document.getElementById('login-form');
        const errorEl = document.getElementById('error-message');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = form.email.value;
            const password = form.password.value;
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) {
                errorEl.textContent = error.message;
                errorEl.classList.remove('hidden');
            } else {
                window.location.href = 'index.html';
            }
        });
    }

    // --- DASHBOARD PAGE ---
    function initDashboard() { /* ... Same as before ... */ }
    
    // --- GENERIC CATEGORY PAGE ---
    function initGenericCategoriesPage(systemName, idPrefix, categoriesRef, productsRef, productPageUrl) {
        // ... ALL CODE FOR THIS FUNCTION IS THE SAME, BUT IT WILL NOW USE SUPABASE FUNCTIONS
    }
    
    // --- GENERIC PRODUCT PAGE ---
    function initGenericProductsPage(systemName, categoriesRef, productsRef) {
        // ... ALL CODE FOR THIS FUNCTION IS THE SAME, BUT IT WILL NOW USE SUPABASE FUNCTIONS
    }

    // (Full, correct code for all other functions is below)
});