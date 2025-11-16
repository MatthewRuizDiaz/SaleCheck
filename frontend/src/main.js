import './style.css'
import Alpine from '@alpinejs/csp'

// Load products directly from chrome.storage.local
chrome.storage.local.get('products', (result) => {
  const initialProducts = Array.isArray(result.products) 
    ? result.products 
    : [];
  console.log('[main.js] Loaded products from storage:', initialProducts);
  initializeApp(initialProducts);
});

function initializeApp(initialProducts) {
  window.Alpine = Alpine;

  Alpine.data('product_list', () => ({
    products: [...initialProducts],
    newLink: '',
    errorMessage: '',

    async addNewProduct() {
      if (!this.newLink.trim()) {
        this.errorMessage = 'Please paste a link.';
        return;
      }

      try {
        const encoded = encodeURIComponent(this.newLink.trim());
        console.log('[addNewProduct] Fetching URL:', encoded);
        const response = await fetch(
          `http://localhost:3000/products/by_url?url=${encoded}`
        );
        console.log('[addNewProduct] Response status:', response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('[addNewProduct] Backend error:', errorText);
          throw new Error('Backend fetch failed');
        }
        
        const product = await response.json();
        console.log('[addNewProduct] Product received:', product);
        this.add_product(product);
        this.newLink = '';
        this.errorMessage = '';
      } catch (err) {
        console.error('[addNewProduct] Full error:', err);
        this.errorMessage = 'Could not add product.';
      }
    },

    add_product(product) {
      console.log('[add_product] Attempting to add:', product);

      if (!Array.isArray(this.products)) {
        console.error('[add_product] products is not an array! Resetting.');
        this.products = [];
      }

      if (
        this.products.some(p => p.product_asin === product.product_asin)
      ) {
        this.errorMessage = 'This product is already in the list.';
        console.warn('[add_product] Duplicate detected');
        return;
      }
      
      this.products.push(product);
      console.log('[add_product] After push:', this.products);
      this.saveProducts();
      this.errorMessage = '';
    },

    remove_product(product) {
      if (!Array.isArray(this.products)) {
        console.error('[remove_product] products is not an array!');
        this.products = [];
        return;
      }

      this.products = this.products.filter(
        p => p.product_asin !== product.product_asin
      );
      this.saveProducts();
      this.errorMessage = '';
    },

    saveProducts() {
      const toSave = Array.isArray(this.products) 
        ? JSON.parse(JSON.stringify(this.products)) 
        : [];
      console.log('[saveProducts] Saving:', toSave);
      
      chrome.storage.local.set({ products: toSave }, () => {
        if (chrome.runtime.lastError) {
          console.error('[saveProducts] Error:', chrome.runtime.lastError);
        } else {
          console.log('[saveProducts] Successfully saved to storage');
        }
      });
    },

    init() {
      chrome.storage.onChanged.addListener((changes, area) => {
        if (area === 'local' && changes.products) {
          const newProducts = changes.products.newValue || [];
          const isDifferent = 
            JSON.stringify(newProducts) !== JSON.stringify(this.products);

          if (isDifferent) {
            console.log('[popup] External storage change, updating UI...');
            this.products = newProducts;
          }
        }
      });
    }
  }));

  Alpine.start();
}