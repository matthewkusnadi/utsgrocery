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
              <p>Quantity: ${item.quantity}</p>
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
      
      const checkoutBox = document.querySelector('.ch