// product.js - renders a single product page with an image gallery

(function () {
  function getQueryParam(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
  }

  // INR currency formatter used across the product page
  function currencyINR(n){
    try{
      return new Intl.NumberFormat('en-IN', { style:'currency', currency:'INR', maximumFractionDigits:2 }).format(Number(n||0));
    }catch(_){
      return `₹${(Number(n||0)).toFixed(2)}`;
    }
  }

  // Render a skeleton UI while loading the product
  function renderProductSkeleton() {
    const container = document.getElementById('productContainer');
    if (!container) return;

    container.innerHTML = `
      <div class="product-view">
        <div class="gallery">
          <div class="main-image">
            <div class="skeleton-box" style="width:100%;aspect-ratio:4/5;border-radius:8px;"></div>
          </div>
          <div class="thumbnails" id="thumbs">
            <div class="skeleton-box" style="width:100%;aspect-ratio:1/1;border-radius:6px;"></div>
            <div class="skeleton-box" style="width:100%;aspect-ratio:1/1;border-radius:6px;"></div>
            <div class="skeleton-box" style="width:100%;aspect-ratio:1/1;border-radius:6px;"></div>
            <div class="skeleton-box" style="width:100%;aspect-ratio:1/1;border-radius:6px;"></div>
          </div>
        </div>
        <div class="details">
          <div class="skeleton-line skeleton-line-lg"></div>
          <div class="skeleton-line skeleton-line-md"></div>
          <div class="skeleton-line skeleton-line-sm"></div>
          <div class="skeleton-line skeleton-line-md"></div>
          <div class="skeleton-line skeleton-line-sm"></div>
        </div>
      </div>
    `;
  }

  function renderProduct(product, id) {
    const container = document.getElementById('productContainer');
    if (!container) return;

    const images = Array.isArray(product.imageUrls) && product.imageUrls.length > 0
      ? product.imageUrls
      : (product.imageUrl ? [product.imageUrl] : []);

    const placeholder = 'https://via.placeholder.com/800x1000?text=No+Image';
    const cover = images[0] || placeholder;

    container.innerHTML = `
      <div class="product-view">
        <div class="gallery">
          <div class="main-image">
            <img id="mainImage" src="${cover}" alt="${product.title || 'Poster'}" width="800" height="1000" decoding="async" fetchpriority="high" onerror="this.onerror=null;this.src='${placeholder}';">
          </div>
          <div class="thumbnails" id="thumbs">
            ${
              (images.length ? images : [placeholder]).map((src, i) => `
                <img src="${src}" alt="thumb ${i+1}" class="thumb ${i===0 ? 'active' : ''}" data-index="${i}" width="120" height="120" loading="lazy" decoding="async" onerror="this.onerror=null;this.src='${placeholder}';">
              `).join('')
            }
          </div>
        </div>
        <div class="details">
          <h1>${product.title || 'Untitled Poster'}</h1>
          <p class="price">${currencyINR(product.price)}</p>
          <div class="form-group" style="margin: 1.25rem 0;">
            <label style="display:block; margin-bottom:0.5rem; font-weight:600; color:#374151;">Select Size</label>
            <div class="size-options" style="display:flex; gap:0.5rem; flex-wrap:wrap;">
              ${(product.sizes || [product.size || 'L']).map(size => {
                const sizeMap = {
                  'S': 'Small',
                  'M': 'Medium',
                  'L': 'Large',
                  'XL': 'Extra Large',
                  'XXL': '2XL'
                };
                const sizeLabel = sizeMap[size] || size;
                return `
                  <label class="size-option" style="
                    border: 1px solid #e5e7eb;
                    padding: 0.5rem 1rem;
                    border-radius: 6px;
                    cursor: pointer;
                    transition: all 0.2s;
                    user-select: none;
                    white-space: nowrap;
                  ">
                    <input type="radio" name="size" value="${size}" 
                      style="display:none;"
                      ${size === 'L' && !product.sizes ? 'checked' : ''}
                    >
                    <span>${size}${sizeLabel !== size ? ` (${sizeLabel})` : ''}</span>
                  </label>
                `;
              }).join('')}
            </div>
            <input type="hidden" id="selectedSize" value="${product.sizes ? product.sizes[0] : (product.size || 'L')}">
          </div>
          <style>
            .size-option {
              border: 1px solid #e5e7eb;
              padding: 0.5rem 1rem;
              border-radius: 6px;
              cursor: pointer;
              transition: all 0.2s;
              user-select: none;
            }
            .size-option:hover {
              border-color: #9ca3af;
            }
            .size-option input[type="radio"]:checked + span {
              color: #3b82f6;
              font-weight: 600;
            }
            .size-option input[type="radio"]:checked + span::before {
              content: '';
              display: inline-block;
              width: 0.5rem;
              height: 0.5rem;
              background-color: #3b82f6;
              border-radius: 50%;
              margin-right: 0.5rem;
            }
          </style>
          <p class="meta ${product.stock > 0 ? 'in' : 'out'}" style="margin:0.75rem 0 1.25rem;">${product.stock > 0 ? 'In Stock' : 'Out of Stock'}</p>
          <div class="actions">
            <button id="buyNowBtn" class="btn-primary" ${product.stock > 0 ? '' : 'disabled'} style="width:100%; padding:0.9rem; font-size:1.1rem;">
              Buy Now
            </button>
          </div>
        </div>
      </div>
    `;

    // Hook up thumbnails
    const mainImage = document.getElementById('mainImage');
    const thumbs = document.getElementById('thumbs');
    if (thumbs) {
      thumbs.addEventListener('click', (e) => {
        const t = e.target;
        if (t && t.classList.contains('thumb')) {
          const idx = parseInt(t.dataset.index, 10);
          if (!isNaN(idx) && images[idx]) {
            mainImage.src = images[idx];
            thumbs.querySelectorAll('.thumb').forEach(el => el.classList.remove('active'));
            t.classList.add('active');
          }
        }
      });
    }

    // Handle size selection
    const sizeOptions = document.querySelectorAll('.size-option');
    sizeOptions.forEach(option => {
      option.addEventListener('click', (e) => {
        // If clicking on the label, find the input
        const input = option.querySelector('input[type="radio"]');
        if (input) {
          // Uncheck all other size options
          sizeOptions.forEach(opt => {
            opt.style.borderColor = '#e5e7eb';
            opt.style.boxShadow = 'none';
            const otherInput = opt.querySelector('input[type="radio"]');
            if (otherInput) otherInput.checked = false;
          });
          
          // Check the clicked option
          input.checked = true;
          option.style.borderColor = '#3b82f6';
          option.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.2)';
          
          // Update the hidden input
          const selectedSizeInput = document.getElementById('selectedSize');
          if (selectedSizeInput) {
            selectedSizeInput.value = input.value;
          }
        }
      });
      
      // Initialize selected state
      const input = option.querySelector('input[type="radio"]');
      if (input && input.checked) {
        option.style.borderColor = '#3b82f6';
        option.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.2)';
      }
    });

    // Buy Now click: persist selection and go to billing page
    const buyNow = document.getElementById('buyNowBtn');
    if (buyNow) {
      buyNow.addEventListener('click', () => {
        const selectedImage = mainImage && mainImage.src ? mainImage.src : (images[0] || '');
        const selectedSize = document.querySelector('input[name="size"]:checked')?.value || 
                            document.getElementById('selectedSize')?.value || 'L';
        const checkoutItem = {
          id,
          title: product.title || 'Untitled Jersey',
          price: Number(product.price || 0),
          size: selectedSize,
          image: selectedImage,
          createdAt: Date.now()
        };
        try {
          localStorage.setItem('checkoutItem', JSON.stringify(checkoutItem));
        } catch (e) {}
        window.location.href = 'billing.html';
      });
    }
  }

  function loadProduct() {
    const id = getQueryParam('id');
    const container = document.getElementById('productContainer');
    if (!id) {
      if (container) container.innerHTML = '<p class="error">No product specified.</p>';
      return;
    }

    // Show skeleton while fetching
    renderProductSkeleton();

    // Fetch product by ID
    const safeRenderError = (msg)=>{
      if (container) container.innerHTML = `<p class="error">${msg}</p>`;
    };
    if (typeof db === 'undefined' || !db || !db.collection) {
      console.error('Firestore not initialized on product page.');
      safeRenderError('App not connected. Please refresh the page.');
      return;
    }

    const tryFetch = (attempt=1)=>{
      db.collection('products').doc(id).get()
        .then((doc) => {
          if (!doc.exists) {
            safeRenderError('Product not found.');
            return;
          }
          renderProduct(doc.data(), doc.id);
        })
        .catch((error) => {
          console.error('Error loading product (attempt ' + attempt + '):', error);
          const perm = (error && error.code === 'permission-denied') ? ' (permission denied - check Firestore rules)' : '';
          const offline = (typeof navigator !== 'undefined' && navigator && navigator.onLine === false) ? ' You appear to be offline.' : '';
          if (attempt < 2) {
            setTimeout(()=> tryFetch(attempt+1), 350);
          } else {
            safeRenderError('Error loading product. Please try again later.' + offline + perm);
          }
        });
    };
    tryFetch();
  }

  document.addEventListener('DOMContentLoaded', loadProduct);
})();
