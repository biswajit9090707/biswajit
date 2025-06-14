// State management
let currentPage = 'home';
let cart = [];
let searchHistory = [];
let wishlist = [];
let selectedProduct = null;
let selectedColor = null;
let selectedSize = null;
let deliveryOption = 'standard';
let searchTerm = '';
let profileStats = {
    totalOrders: 0,
    pendingOrders: 0,
    wishlistItems: 0
};

// Load products from localStorage, or initialize as empty array if not found
let products = JSON.parse(localStorage.getItem('products')) || [];

// Real-time update interval (in milliseconds)
const UPDATE_INTERVAL = 5000;

// DOM Elements
const app = document.getElementById('app');

// Router
function navigate(page, data = null) {
    // Stop real-time updates when leaving profile page
    if (currentPage === 'profile') {
        stopRealTimeUpdates();
    }

    // Add animation class
    app.classList.add('fade-out');

    setTimeout(() => {
        currentPage = page;
        if (data) {
            selectedProduct = data;
            selectedColor = data.colors[0];
            selectedSize = data.sizes ? data.sizes[0] : null;
        }
        renderApp();
        app.classList.remove('fade-out');
    }, 150);
}

// Render Functions
function renderApp() {
    // Reload products from localStorage before rendering to ensure up-to-date data
    products = JSON.parse(localStorage.getItem('products')) || [];

    switch (currentPage) {
        case 'home':
            renderHome();
            break;
        case 'search':
            renderSearch();
            break;
        case 'cart':
            renderCart();
            break;
        case 'profile':
            if (!authState.isAuthenticated) {
                navigate('login');
                return;
            }
            renderProfile();
            break;
        case 'notifications':
            renderNotifications();
            break;
        case 'login':
            app.innerHTML = renderLogin();
            break;
        case 'signup':
            app.innerHTML = renderSignup();
            break;
        case 'product':
            renderProductDetail();
            break;
        case 'wishlist':
            renderWishlist();
            break;
        case 'delivery':
            renderDelivery();
            break;
        case 'orders':
            renderOrders();
            break;
        default:
            renderHome();
    }
    renderBottomNav();
}

function formatTimestamp(timestamp) {
    const now = new Date();
    const date = new Date(timestamp);
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

    if (diffInHours < 1) {
        const diffInMinutes = Math.floor((now - date) / (1000 * 60));
        return `${diffInMinutes} minutes ago`;
    } else if (diffInHours < 24) {
        return `${diffInHours} hours ago`;
    } else {
        return date.toLocaleDateString();
    }
}

function renderNotifications() {
    const unreadCount = notifications.filter(n => !n.isRead).length;

    app.innerHTML = `
        <div class="min-h-screen bg-gray-50">
            <!-- Header -->
            <div class="bg-white sticky top-0 z-10 shadow-sm">
                <div class="flex items-center p-4">
                    <button onclick="navigate('home')" class="mr-4">
                        <i class="fas fa-arrow-left text-gray-600"></i>
                    </button>
                    <h1 class="text-xl font-bold">Notifications</h1>
                    ${
                        unreadCount > 0
                            ? `
                        <button onclick="markAllAsRead()" class="text-green-600 text-sm font-medium">
                            Mark all as read
                        </button>
                    `
                            : ''
                    }
                </div>
            </div>

            <!-- Notification List -->
            <div class="divide-y divide-gray-200">
                ${
                    notifications.length > 0
                        ? notifications
                              .map(
                                  notification => `
                     <div class="p-4 bg-white ${!notification.isRead ? 'bg-gray-800' : ''} transition-colors duration-200">>                       <div class="flex items-start">
                            <div class="flex-shrink-0">
                                <div class="w-10 h-10 rounded-full flex items-center justify-center text-white"
                                     style="background-color: ${getNotificationColor(
                                         notification.color
                                     )}">
                                    <i class="fas ${notification.icon}"></i>
                                </div>
                            </div>
                            <div class="ml-4 flex-1">
                                <div class="flex items-center justify-between">
                                    <h3 class="text-sm font-semibold text-gray-900">
                                        ${notification.title}
                                    </h3>
                                    <p class="text-xs text-gray-500">
                                        ${formatTimestamp(
                                            notification.timestamp
                                        )}
                                    </p>
                                </div>
                                <p class="mt-1 text-sm text-gray-600">
                                    ${notification.message}
                                </p>
                            </div>
                        </div>
                    </div>
                `
                              )
                              .join('')
                        : `
                    <div class="flex flex-col items-center justify-center p-8">
                        <i class="fas fa-bell-slash text-gray-300 text-5xl mb-4"></i>
                        <p class="text-gray-500">No notifications yet</p>
                    </div>
                `
                }
            </div>
        </div>
    `;
}

function getNotificationColor(color) {
    const colors = {
        green: '#4CAF50',
        orange: '#FF9800',
        blue: '#2196F3',
        purple: '#9C27B0',
        red: '#F44336'
    };
    return colors[color] || colors.blue;
}

function markAllAsRead() {
    notifications.forEach(notification => {
        notification.isRead = true;
    });
    renderNotifications();
    showToast('All notifications marked as read');
}

