document.addEventListener("DOMContentLoaded", function () {
  if (typeof products === 'undefined') {
    console.error("Products data not found! Make sure index.js is loaded before app.js");
    return;
  }

  const productGrid = document.getElementById("productGrid");
  const searchInput = document.getElementById("searchInput");
  const pageTitle = document.querySelector("#pageTitle");
  const checkoutList = document.getElementById("checkout__list");
  const checkoutForm = document.getElementById("checkout-form");
  const orderButton = document.getElementById('place-order-btn');
  const confirmationMessage = document.getElementById('order-confirmation');
  const completeButton = document.getElementById('complete__button');

  const currentPage = window.location.pathname.split("/").pop();
  console.log("Current page:", currentPage);

  let pageCategory;

  if (currentPage === "foodandbev.html") {
    pageCategory = "Food and Beverages";
  } else if (currentPage === "household.html") {
    pageCategory = "Household Essentials";
  } else if (currentPage === "health.html") {
    pageCategory = "Health and Personal Care";
  } else if (currentPage === "pet.html") {
    pageCategory = "Pet Care";
  } else {
    pageCategory = "All Categories";
  }

  if (pageTitle) {
    pageTitle.textContent = pageCategory;
  }

  // Check for search parameters
  if (currentPage === "foodandbev.html") {
    const urlParams = new URLSearchParams(window.location.search);
    const searchParam = urlParams.get('search');
    
    if (searchParam && searchInput) {
      searchInput.value = searchParam;
      // Trigger the input event to filter products
      const inputEvent = new Event('input');
      searchInput.dispatchEvent(inputEvent);
    }
  }

  // Handle subcategory filtering
  if (currentPage === "foodandbev.html" || currentPage === "household.html" || 
      currentPage === "health.html" || currentPage === "pet.html") {
    const urlParams = new URLSearchParams(window.location.search);
    const categoryParam = urlParams.get('category');
    const itemParam = urlParams.get('item');
    
    if (categoryParam || itemParam) {
      // If we have a subcategory parameter, apply it as a filter when rendering products
      const filterText = categoryParam || itemParam;
      console.log(`Filtering by subcategory: ${filterText}`);
      
      // Get the original products for this page category
      const categoryProducts = getProductsByCategory(pageCategory);
      
      // Override the getProductsByCategory function to apply additional filtering
      window.getProductsByCategory = function(category) {
        if (category !== pageCategory) {
          return getProductsByCategory(category);
        }
        
        let filteredProducts = categoryProducts;
        
        if (categoryParam) {
          // For food and beverages, filter by the exact category
          console.log("Filtering by category:", categoryParam);
          filteredProducts = categoryProducts.filter(product => {
            console.log("Product category:", product.category, "Looking for:", categoryParam);
            return product.category === categoryParam;
          });
        } else if (itemParam) {
          // For other sections, do a partial text match on product name
          console.log("Filtering by item keyword:", itemParam);
          filteredProducts = categoryProducts.filter(product => 
            product.product_name.toLowerCase().includes(itemParam.toLowerCase())
          );
        }
        
        console.log("Found", filteredProducts.length, "products after filtering");
        return filteredProducts;
      };
      
      // Update page title to show the subcategory
      if (pageTitle) {
        const displayFilter = categoryParam || itemParam;
        pageTitle.textContent = `${pageCategory} - ${displayFilter}`;
      }
    }
  }

  let cart = [];
  if (localStorage.getItem("cart")) {
    try {
      cart = JSON.parse(localStorage.getItem("cart"));
      console.log("Cart loaded from localStorage:", cart);
    } catch (e) {
      console.error("Error loading cart from localStorage:", e);
      cart = [];
    }
  } else {
    console.log("No cart found in localStorage");
  }

  function updateCartCounter() {
    const cartCounters = document.querySelectorAll('.cart-counter');
    const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
    
    cartCounters.forEach(counter => {
      counter.textContent = totalItems;
      counter.style.display = totalItems > 0 ? 'flex' : 'none';
    });
  }

  // Call immediately after cart is loaded
  updateCartCounter();

  function addToCart(product) {
    const existingItem = cart.find(
      (item) => item.product_id === product.product_id
    );
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.push({
        ...product,
        quantity: 1,
      });
    }
    localStorage.setItem("cart", JSON.stringify(cart));
    console.log("Item added to cart:", product.product_name);
    console.log("Current cart:", cart);
    alert(product.product_name + " added to cart!");
    updateCartCounter();
  }

  function removeFromCart(productId) {
    const idToRemove = typeof productId === 'string' ? parseInt(productId, 10) : productId;
    console.log("Attempting to remove product with ID:", idToRemove);
    console.log("Cart before removal:", JSON.stringify(cart));
    
    const newCart = cart.filter(item => {
      console.log("Comparing item ID:", item.product_id, "with remove ID:", idToRemove);
      return item.product_id !== idToRemove;
    });
    
    cart = newCart;
    console.log("Cart after removal:", JSON.stringify(cart));
    localStorage.setItem("cart", JSON.stringify(cart));
    
    renderCart();
    updateCartCounter();
  }

  function updateCartItemQuantity(productId, newQuantity) {
    const idToUpdate = typeof productId === 'string' ? parseInt(productId, 10) : productId;
    console.log("Updating quantity for product ID:", idToUpdate, "to", newQuantity);
    
    const itemToUpdate = cart.find(item => item.product_id === idToUpdate);
    if (itemToUpdate) {
      if (newQuantity <= 0) {
        removeFromCart(idToUpdate);
      } else {
        itemToUpdate.quantity = newQuantity;
        localStorage.setItem("cart", JSON.stringify(cart));
        renderCart();
        updateCartCounter();
      }
    }
  }

  function renderCart() {
    console.log("Attempting to render cart");
    console.log("checkoutList element:", checkoutList);
    
    if (!checkoutList) {
      console.error("Checkout list element not found on this page");
      return;
    }
    
    console.log("Rendering cart with", cart.length, "items");
    checkoutList.innerHTML = '';
    
    if (cart.length === 0) {
      checkoutList.innerHTML = '<p>Your cart is empty</p>';
      return;
    }
    
    let totalPrice = 0;
    
    cart.forEach(item => {
      if (!item.unit_price) {
        console.error("Item missing unit_price:", item);
        return;
      }
      
      const itemTotal = item.unit_price * item.quantity;
      totalPrice += itemTotal;
      
      const cartItem = document.createElement('div');
      cartItem.className = 'cart-item';
      
      cartItem.innerHTML = `
        <div class="cart-dimension">
          <div class="cart-item-image">
            <img src="${item.image || './pictures/placeholder.png'}" alt="${item.product_name || 'Product'}">
          </div>
          <div class="cart-item-details">
            <div>
              <h3>${item.product_name || 'Unknown Product'}</h3>
              <p>${item.unit_quantity || ''}</p>
            </div>
            <div class="cart-items">
              <p>Price: $${item.unit_price.toFixed(2)}</p>
              <div class="quantity-controls">
                <button class="quantity-btn decrease" data-id="${item.product_id}">-</button>
                <span class="quantity-display">${item.quantity}</span>
                <button class="quantity-btn increase" data-id="${item.product_id}">+</button>
              </div>
              <p>Total: $${itemTotal.toFixed(2)}</p>
            </div>
          </div>
        </div>
        <div class="remove__button">
          <button class="remove__btn" data-id="${item.product_id}">Remove</button>
        </div>
      `;
      
      checkoutList.appendChild(cartItem);
    });
    
    const removeButtons = document.querySelectorAll('.remove__btn');
    removeButtons.forEach(button => {
      button.addEventListener('click', function() {
        const productId = parseInt(this.getAttribute('data-id'), 10);
        console.log("Remove button clicked for product ID:", productId);
        removeFromCart(productId);
      });
    });

    const decreaseButtons = document.querySelectorAll('.quantity-btn.decrease');
    const increaseButtons = document.querySelectorAll('.quantity-btn.increase');
    
    decreaseButtons.forEach(button => {
      button.addEventListener('click', function() {
        const productId = parseInt(this.getAttribute('data-id'), 10);
        const itemToUpdate = cart.find(item => item.product_id === productId);
        if (itemToUpdate) {
          updateCartItemQuantity(productId, itemToUpdate.quantity - 1);
        }
      });
    });
    
    increaseButtons.forEach(button => {
      button.addEventListener('click', function() {
        const productId = parseInt(this.getAttribute('data-id'), 10);
        const itemToUpdate = cart.find(item => item.product_id === productId);
        if (itemToUpdate) {
          updateCartItemQuantity(productId, itemToUpdate.quantity + 1);
        }
      });
    });
    
    const totalElement = document.createElement('div');
    totalElement.className = 'cart-total';
    totalElement.innerHTML = `<h3>Total: $${totalPrice.toFixed(2)}</h3>`;
    checkoutList.appendChild(totalElement);
    
    console.log("Cart rendering complete");
  }

  if (currentPage === "cart.html" || currentPage === "checkout.html" || currentPage === "order.html" || currentPage === "") {
    console.log("On cart/order page, rendering cart");
    renderCart();
  }

  function renderProducts(productsToRender) {
    if (!productGrid) {
      console.log("Product grid element not found on this page");
      return;
    }
    
    productGrid.innerHTML = "";

    if (!productsToRender || productsToRender.length === 0) {
      productGrid.innerHTML = '<div class="no-products">No products found.</div>';
      return;
    }

    console.log(`Rendering ${productsToRender.length} products to grid`);

    productsToRender.forEach((product) => {
      const productCard = document.createElement("div");
      productCard.className = "product_card";

      const isInStock = product.in_stock > 0;

      productCard.innerHTML = `
        <div class="product-image">
          <img src="${product.image}" alt="${product.product_name}">
        </div>
        <div class="product-details">
          <div class="product-price">
            <h2>$${product.unit_price.toFixed(2)}</h2>
            <h4>${product.unit_quantity}</h4>
          </div>
          <div class="product-name">
            <p>${product.product_name}</p>
          </div>
          <div class="product-actions">
            <button class="add-to-cart" ${!isInStock ? "disabled" : ""}>
              ${isInStock ? "Add to cart" : "Out of stock"}
            </button>
          </div>
        </div>
      `;

      const addToCartBtn = productCard.querySelector(".add-to-cart");
      if (isInStock) {
        addToCartBtn.addEventListener("click", function () {
          addToCart(product);
        });
      }

      productGrid.appendChild(productCard);
    });
  }

  function getProductsByCategory(category) {
    console.log(`Getting products for category: ${category}`);
    console.log(`Total products available: ${products.length}`);
    
    if (category === "Food and Beverages") {
      return products.filter(
        (product) =>
          product.category === "Frozen Foods" ||
          product.category === "Fresh Foods" ||
          product.category === "Fruits & Vegetables" ||
          product.category === "Beverages & Confectionery"
      );
    } else if (category === "Household Essentials") {
      return products.filter(
        (product) => product.category === "Household Essentials"
      );
    } else if (category === "Health and Personal Care") {
      return products.filter(
        (product) => product.category === "Health & Pharmacy"
      );
    } else if (category === "Pet Care") {
      return products.filter((product) => product.category === "Pet Supplies");
    } else {
      return products;
    }
  }

  if (searchInput) {
    searchInput.addEventListener("input", function () {
      const searchTerm = this.value.toLowerCase();
      const categoryProducts = getProductsByCategory(pageCategory);
      const filteredProducts = categoryProducts.filter((product) =>
        product.product_name.toLowerCase().includes(searchTerm)
      );
      renderProducts(filteredProducts);
    });
  }

  if (productGrid) {
    console.log("Product grid found, getting products for category:", pageCategory);
    const categoryProducts = getProductsByCategory(pageCategory);
    console.log(`Found ${categoryProducts.length} products for this category`);
    renderProducts(categoryProducts);
  }

  // Fixed checkout form submission
  if (checkoutForm) {
    checkoutForm.addEventListener('submit', function(event) {
      event.preventDefault();
      
      console.log("Form submission attempted");
      
      if (checkoutForm.checkValidity()) {
        console.log("Form is valid, proceeding with order");
        
        const checkoutBox = document.querySelector('.checkout_box');
        if (checkoutBox) {
          checkoutBox.style.display = 'none';
        }
        
        if (confirmationMessage) {
          confirmationMessage.classList.remove('hidden');
        }
      } else {
        console.log("Form is invalid, showing validation errors");
        checkoutForm.reportValidity();
      }
    });
  }

  if (orderButton && !checkoutForm) {
    orderButton.addEventListener('click', function() {
      console.log("Order button clicked without form validation");
      
      const checkoutBox = document.querySelector('.checkout_box');
      if (checkoutBox) {
        checkoutBox.style.display = 'none';
      }
      if (confirmationMessage) {
        confirmationMessage.classList.remove('hidden');
      }
    });
  }

  if (completeButton) {
    completeButton.addEventListener('click', function() {
      localStorage.removeItem("cart");
      window.location.href = 'index.html';
    });
  }

  // Enable search on index.html
  if (currentPage === "index.html" || currentPage === "") {
    const indexSearchInput = document.querySelector(".top__nav .search-container input");
    const indexSearchButton = document.querySelector(".top__nav .search-container button");
    
    if (indexSearchInput && indexSearchButton) {
      indexSearchInput.addEventListener("input", function() {
        const searchTerm = this.value.toLowerCase();
        if (searchTerm.length > 0) {
          // If on index page and user types in search, prepare for redirect
          indexSearchButton.addEventListener("click", function() {
            window.location.href = `foodandbev.html?search=${encodeURIComponent(searchTerm)}`;
          });
        }
      });
      
      // Handle enter key press in search input
      indexSearchInput.addEventListener("keypress", function(event) {
        if (event.key === "Enter") {
          const searchTerm = this.value.toLowerCase();
          if (searchTerm.length > 0) {
            window.location.href = `foodandbev.html?search=${encodeURIComponent(searchTerm)}`;
          }
        }
      });
    }
  }

  // Dropdown functionality for mobile
  document.addEventListener('click', function(event) {
    const dropdowns = document.querySelectorAll('.dropdown-menu');
    let clickedDropdown = false;
    
    // Check if the click was inside a dropdown or its trigger
    const isDropdownOrTrigger = event.target.closest('.category_links > li');
    
    if (!isDropdownOrTrigger) {
      // If clicked outside, close all dropdowns on mobile
      dropdowns.forEach(dropdown => {
        dropdown.style.opacity = '0';
        dropdown.style.visibility = 'hidden';
        
        // Reset after transition
        setTimeout(() => {
          if (!dropdown.matches(':hover')) {
            dropdown.removeAttribute('style');
          }
        }, 300);
      });
    }
  });

  // For mobile: toggle dropdowns on click instead of hover
  const categoryItems = document.querySelectorAll('.category_links > li > a');
  categoryItems.forEach(item => {
    item.addEventListener('click', function(event) {
      // Only apply this behavior on mobile
      if (window.innerWidth <= 768) {
        const parentLi = this.parentElement;
        const dropdown = parentLi.querySelector('.dropdown-menu');
        
        if (dropdown) {
          event.preventDefault(); // Prevent navigation
          
          // Check if this dropdown is already open
          const isOpen = dropdown.style.visibility === 'visible';
          
          // Close all other dropdowns
          document.querySelectorAll('.dropdown-menu').forEach(menu => {
            if (menu !== dropdown) {
              menu.style.opacity = '0';
              menu.style.visibility = 'hidden';
            }
          });
          
          // Toggle this dropdown
          if (isOpen) {
            dropdown.style.opacity = '0';
            dropdown.style.visibility = 'hidden';
          } else {
            dropdown.style.opacity = '1';
            dropdown.style.visibility = 'visible';
          }
        }
      }
    });
  });
});