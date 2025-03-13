// Supabase configuration
const supabaseUrl = 'https://iclyyxcdhxwlhvjeqntv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImljbHl5eGNkaHh3bGh2amVxbnR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE4MzgwNDQsImV4cCI6MjA1NzQxNDA0NH0.3QV-8VNIatxSJj6KfVv65S94Jy19XZS3hfNQz8TnThk';
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

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

// Add this function to handle the login
async function handleLogin(email, password) {
    try {
        showLoading();
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) throw error;
        
        // Successful login
        checkAuth();
        return { success: true };
    } catch (error) {
        console.error('Error logging in:', error.message);
        return { success: false, message: error.message };
    } finally {
        hideLoading();
    }
}

// Add this event listener for the submit-login button
document.getElementById('submit-login').addEventListener('click', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    if (!email || !password) {
        alert('Please enter both email and password');
        return;
    }
    
    const result = await handleLogin(email, password);
    if (!result.success) {
        alert(result.message || 'Login failed');
    }
});

// Update the login button to show the auth container
loginBtn.addEventListener('click', () => {
    authContainer.classList.remove('d-none');
});

// Fix the logout button message
logoutBtn.addEventListener('click', async () => {
    console.log('Logging Out...'); // Changed from "Logging In..."
    showLoading();
    await supabaseClient.auth.signOut();
    checkAuth();
    hideLoading();
});

// Fixed checkAuth function
async function checkAuth() {
    showLoading();
    try {
        const { data, error } = await supabaseClient.auth.getUser();
        
        if (error) throw error;
        
        const user = data.user;
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
            authContainer.classList.add('d-none'); // Initially hide auth container
            adminContainer.classList.add('d-none');
        }
    } catch (error) {
        console.error('Auth check error:', error.message);
        loginStatus.textContent = 'Auth error: ' + error.message;
    } finally {
        hideLoading();
    }
}

logoutBtn.addEventListener('click', async () => {
    console.log('Logging In...');
    showLoading();
    await supabaseClient.auth.signOut();
    checkAuth();
    hideLoading();
});

async function loadProducts(search = '') {
    showLoading();
    let { data: products, error } = await supabaseClient.from('products').select('*');
    hideLoading();
    if (error) {
        console.error('Error loading products:', error);
        return;
    }
    renderProducts(products.filter(p => p.title.toLowerCase().includes(search.toLowerCase())));
    renderImagePreviews();
}

// Add event listener to display the product form container
addProductBtn.addEventListener('click', () => {
    productFormContainer.classList.remove('d-none');
    formTitle.textContent = 'Add New Product';
    productForm.reset(); // Clear the form for new product entry
});

// Update the saveProduct function to handle form submission
async function saveProduct(e) {
    e.preventDefault();
    const title = document.getElementById('title').value;
    const category = document.getElementById('category').value;
    const price = parseFloat(document.getElementById('price').value);
    const file = imageUpload.files[0];
    let imageUrl = '';
    
    if (file) {
        const filePath = `public/${file.name}`;
        const { data, error } = await supabaseClient.storage.from('product-images').upload(filePath, file);
        if (error) {
            console.error('Error uploading image:', error.message);
            hideLoading();
            return;
        }
        const { publicURL, error: urlError } = supabaseClient.storage.from('product-images').getPublicUrl(filePath);
        if (urlError) {
            console.error('Error getting public URL:', urlError.message);
            hideLoading();
            return;
        }
        imageUrl = publicURL;
        currentImages.push(imageUrl);
        renderImagePreviews();
    }

    showLoading();
    const { data, error } = await supabaseClient.from('products').insert([{
        title,
        category,
        price,
        features: features.join(', '),
        image: imageUrl
    }]);
    hideLoading();
    if (error) {
        console.error('Error saving product:', error);
        return;
    }
    productFormContainer.classList.add('d-none');
    loadProducts();
    features = []; // Clear the features array after saving
    currentImages = []; // Clear the images array after saving
    renderFeatures(); // Clear the rendered features
    renderImagePreviews(); // Clear the rendered images
}