function renderHome() {
    app.innerHTML = `
        <div class="pb-16">
            <!-- Header -->
            <div class="bg-white sticky top-0 z-10 shadow-sm">
                <div class="flex items-center p-4">
                    <h1 class="text-xl font-bold flex-1">Home</h1>
                    <div class="flex items-center gap-4">
                        <button onclick="navigate('wishlist')" class="relative">
                            <i class="fas fa-heart text-gray-600"></i>
                            ${
                                wishlist.length > 0
                                    ? `
                                <span class="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                            `
                                    : ''
                            }
                        </button>
                        <button onclick="navigate('notifications')" class="relative">
                            <i class="fas fa-bell text-gray-600"></i>
                            ${
                                notifications.some(n => !n.isRead)
                                    ? `
                                <span class="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                            `
                                    : ''
                            }
                        </button>
                        <button onclick="navigate('cart')" class="relative">
                            <i class="fas fa-shopping-cart text-gray-600"></i>
                            ${
                                cart.length > 0
                                    ? `
                                <span class="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                            `
                                    : ''
                            }
                        </button>
                    </div>
                </div>
            </div>

            <!-- Search Bar -->
            <div class="p-4">
                <div class="relative" onclick="navigate('search')">
                    <input type="text" 
                           placeholder="Search products..." 
                           class="w-full p-3 rounded-lg bg-white shadow-md focus:outline-none"
                           readonly>
                    <span class="absolute right-4 top-3">
                        <i class="fas fa-search text-gray-400"></i>
                    </span>
                </div>
            </div>

            <!-- Promotions Carousel -->
            <div class="px-4 mb-6">
                <div class="overflow-x-auto scroll-smooth flex space-x-4 pb-4">
                    ${promotions
                        .map(
                            promo => `
                        <div class="flex-shrink-0 w-80 bg-gradient-to-r from-yellow-600 to-yellow-800 rounded-lg p-4 text-white">
                            <h3 class="text-xl font-bold mb-2">${promo.title}</h3>
                            <p class="text-2xl font-bold mb-2">${promo.discount}</p>
                            <div class="flex justify-between items-center">
                                <span class="text-sm">Use code: ${promo.code}</span>
                                <button class="bg-white text-yellow-700 px-4 py-1 rounded-full text-sm font-bold">
                                    Copy
                                </button>
                            </div>
                        </div>
                    `
                        )
                        .join('')}
                </div>
            </div>

            <!-- Categories -->
            <div class="px-4 mb-6">
                <div class="flex overflow-x-auto scroll-smooth space-x-4 pb-2">
                    ${categories
                        .map(
                            category => `
                        <button class="ripple flex-shrink-0 px-6 py-2 rounded-full ${
                            category === 'All'
                                ? 'bg-yellow-700 text-white'
                                : 'bg-white shadow'
                        } whitespace-nowrap">
                            ${category}
                        </button>
                    `
                        )
                        .join('')}
                </div>
            </div>

            <!-- Products Grid -->
            <div class="grid grid-cols-2 gap-4 px-4">
                ${products
                    .map(
                        product => `
                    <div class="product-card bg-white rounded-lg shadow-md overflow-hidden" 
                         onclick="navigate('product', ${JSON.stringify(
                             product
                         )})">
                        <div class="relative">
                            <img src="${product.image}" 
                                 alt="${product.name}" 
                                 class="w-full h-40 object-contain p-4">
                            <button onclick="event.stopPropagation(); toggleWishlist(${
                                product.id
                            })" 
                                    class="absolute top-2 right-2 w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center">
                                <i class="fas fa-heart ${
                                    wishlist.includes(product.id)
                                        ? 'text-red-500'
                                        : 'text-gray-300'
                                }"></i>
                            </button>
                            <button onclick="event.stopPropagation(); quickView(${
                                product.id
                            })" 
                                    class="absolute top-2 left-2 w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center">
                                <i class="fas fa-eye"></i>
                            </button>
                        </div>
                        <div class="p-4">
                            <div class="flex justify-between items-center mb-2">
                                <span class="text-yellow-700 font-medium">
                                    ${
                                        product.available
                                            ? 'In Stock'
                                            : 'Out of Stock'
                                    }
                                </span>
                                <div class="flex items-center">
                                    <span class="mr-1">${product.rating}</span>
                                    <i class="fas fa-star text-yellow-400"></i>
                                </div>
                            </div>
                            <h3 class="font-medium mb-1 truncate">${
                                product.name
                            }</h3>
                            <div class="flex justify-between items-center">
                                <div class="text-xl font-bold">₹${
                                    product.price
                                }</div>
                                <button onclick="event.stopPropagation(); addToCart(${
                                    product.id
                                })" 
                                        class="ripple bg-yellow-700 text-white px-4 py-2 rounded-lg flex items-center">
                                    <i class="fas fa-cart-plus mr-2"></i>
                                    Add
                                </button>
                            </div>
                        </div>
                    </div>
                `
                    )
                    .join('')}
            </div>
        </div>

        ${renderBottomNav()}
    `;
}

function renderProductDetail() {
    if (!selectedProduct) return navigate('home');

    app.innerHTML = `
        <div class="pb-16">
            <!-- Header -->
            <div class="bg-white sticky top-0 z-10">
                <div class="flex items-center p-4">
                    <button onclick="navigate('home')" class="mr-4">
                        <i class="fas fa-arrow-left text-xl"></i>
                    </button>
                    <h1 class="text-xl font-bold">${selectedProduct.name}</h1>
                    <button onclick="shareProduct(${
                        selectedProduct.id
                    })" class="ml-4">
                        <i class="fas fa-share-alt text-xl"></i>
                    </button>
                </div>
            </div>

            <!-- Product Images -->
            <div class="bg-white mb-4">
                <div class="relative">
                    <img src="${selectedProduct.image}" 
                         alt="${selectedProduct.name}" 
                         class="w-full h-72 object-contain p-4">
                    <button onclick="toggleWishlist(${selectedProduct.id})" 
                            class="absolute top-4 right-4 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center">
                        <i class="fas fa-heart ${
                            wishlist.includes(selectedProduct.id)
                                ? 'text-red-500'
                                : 'text-gray-300'
                        } text-xl"></i>
                    </button>
                </div>
            </div>

            <!-- Product Info -->
            <div class="bg-white p-4 mb-4">
                <div class="flex justify-between items-start mb-4">
                    <div>
                        <h2 class="text-2xl font-bold mb-2">₹${selectedProduct.price}</h2>
                        <h1 class="text-xl font-bold">${selectedProduct.name}</h1>
                        <div class="flex items-center text-gray-600 mt-1">
                            <i class="fas fa-star text-yellow-400 mr-1"></i>
                            <span>${selectedProduct.rating} (${selectedProduct.reviews.length} reviews)</span>
                        </div>
                    </div>
                    <span class="text-green-500 font-medium">
                        ${
                            selectedProduct.available
                                ? 'In Stock'
                                : 'Out of Stock'
                        }
                    </span>
                </div>
                <p class="text-gray-700 mb-4">${selectedProduct.description}</p>

                <!-- Product Specs -->
                <div class="mb-4">
                    <h3 class="font-bold mb-2">Specifications</h3>
                    <ul class="list-disc list-inside text-gray-700">
                        ${selectedProduct.specs
                            .map(spec => `<li>${spec}</li>`)
                            .join('')}
                    </ul>
                </div>

                <!-- Product Colors -->
                ${
                    selectedProduct.colors && selectedProduct.colors.length > 0
                        ? `
                    <div class="mb-4">
                        <h3 class="font-bold mb-2">Colors</h3>
                        <div class="flex space-x-2">
                            ${selectedProduct.colors
                                .map(
                                    color => `
                                <button onclick="selectedColor = '${color}'; renderProductDetail()" 
                                        class="w-8 h-8 rounded-full border-2 ${
                                            selectedColor === color
                                                ? 'border-green-500'
                                                : 'border-gray-300'
                                        }" 
                                        style="background-color: ${color.toLowerCase().replace(' ', '')}"></button>
                            `
                                )
                                .join('')}
                        </div>
                    </div>
                `
                        : ''
                }

                <!-- Product Sizes -->
                ${
                    selectedProduct.sizes && selectedProduct.sizes.length > 0
                        ? `
                    <div class="mb-4">
                        <h3 class="font-bold mb-2">Sizes</h3>
                        <div class="flex space-x-2">
                            ${selectedProduct.sizes
                                .map(
                                    size => `
                                <button onclick="selectedSize = '${size}'; renderProductDetail()" 
                                        class="px-4 py-2 rounded-full border-2 ${
                                            selectedSize === size
                                                ? 'border-green-500 bg-green-50'
                                                : 'border-gray-300 bg-white'
                                        }">
                                    ${size}
                                </button>
                            `
                                )
                                .join('')}
                        </div>
                    </div>
                `
                        : ''
                }

                <!-- Product Reviews -->
                <div class="mb-4">
                    <h3 class="font-bold mb-2">Reviews (${selectedProduct.reviews.length})</h3>
                    ${selectedProduct.reviews
                        .map(
                            review => `
                        <div class="bg-gray-50 p-3 rounded-lg mb-2">
                            <div class="flex items-center mb-1">
                                <span class="font-semibold mr-2">${review.user}</span>
                                <div class="flex items-center">
                                    ${Array(
                                        Math.floor(review.rating)
                                    )
                                        .fill(
                                            '<i class="fas fa-star text-yellow-400"></i>'
                                        )
                                        .join('')}
                                    ${
                                        review.rating % 1 !== 0
                                            ? '<i class="fas fa-star-half-alt text-yellow-400"></i>'
                                            : ''
                                    }
                                </div>
                            </div>
                            <p class="text-gray-700">${review.comment}</p>
                        </div>
                    `
                        )
                        .join('')}
                </div>
            </div>
        </div>

        <!-- Add to Cart Button -->
        <div class="fixed bottom-0 left-0 right-0 bg-white p-4 shadow-lg">
            <button onclick="addToCart(${selectedProduct.id})" 
                    class="w-full bg-green-500 text-white py-3 rounded-lg text-lg font-bold ripple">
                Add to Cart
            </button>
        </div>
    `;
}

function renderCart() {
    app.innerHTML = `
        <div class="pb-16">
            <!-- Header -->
            <div class="bg-white sticky top-0 z-10 shadow-sm">
                <div class="flex items-center p-4">
                    <button onclick="navigate('home')" class="mr-4">
                        <i class="fas fa-arrow-left text-gray-600"></i>
                    </button>
                    <h1 class="text-xl font-bold flex-1">Your Cart</h1>
                    <button onclick="clearCart()" class="text-red-500 text-sm font-medium">
                        Clear Cart
                    </button>
                </div>
            </div>

            <!-- Cart Items -->
            <div class="p-4">
                ${cart.length > 0
                    ? cart
                          .map(
                              item => `
                        <div class="flex items-center bg-white rounded-lg shadow-md p-4 mb-4">
                            <img src="${item.image}" alt="${item.name}" class="w-24 h-24 object-contain rounded-lg mr-4">
                            <div class="flex-1">
                                <h3 class="font-bold text-lg">${item.name}</h3>
                                <p class="text-gray-600">₹${item.price}</p>
                                <div class="flex items-center mt-2">
                                    <button onclick="updateQuantity(${item.id}, -1)" class="bg-gray-200 text-gray-700 px-3 py-1 rounded-full">-</button>
                                    <span class="mx-2">${item.quantity}</span>
                                    <button onclick="updateQuantity(${item.id}, 1)" class="bg-gray-200 text-gray-700 px-3 py-1 rounded-full">+</button>
                                    <button onclick="removeFromCart(${item.id})" class="ml-auto text-red-500">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    `
                          )
                          .join('')
                    : `
                    <div class="flex flex-col items-center justify-center p-8">
                        <i class="fas fa-shopping-cart text-gray-300 text-5xl mb-4"></i>
                        <p class="text-gray-500">Your cart is empty</p>
                    </div>
                `}
            </div>

            <!-- Cart Summary -->
            ${cart.length > 0
                ? `
                <div class="p-4 bg-white rounded-lg shadow-md mx-4">
                    <h3 class="text-xl font-bold mb-4">Order Summary</h3>
                    <div class="flex justify-between mb-2">
                        <span>Subtotal</span>
                        <span>₹${calculateSubtotal().toFixed(2)}</span>
                    </div>
                    <div class="flex justify-between mb-2">
                        <span>Shipping</span>
                        <span>₹${getShippingCost().toFixed(2)}</span>
                    </div>
                    <div class="flex justify-between font-bold text-lg border-t pt-2 mt-2">
                        <span>Total</span>
                        <span>₹${calculateTotal().toFixed(2)}</span>
                    </div>
                    <button onclick="navigate('delivery')" class="w-full bg-green-500 text-white py-3 rounded-lg text-lg font-bold mt-4 ripple">
                        Proceed to Checkout
                    </button>
                </div>
            `
                : ''}
        </div>

        ${renderBottomNav()}
    `;
}

function calculateSubtotal() {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

function getShippingCost() {
    return deliveryOption === 'express' ? 50 : 20;
}

function calculateTotal() {
    return calculateSubtotal() + getShippingCost();
}

function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (product) {
        const existingItem = cart.find(item => item.id === productId);
        if (existingItem) {
            existingItem.quantity++;
        } else {
            cart.push({ ...product, quantity: 1 });
        }
        showToast(`${product.name} added to cart`);
        renderCart();
        renderBottomNav();
    }
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    showToast('Item removed from cart');
    renderCart();
    renderBottomNav();
}

function updateQuantity(productId, change) {
    const item = cart.find(item => item.id === productId);
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) {
            removeFromCart(productId);
        }
        renderCart();
        renderBottomNav();
    }
}

function clearCart() {
    cart = [];
    showToast('Cart cleared');
    renderCart();
    renderBottomNav();
}

function toggleWishlist(productId) {
    const index = wishlist.indexOf(productId);
    if (index > -1) {
        wishlist.splice(index, 1);
        showToast('Removed from wishlist');
    } else {
        wishlist.push(productId);
        showToast('Added to wishlist');
    }
    renderHome(); // Re-render home to update heart icon
}

function quickView(productId) {
    const product = products.find(p => p.id === productId);
    if (product) {
        // For simplicity, quick view navigates to product detail page
        navigate('product', product);
    }
}

function shareProduct(productId) {
    const product = products.find(p => p.id === productId);
    if (navigator.share && product) {
        navigator.share({
            title: product.name,
            text: product.description,
            url: window.location.href // In a real app, this would be the product's unique URL
        })
            .then(() => console.log('Successful share'))
            .catch((error) => console.log('Error sharing', error));
    } else {
        showToast('Share not supported on this browser');
    }
}

function renderSearch() {
    app.innerHTML = `
        <div class="pb-16">
            <!-- Header -->
            <div class="bg-white sticky top-0 z-10 shadow-sm">
                <div class="flex items-center p-4">
                    <button onclick="navigate('home')" class="mr-4">
                        <i class="fas fa-arrow-left text-gray-600"></i>
                    </button>
                    <h1 class="text-xl font-bold flex-1">Search</h1>
                </div>
            </div>

            <!-- Search Input -->
            <div class="p-4">
                <div class="relative">
                    <input type="text" 
                           id="search-input"
                           placeholder="Search products..." 
                           class="w-full p-3 rounded-lg bg-white shadow-md focus:outline-none"
                           value="${searchTerm}"
                           oninput="handleSearchInput(event)">
                    <span class="absolute right-4 top-3">
                        <i class="fas fa-search text-gray-400"></i>
                    </span>
                </div>
            </div>

            <!-- Search Results -->
            <div id="search-results" class="grid grid-cols-2 gap-4 px-4">
                ${renderSearchResults()}
            </div>

            <!-- Search History -->
            ${searchHistory.length > 0
                ? `
                <div class="p-4">
                    <h3 class="font-bold mb-2">Recent Searches</h3>
                    <div class="flex flex-wrap gap-2">
                        ${searchHistory
                            .map(
                                historyItem => `
                            <span onclick="performSearch('${historyItem}')" class="bg-gray-200 text-gray-700 px-3 py-1 rounded-full cursor-pointer">
                                ${historyItem}
                            </span>
                        `
                            )
                            .join('')}
                    </div>
                </div>
            `
                : ''}
        </div>

        ${renderBottomNav()}
    `;
    document.getElementById('search-input').focus();
}

function handleSearchInput(event) {
    searchTerm = event.target.value;
    document.getElementById('search-results').innerHTML = renderSearchResults();
}

function renderSearchResults() {
    if (searchTerm.length < 2) {
        return `
            <div class="col-span-2 text-center text-gray-500 p-4">
                Type at least 2 characters to search
            </div>
        `;
    }

    const filteredProducts = products.filter(
        product =>
            product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (filteredProducts.length === 0) {
        return `
            <div class="col-span-2 text-center text-gray-500 p-4">
                No products found for "${searchTerm}"
            </div>
        `;
    }

    return filteredProducts
        .map(
            product => `
            <div class="product-card bg-white rounded-lg shadow-md overflow-hidden" 
                 onclick="navigate('product', ${JSON.stringify(product)})">
                <img src="${product.image}" alt="${product.name}" class="w-full h-40 object-contain p-4">
                <div class="p-4">
                    <h3 class="font-medium mb-1 truncate">${product.name}</h3>
                    <div class="text-xl font-bold">₹${product.price}</div>
                </div>
            </div>
        `
        )
        .join('');
}

function performSearch(term) {
    searchTerm = term;
    if (!searchHistory.includes(term)) {
        searchHistory.unshift(term);
        if (searchHistory.length > 5) {
            searchHistory.pop(); // Keep only last 5 searches
        }
    }
    renderSearch();
}

function renderWishlist() {
    app.innerHTML = `
        <div class="pb-16">
            <!-- Header -->
            <div class="bg-white sticky top-0 z-10 shadow-sm">
                <div class="flex items-center p-4">
                    <button onclick="navigate('home')" class="mr-4">
                        <i class="fas fa-arrow-left text-gray-600"></i>
                    </button>
                    <h1 class="text-xl font-bold flex-1">Your Wishlist</h1>
                </div>
            </div>

            <!-- Wishlist Items -->
            <div class="grid grid-cols-2 gap-4 p-4">
                ${wishlist.length > 0
                    ? wishlist
                          .map(productId => {
                              const product = products.find(p => p.id === productId);
                              if (!product) return ''; // Product might have been deleted
                              return `
                                <div class="product-card bg-white rounded-lg shadow-md overflow-hidden" 
                                     onclick="navigate('product', ${JSON.stringify(
                                         product
                                     )})">
                                    <img src="${product.image}" alt="${product.name}" class="w-full h-40 object-contain p-4">
                                    <div class="p-4">
                                        <h3 class="font-medium mb-1 truncate">${product.name}</h3>
                                        <div class="text-xl font-bold">₹${product.price}</div>
                                       <button onclick="event.stopPropagation(); addToCart(${product.id})" 
                                        class="ripple bg-yellow-700 text-white px-4 py-2 rounded-lg flex items-center">sm font-bold ripple">
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            `;
                          })
                          .join('')
                    : `
                    <div class="col-span-2 flex flex-col items-center justify-center p-8">
                        <i class="fas fa-heart-broken text-gray-300 text-5xl mb-4"></i>
                        <p class="text-gray-500">Your wishlist is empty</p>
                    </div>
                `}
            </div>
        </div>

        ${renderBottomNav()}
    `;
}

function renderDelivery() {
    app.innerHTML = `
        <div class="pb-16">
            <!-- Header -->
            <div class="bg-white sticky top-0 z-10 shadow-sm">
                <div class="flex items-center p-4">
                    <button onclick="navigate('cart')" class="mr-4">
                        <i class="fas fa-arrow-left text-gray-600"></i>
                    </button>
                    <h1 class="text-xl font-bold flex-1">Delivery Options</h1>
                </div>
            </div>

            <!-- Delivery Options -->
            <div class="p-4">
                <div class="bg-white rounded-lg shadow-md p-4 mb-4">
                    <h3 class="text-xl font-bold mb-4">Choose Delivery Speed</h3>
                    <div class="mb-4">
                        <label class="flex items-center mb-2">
                            <input type="radio" name="delivery" value="standard" class="form-radio h-5 w-5 text-green-600" 
                                ${deliveryOption === 'standard' ? 'checked' : ''}
                                onchange="deliveryOption = 'standard'; renderDelivery();">
                            <span class="ml-2 text-lg">Standard Delivery (2-5 days) - ₹20</span>
                        </label>
                        <label class="flex items-center">
                            <input type="radio" name="delivery" value="express" class="form-radio h-5 w-5 text-green-600" 
                                ${deliveryOption === 'express' ? 'checked' : ''}
                                onchange="deliveryOption = 'express'; renderDelivery();">
                            <span class="ml-2 text-lg">Express Delivery (1-2 days) - ₹50</span>
                        </label>
                    </div>
                </div>

                <div class="bg-white rounded-lg shadow-md p-4">
                    <h3 class="text-xl font-bold mb-4">Shipping Address</h3>
                    <form id="shipping-form">
                        <div class="mb-4">
                            <label for="fullName" class="block text-gray-700 text-sm font-bold mb-2">Full Name</label>
                            <input type="text" id="fullName" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" placeholder="John Doe" required>
                        </div>
                        <div class="mb-4">
                            <label for="address" class="block text-gray-700 text-sm font-bold mb-2">Address</label>
                            <input type="text" id="address" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" placeholder="123 Main St" required>
                        </div>
                        <div class="mb-4 flex space-x-4">
                            <div class="w-1/2">
                                <label for="city" class="block text-gray-700 text-sm font-bold mb-2">City</label>
                                <input type="text" id="city" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" placeholder="Anytown" required>
                            </div>
                            <div class="w-1/2">
                                <label for="state" class="block text-gray-700 text-sm font-bold mb-2">State</label>
                                <input type="text" id="state" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" placeholder="CA" required>
                            </div>
                        </div>
                        <div class="mb-4">
                            <label for="postalCode" class="block text-gray-700 text-sm font-bold mb-2">Postal Code</label>
                            <input type="text" id="postalCode" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" placeholder="12345" required>
                        </div>
                        <div class="mb-4">
                            <label for="email" class="block text-gray-700 text-sm font-bold mb-2">Email</label>
                            <input type="email" id="email" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" placeholder="john.doe@example.com" required>
                        </div>
                        <div class="mb-4">
                            <label for="phone" class="block text-gray-700 text-sm font-bold mb-2">Phone</label>
                            <input type="tel" id="phone" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" placeholder="123-456-7890" required>
                        </div>
                        <button type="submit" onclick="placeOrder(event)" class="w-full bg-green-500 text-white py-3 rounded-lg text-lg font-bold ripple">
                            Place Order
                        </button>
                    </form>
                </div>
            </div>
        </div>

        ${renderBottomNav()}
    `;
}

function placeOrder(event) {
    event.preventDefault();

    const shippingForm = document.getElementById('shipping-form');
    if (!shippingForm.checkValidity()) {
        shippingForm.reportValidity();
        return;
    }

    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    const newOrder = {
        orderId: 'ORD-' + Date.now(),
        orderDate: new Date().toISOString(),
        items: cart,
        shipping: {
            fullName: document.getElementById('fullName').value,
            address: document.getElementById('address').value,
            city: document.getElementById('city').value,
            state: document.getElementById('state').value,
            postalCode: document.getElementById('postalCode').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            deliveryOption: deliveryOption
        },
        payment: {
            subtotal: calculateSubtotal(),
            shipping: getShippingCost(),
            total: calculateTotal()
        },
        status: 'pending' // Initial status
    };

    orders.push(newOrder);
    localStorage.setItem('orders', JSON.stringify(orders));

    // Clear cart after order
    cart = [];
    showToast('Order placed successfully!');
    navigate('home');

    // Update profile stats
    profileStats.totalOrders++;
    profileStats.pendingOrders++;
}

function renderOrders() {
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    const userOrders = orders.filter(order => order.userId === authState.currentUser.id);

    app.innerHTML = `
        <div class="pb-16">
            <!-- Header -->
            <div class="bg-white sticky top-0 z-10 shadow-sm">
                <div class="flex items-center p-4">
                    <button onclick="navigate('profile')" class="mr-4">
                        <i class="fas fa-arrow-left text-gray-600"></i>
                    </button>
                    <h1 class="text-xl font-bold">My Orders</h1>
                </div>
            </div>

            <!-- Order List -->
            <div class="p-4">
                ${userOrders.length > 0 ? userOrders.map(order => `
                    <div class="bg-white rounded-lg shadow-md p-4 mb-4">
                        <div class="flex justify-between items-center mb-2">
                            <h3 class="text-lg font-semibold">Order ID: ${order.id}</h3>
                            <span class="text-sm text-gray-500">${new Date(order.date).toLocaleDateString()}</span>
                        </div>
                        <p class="text-sm text-gray-600 mb-1">Status: <span class="font-medium text-${order.status === 'Delivered' ? 'green' : 'orange'}-500">${order.status}</span></p>
                        <p class="text-sm text-gray-600 mb-2">Total: ₹${order.total.toFixed(2)}</p>
                        <div>
                            <h4 class="text-xs font-semibold mb-1">Items:</h4>
                            ${order.items.map(item => `
                                <div class="flex justify-between items-center text-xs text-gray-500 mb-1">
                                    <span>${item.name} (x${item.quantity})</span>
                                    <span>₹${(item.price * item.quantity).toFixed(2)}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `).join('') : `
                    <div class="text-center text-gray-500 mt-8">
                        <i class="fas fa-box-open text-4xl mb-2"></i>
                        <p>You have no orders yet.</p>
                    </div>
                `}
            </div>
        </div>
        ${renderBottomNav()}
    `;
}


function renderProfile() {
    app.innerHTML = `
        <div class="pb-16">
            <!-- Header -->
            <div class="bg-white sticky top-0 z-10 shadow-sm">
                <div class="flex items-center p-4">
                    <button onclick="navigate('home')" class="mr-4">
                        <i class="fas fa-arrow-left text-gray-600"></i>
                    </button>
                    <h1 class="text-xl font-bold flex-1">My Profile</h1>
                    <button onclick="handleLogout()" class="text-red-500 text-sm font-medium">
                        Logout
                    </button>
                </div>
            </div>

            <!-- Profile Info -->
            <div class="p-4">
                <div class="bg-white rounded-lg shadow-md p-6 text-center mb-4">
                    <img src="${authState.currentUser.avatar}" alt="User Avatar" class="w-24 h-24 rounded-full mx-auto mb-4">
                    <h2 class="text-xl font-bold">${authState.currentUser.name}</h2>
                    <p class="text-gray-600">${authState.currentUser.email}</p>
                </div>

                <!-- Profile Stats -->
                <div class="grid grid-cols-3 gap-4 mb-4">
                    <div class="bg-white rounded-lg shadow-md p-4 text-center">
                        <h3 class="text-2xl font-bold text-green-600" id="total-orders">${profileStats.totalOrders}</h3>
                        <p class="text-gray-600">Total Orders</p>
                    </div>
                    <div class="bg-white rounded-lg shadow-md p-4 text-center">
                        <h3 class="text-2xl font-bold text-orange-600" id="pending-orders">${profileStats.pendingOrders}</h3>
                        <p class="text-gray-600">Pending Orders</p>
                    </div>
                    <div class="bg-white rounded-lg shadow-md p-4 text-center">
                        <h3 class="text-2xl font-bold text-blue-600" id="wishlist-items">${wishlist.length}</h3>
                        <p class="text-gray-600">Wishlist Items</p>
                    </div>
                </div>

                <!-- Quick Actions -->
                <div class="bg-white rounded-lg shadow-md p-4">
                    <button class="flex items-center w-full py-3 border-b border-gray-200 last:border-b-0" onclick="navigate('orders')">
                        <i class="fas fa-box text-gray-600 mr-3"></i>
                        <span class="text-lg">My Orders</span>
                        <i class="fas fa-chevron-right text-gray-400 ml-auto"></i>
                    </button>
                    <button class="flex items-center w-full py-3 border-b border-gray-200 last:border-b-0" onclick="navigate('wishlist')">
                        <i class="fas fa-heart text-gray-600 mr-3"></i>
                        <span class="text-lg">My Wishlist</span>
                        <i class="fas fa-chevron-right text-gray-400 ml-auto"></i>
                    </button>
                    <button class="flex items-center w-full py-3 border-b border-gray-200 last:border-b-0" onclick="navigate('notifications')">
                        <i class="fas fa-bell text-gray-600 mr-3"></i>
                        <span class="text-lg">Notifications</span>
                        <i class="fas fa-chevron-right text-gray-400 ml-auto"></i>
                    </button>
                    <button class="flex items-center w-full py-3 border-b border-gray-200 last:border-b-0" onclick="showToast('Settings clicked')">
                        <i class="fas fa-cog text-gray-600 mr-3"></i>
                        <span class="text-lg">Settings</span>
                        <i class="fas fa-chevron-right text-gray-400 ml-auto"></i>
                    </button>
                </div>
            </div>
        </div>

        ${renderBottomNav()}
    `;
    startRealTimeUpdates();
}

let updateIntervalId;

function startRealTimeUpdates() {
    // Clear any existing interval to prevent multiple intervals running
    if (updateIntervalId) {
        clearInterval(updateIntervalId);
    }
    updateIntervalId = setInterval(() => {
        updateProfileStats();
    }, UPDATE_INTERVAL);
}

function stopRealTimeUpdates() {
    if (updateIntervalId) {
        clearInterval(updateIntervalId);
        updateIntervalId = null;
    }
}

function updateProfileStats() {
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    profileStats.totalOrders = orders.length;
    profileStats.pendingOrders = orders.filter(order => order.status === 'pending').length;
    profileStats.wishlistItems = wishlist.length;

    // Update DOM elements directly to avoid full re-render
    const totalOrdersElement = document.getElementById('total-orders');
    if (totalOrdersElement) {
        totalOrdersElement.textContent = profileStats.totalOrders;
    }
    const pendingOrdersElement = document.getElementById('pending-orders');
    if (pendingOrdersElement) {
        pendingOrdersElement.textContent = profileStats.pendingOrders;
    }
    const wishlistItemsElement = document.getElementById('wishlist-items');
    if (wishlistItemsElement) {
        wishlistItemsElement.textContent = profileStats.wishlistItems;
    }
}

// Bottom Navigation
function renderBottomNav() {
    return `
        <div class="fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t border-gray-200 z-20">
            <div class="flex justify-around items-center h-16">
                <button onclick="navigate('home')" class="flex flex-col items-center text-gray-600 ${
                    currentPage === 'home' ? 'text-green-500' : ''
                }">
                    <i class="fas fa-home text-xl"></i>
                    <span class="text-xs">Home</span>
                </button>
                <button onclick="navigate('search')" class="flex flex-col items-center text-gray-600 ${
                    currentPage === 'search' ? 'text-green-500' : ''
                }">
                    <i class="fas fa-search text-xl"></i>
                    <span class="text-xs">Search</span>
                </button>
                <button onclick="navigate('cart')" class="relative flex flex-col items-center text-gray-600 ${
                    currentPage === 'cart' ? 'text-green-500' : ''
                }">
                    <i class="fas fa-shopping-cart text-xl"></i>
                    <span class="text-xs">Cart</span>
                    ${
                        cart.length > 0
                            ? `
                        <span class="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                            ${cart.length}
                        </span>
                    `
                            : ''
                    }
                </button>
                <button onclick="navigate('profile')" class="flex flex-col items-center text-gray-600 ${
                    currentPage === 'profile' ? 'text-green-500' : ''
                }">
                    <i class="fas fa-user text-xl"></i>
                    <span class="text-xs">Profile</span>
                </button>
            </div>
        </div>
    `;
}

// Toast Notification
function showToast(message, duration = 3000) {
    let toast = document.getElementById('toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        toast.className = 'fixed bottom-20 left-1/2 -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg opacity-0 transition-opacity duration-300 z-50';
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.remove('opacity-0');
    toast.classList.add('opacity-100');

    setTimeout(() => {
        toast.classList.remove('opacity-100');
        toast.classList.add('opacity-0');
    }, duration);
}

// Initial render
document.addEventListener('DOMContentLoaded', () => {
    // Initialize products in localStorage if they don't exist
    if (!localStorage.getItem('products')) {
        const initialProducts = [
            {
                id: 1,
                name: 'AirPods Pro',
                price: 145,
                category: 'Electronics',
                rating: 5.0,
                image: 'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/MQD83?wid=572&hei=572&fmt=jpeg&qlt=95&.v=1660803972361',
                available: true,
                description:
                    'Experience immersive sound with active noise cancellation and transparency mode. Features include adaptive EQ, spatial audio, and sweat resistance.',
                specs: [
                    'Active Noise Cancellation',
                    'Transparency Mode',
                    'Spatial Audio',
                    '24H Battery Life'
                ],
                reviews: [
                    {
                        user: 'John D.',
                        rating: 5,
                        comment: "Best earbuds I've ever owned!"
                    },
                    {
                        user: 'Sarah M.',
                        rating: 5,
                        comment: 'Great sound quality and battery life'
                    }
                ],
                colors: ['White'],
                stock: 50
            },
            {
                id: 2,
                name: 'MacBook Air',
                price: 435,
                category: 'Electronics',
                rating: 5.0,
                image: 'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/macbook-air-space-gray-select-201810?wid=904&hei=840&fmt=jpeg&qlt=90&.v=1633027804000',
                available: true,
                description:
                    "Supercharged by M2 chip. The world's thinnest laptop delivers powerful performance with up to 18 hours of battery life.",
                specs: [
                    'M2 Chip',
                    '13.6-inch Liquid Retina display',
                    '8GB RAM',
                    '256GB SSD'
                ],
                reviews: [
                    {
                        user: 'Mike R.',
                        rating: 5,
                        comment: 'Perfect for work and entertainment'
                    },
                    { user: 'Lisa K.', rating: 5, comment: 'Amazing battery life!' }
                ],
                colors: ['Space Gray', 'Silver', 'Gold'],
                stock: 25
            },
            {
                id: 3,
                name: 'Google Pixel',
                price: 699,
                category: 'Electronics',
                rating: 4.8,
                image: 'https://store.google.com/product/images/pixel_7a_sage.png',
                available: true,
                description:
                    'The smartest and most powerful Pixel yet. Features an advanced camera system and the latest Android experience.',
                specs: [
                    '6.4-inch OLED display',
                    '128GB Storage',
                    '12GB RAM',
                    '50MP Camera'
                ],
                reviews: [
                    {
                        user: 'David W.',
                        rating: 4.8,
                        comment: 'Best Android experience'
                    },
                    { user: 'Emma S.', rating: 4.7, comment: 'Amazing camera quality' }
                ],
                colors: ['Sage', 'Black', 'White'],
                stock: 30
            },
            {
                id: 4,
                name: 'PlayStation 5',
                price: 499,
                category: 'Electronics',
                rating: 4.9,
                image: 'https://gmedia.playstation.com/is/image/SIEPDC/ps5-product-thumbnail-01-en-14sep21',
                available: true,
                description:
                    'Next-gen gaming console with lightning-fast loading, haptic feedback, and stunning 4K graphics.',
                specs: ['4K Resolution', 'Ray Tracing', '825GB SSD', '120Hz Output'],
                reviews: [
                    {
                        user: 'Tom H.',
                        rating: 5,
                        comment: 'Gaming has never been better!'
                    },
                    {
                        user: 'Alice B.',
                        rating: 4.8,
                        comment: 'Amazing graphics and speed'
                    }
                ],
                colors: ['White'],
                stock: 15
            },
            {
                id: 5,
                name: 'Nike Air Max',
                price: 129,
                category: 'Fashion',
                rating: 4.7,
                image: 'https://static.nike.com/a/images/t_PDP_1280_v1/f_auto,q_auto:eco/1a4e9b53-0181-441d-9c43-4a10d38dd93c/air-max-270-shoes-P0j2DN.png',
                available: true,
                description:
                    "Featuring Nike's biggest heel Air unit yet, the Air Max 270 delivers visible cushioning under every step.",
                specs: [
                    'Air Max cushioning',
                    'Mesh upper',
                    'Rubber outsole',
                    'Foam midsole'
                ],
                reviews: [
                    {
                        user: 'Chris P.',
                        rating: 4.7,
                        comment: 'Super comfortable for daily wear'
                    },
                    {
                        user: 'Maria L.',
                        rating: 4.8,
                        comment: 'Stylish and great quality'
                    }
                ],
                colors: ['Black', 'White', 'Red'],
                sizes: ['US 7', 'US 8', 'US 9', 'US 10', 'US 11'],
                stock: 40
            },
            {
                id: 6,
                name: "Levi's 501 Jeans",
                price: 89,
                category: 'Fashion',
                rating: 4.6,
                image: 'https://lsco.scene7.com/is/image/lsco/005010114-front-pdp?fmt=jpeg&qlt=70&resMode=bisharp&fit=crop,0&op_usm=1.25,0.6,8&wid=2000&hei=2000',
                available: true,
                description:
                    'The original straight fit jean that started it all. A cultural icon, worn by generations.',
                specs: [
                    '100% Cotton',
                    'Button fly',
                    'Straight fit',
                    'Five-pocket styling'
                ],
                reviews: [
                    {
                        user: 'Robert K.',
                        rating: 4.6,
                        comment: 'Classic fit, never goes out of style'
                    },
                    {
                        user: 'Jennifer H.',
                        rating: 4.5,
                        comment: 'Perfect fit and great quality'
                    }
                ],
                colors: ['Blue', 'Black', 'Light Blue'],
                sizes: ['28x30', '30x30', '32x30', '34x30', '36x30'],
                stock: 60
            }
        ];
        localStorage.setItem('products', JSON.stringify(initialProducts));
    }
    renderApp();
});

// Global access to products (for other functions that might need it)
// This is a fallback and should ideally be avoided in larger applications
// window.products = products; // Not needed if products is reloaded in renderApp

const categories = ['All', 'Electronics', 'Fashion', 'Beauty', 'Toys'];

const promotions = [
    {
        id: 1,
        title: 'Summer Sale',
        discount: '20% OFF',
        code: 'SUMMER20',
        validUntil: '2025-02-01'
    },
    {
        id: 2,
        title: 'New User Special',
        discount: '₹100 OFF',
        code: 'NEWUSER',
        validUntil: '2025-03-01'
    },
    {
        id: 3,
        title: 'Fashion Week',
        discount: '30% OFF',
        code: 'FASHION30',
        validUntil: '2025-01-31'
    }
];

// Notification data
const notifications = [
    {
        id: 1,
        type: 'order',
        title: 'Order Delivered',
        message: 'Your order #1234 has been delivered successfully',
        timestamp: new Date(2025, 0, 14, 8, 30).getTime(),
        isRead: false,
        icon: 'fa-box-check',
        color: 'green'
    },
    {
        id: 2,
        type: 'promo',
        title: 'Special Offer',
        message: 'Get 50% off on all winter collection items!',
        timestamp: new Date(2025, 0, 14, 7, 15).getTime(),
        isRead: false,
        icon: 'fa-tag',
        color: 'orange'
    },
    {
        id: 3,
        type: 'news',
        title: 'New Collection Arrived',
        message: 'Check out our latest spring collection',
        timestamp: new Date(2025, 0, 13, 18, 45).getTime(),
        isRead: true,
        icon: 'fa-tshirt',
        color: 'blue'
    },
    {
        id: 4,
        type: 'system',
        title: 'Profile Updated',
        message: 'Your profile information has been updated successfully',
        timestamp: new Date(2025, 0, 13, 15, 20).getTime(),
        isRead: true,
        icon: 'fa-user-check',
        color: 'purple'
    }
];

// Trending tags data
const trendingTags = [
    { id: 1, name: 'Summer Collection', searches: 15420 },
    { id: 2, name: 'Casual Wear', searches: 12350 },
    { id: 3, name: 'Sport Shoes', searches: 11200 },
    { id: 4, name: 'Designer Bags', searches: 9870 },
    { id: 5, name: 'Smart Watches', searches: 8940 },
    { id: 6, name: 'Formal Wear', searches: 7650 },
    { id: 7, name: 'Accessories', searches: 6780 },
    { id: 8, name: 'Winter Wear', searches: 5430 },
    { id: 9, name: 'Ethnic Wear', searches: 4980 },
    { id: 10, name: 'Sunglasses', searches: 4320 },
    { id: 11, name: 'Sneakers', searches: 3890 },
    { id: 12, name: 'Denim', searches: 3450 },
    { id: 13, name: 'Party Wear', searches: 3210 },
    { id: 14, name: 'Fitness Gear', searches: 2980 },
    { id: 15, name: 'Home Decor', searches: 2760 }
];


