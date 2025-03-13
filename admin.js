// Supabase configuration
const supabaseUrl = 'https://iclyyxcdhxwlhvjeqntv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImljbHl5eGNkaHh3bGh2amVxbnR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE4MzgwNDQsImV4cCI6MjA1NzQxNDA0NH0.3QV-8VNIatxSJj6KfVv65S94Jy19XZS3hfNQz8TnThk';
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

// DOM Elements
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const loginStatus = document.getElementById('login-status');
const authContainer = document.getElementById('auth-container');
const adminContainer = document.getElementById('admin-container');
const addProductBtn = document.getElementById('add-product-btn');
const productFormContainer = document.getElementById('product-form-container');
const productForm = document.getElementById('product-form');
const formTitle = document.getElementById('form-title');
const productsTableBody = document.getElementById('products-table-body');
const featuresContainer = document.getElementById('features-container');
const addFeatureBtn = document.getElementById('add-feature');
const cancelFormBtn = document.getElementById('cancel-form');
const imageUpload = document.getElementById('image-upload');
const imagePreviewContainer = document.getElementById('image-preview-container');
const loading = document.getElementById('loading');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');

let currentImages = [];
const MAX_IMAGES = 5;

async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        loginStatus.textContent = `Logged in as: ${user.email}`;
        loginBtn.classList.add('d-none');
        logoutBtn.classList.remove('d-none');
        authContainer.classList.add('d-none');
        adminContainer.classList.remove('d-none');
        loadProducts();
    } else {
        loginStatus.textContent = 'Not logged in';
        loginBtn.classList.remove('d-none');
        logoutBtn.classList.add('d-none');
        authContainer.classList.remove('d-none');
        adminContainer.classList.add('d-none');
    }
}

document.addEventListener('DOMContentLoaded', checkAuth);

logoutBtn.addEventListener('click', async () => {
    showLoading();
    await supabase.auth.signOut();
    checkAuth();
    hideLoading();
});

async function loadProducts(search = '') {
    showLoading();
    let { data: products, error } = await supabase.from('products').select('*');
    hideLoading();
    if (error) {
        console.error('Error loading products:', error);
        return;
    }
    renderProducts(products.filter(p => p.title.toLowerCase().includes(search.toLowerCase())));
}

function renderProducts(products) {
    productsTableBody.innerHTML = '';
    products.forEach(product => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><img src="${product.image}" class="image-preview"></td>
            <td>${product.title}</td>
            <td>${product.category}</td>
            <td>R${product.price}</td>
            <td>
                <button class="btn btn-warning btn-sm" onclick="editProduct(${product.id})">Edit</button>
                <button class="btn btn-danger btn-sm" onclick="deleteProduct(${product.id})">Delete</button>
            </td>
        `;
        productsTableBody.appendChild(row);
    });
}

async function saveProduct(e) {
    e.preventDefault();
    const title = document.getElementById('title').value;
    const category = document.getElementById('category').value;
    const price = parseFloat(document.getElementById('price').value);
    const description = document.getElementById('description').value;
    
    showLoading();
    const { data, error } = await supabase.from('products').insert([{ title, category, price, description }]);
    hideLoading();
    if (error) {
        console.error('Error saving product:', error);
        return;
    }
    productFormContainer.classList.add('d-none');
    loadProducts();
}

async function deleteProduct(id) {
    showLoading();
    await supabase.from('products').delete().eq('id', id);
    hideLoading();
    loadProducts();
}

productForm.addEventListener('submit', saveProduct);

function showLoading() {
    loading.classList.remove('d-none');
}
function hideLoading() {
    loading.classList.add('d-none');
}