// Function to render image previews
function renderImagePreviews() {
    imagePreviewContainer.innerHTML = '';
    currentImages.forEach((url, index) => {
        const img = document.createElement('img');
        img.src = url;
        img.classList.add('image-preview');
        const removeBtn = document.createElement('button');
        removeBtn.textContent = 'Remove';
        removeBtn.addEventListener('click', () => {
            currentImages.splice(index, 1);
            renderImagePreviews();
        });
        const container = document.createElement('div');
        container.appendChild(img);
        container.appendChild(removeBtn);
        imagePreviewContainer.appendChild(container);
    });
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

let features = [];

// Add event listener to add features to the array
addFeatureBtn.addEventListener('click', () => {
    const featureInput = document.getElementById('feature');
    const feature = featureInput.value.trim();
    if (feature) {
        features.push(feature);
        featureInput.value = ''; // Clear the input field
        renderFeatures();
    }
});

// Function to render the features in the featuresContainer
function renderFeatures() {
    featuresContainer.innerHTML = '';
    features.forEach((feature, index) => {
        const featureElement = document.createElement('div');
        featureElement.textContent = feature;
        const removeBtn = document.createElement('button');
        removeBtn.textContent = 'Remove';
        removeBtn.addEventListener('click', () => {
            features.splice(index, 1);
            renderFeatures();
        });
        featureElement.appendChild(removeBtn);
        featuresContainer.appendChild(featureElement);
    });
}

async function deleteProduct(id) {
    showLoading();
    await supabaseClient.from('products').delete().eq('id', id);
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

async function saveProduct(e) {
    e.preventDefault();
    const title = document.getElementById('title').value;
    const category = document.getElementById('category').value;
    const price = parseFloat(document.getElementById('price').value);
    const file = imageUpload.files[0];
    let imageUrl = '';
    
    showLoading();
    
    if (file) {
        const filePath = `public/${Date.now()}_${file.name}`;
        const { data, error } = await supabaseClient.storage.from('product-images').upload(filePath, file);
        
        if (error) {
            console.error('Error uploading image:', error.message);
            hideLoading();
            return;
        }
        
        // Fixed: Get the public URL correctly
        const { data: urlData } = supabaseClient.storage.from('product-images').getPublicUrl(filePath);
        imageUrl = urlData.publicUrl;
    }

    const { data, error } = await supabaseClient.from('products').insert([{
        title,
        category,
        price,
        features: features.join(', '),
        image: imageUrl
    }]);
    
    hideLoading();
    
    if (error) {
        console.error('Error saving product:', error);
        return;
    }
    
    productFormContainer.classList.add('d-none');
    loadProducts();
    features = []; // Clear the features array after saving
    currentImages = []; // Clear the images array after saving
    renderFeatures(); // Clear the rendered features
    renderImagePreviews(); // Clear the rendered images
}

// Fix the renderProducts function to properly display the images
function renderProducts(products) {
    productsTableBody.innerHTML = '';
    products.forEach(product => {
        const row = document.createElement('tr');
        
        // Create image element only if there's an image URL
        let imageCell = '';
        if (product.image) {
            imageCell = `<td><img src="${product.image}" class="image-preview" alt="${product.title}"></td>`;
        } else {
            imageCell = `<td>No image</td>`;
        }
        
        row.innerHTML = `
            ${imageCell}
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

// Add a function to edit products that properly handles images
async function editProduct(id) {
    showLoading();
    const { data: product, error } = await supabaseClient.from('products').select('*').eq('id', id).single();
    hideLoading();
    
    if (error) {
        console.error('Error loading product:', error);
        return;
    }
    
    // Fill the form with product data
    document.getElementById('title').value = product.title;
    document.getElementById('category').value = product.category;
    document.getElementById('price').value = product.price;
    
    // Handle features
    features = product.features ? product.features.split(', ') : [];
    renderFeatures();
    
    // Handle image
    if (product.image) {
        currentImages = [product.image];
        renderImagePreviews();
    } else {
        currentImages = [];
        renderImagePreviews();
    }
    
    // Show the form and update the title
    productFormContainer.classList.remove('d-none');
    formTitle.textContent = 'Edit Product';
    
    // Add product ID to the form as a hidden field or data attribute
    productForm.dataset.productId = product.id;
    
    // Update the form submission to handle both create and update
    productForm.removeEventListener('submit', saveProduct);
    productForm.addEventListener('submit', (e) => {
        e.preventDefault();
        updateProduct(product.id);
    });
}

// Add a function to update existing products
async function updateProduct(id) {
    const title = document.getElementById('title').value;
    const category = document.getElementById('category').value;
    const price = parseFloat(document.getElementById('price').value);
    const file = imageUpload.files[0];
    let imageUrl = currentImages.length > 0 ? currentImages[0] : '';
    
    showLoading();
    
    if (file) {
        const filePath = `public/${Date.now()}_${file.name}`;
        const { data, error } = await supabaseClient.storage.from('product-images').upload(filePath, file);
        
        if (error) {
            console.error('Error uploading image:', error.message);
            hideLoading();
            return;
        }
        
        // Get the public URL correctly
        const { data: urlData } = supabaseClient.storage.from('product-images').getPublicUrl(filePath);
        imageUrl = urlData.publicUrl;
    }
    
    const { data, error } = await supabaseClient.from('products')
        .update({
            title,
            category,
            price,
            features: features.join(', '),
            image: imageUrl
        })
        .eq('id', id);
    
    hideLoading();
    
    if (error) {
        console.error('Error updating product:', error);
        return;
    }
    
    productFormContainer.classList.add('d-none');
    loadProducts();
    features = [];
    currentImages = [];
    renderFeatures();
    renderImagePreviews();
    
    // Reset the form submission handler
    productForm.removeEventListener('submit', updateProduct);
    productForm.addEventListener('submit', saveProduct);
}

// Add event listener for the cancel button
cancelFormBtn.addEventListener('click', () => {
    productFormContainer.classList.add('d-none');
    features = [];
    currentImages = [];
    renderFeatures();
    renderImagePreviews();
    
    // Reset form submission handler
    productForm.removeEventListener('submit', updateProduct);
    productForm.addEventListener('submit', saveProduct);
});

// Add event listener for the search button
searchBtn.addEventListener('click', () => {
    const searchTerm = searchInput.value.trim();
    loadProducts(searchTerm);
});

// Add event listener for image upload preview
imageUpload.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file && currentImages.length < MAX_IMAGES) {
        const reader = new FileReader();
        reader.onload = function(e) {
            // This is just a preview, not the actual storage URL
            const previewUrl = e.target.result;
            const previewImg = document.createElement('img');
            previewImg.src = previewUrl;
            previewImg.classList.add('image-preview');
            imagePreviewContainer.innerHTML = '';
            imagePreviewContainer.appendChild(previewImg);
        }
        reader.readAsDataURL(file);
    }
});

// Make sure to call checkAuth on page load
window.addEventListener('DOMContentLoaded', checkAuth);