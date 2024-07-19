

document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('search-input');
  let currentCategory = '';
  let currentSize = '';
  let currentColor = '';

  searchInput.addEventListener('input', function () {
    const searchTerm = this.value;
    fetchProducts({ search: searchTerm, categoryName: currentCategory, size: currentSize, color: currentColor });
  });

  window.sortShop = async function (sortBy) {
    const searchTerm = searchInput.value;
    fetchProducts({ search: searchTerm, sortBy: sortBy, categoryName: currentCategory, size: currentSize, color: currentColor });
  };

  window.categorySort = async function (name) {
    currentCategory = name;
    const searchTerm = searchInput.value;
    fetchProducts({ search: searchTerm, categoryName: name, size: currentSize, color: currentColor });
  };

  window.filterBySize = async function (size) {
    currentSize = size;
    const searchTerm = searchInput.value;
    fetchProducts({ search: searchTerm, size: size, categoryName: currentCategory, color: currentColor });
  };

  window.filterByColor = async function (color) {
    currentColor = color;
    const searchTerm = searchInput.value;
    fetchProducts({ search: searchTerm, color: color, categoryName: currentCategory, size: currentSize });
  };

  async function fetchProducts({ search = '', sortBy = 'Default', categoryName = '', size = '', color = '' }) {
    try {
      const response = await fetch(`/shop_products?search=${search}&sortBy=${sortBy}&categoryName=${categoryName}&size=${size}&color=${color}`, {
        headers: {
          'X-Requested-With': 'XMLHttpRequest'
        }
      });
      const products = await response.json();
      updateProductList(products);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  }

  function updateProductList(products) {
    const productGrid = document.getElementById('product-grid');
    if (!productGrid) {
      console.error('Product grid element not found');
      return;
    }
    productGrid.innerHTML = '';
  
    if (products.length === 0) {
      const noProductsHtml = `
        <div class="col-12 text-center p-t-35">
          <p>No products found matching the selected criteria.</p>
        </div>
      `;
      productGrid.insertAdjacentHTML('beforeend', noProductsHtml);
      return;
    }
  
    products.forEach(productItem => {
      if (productItem.variant && productItem.variant.length > 0) {
        const firstVariant = productItem.variant[0];
        if (firstVariant && firstVariant.variantImg && firstVariant.variantImg.length > 0) {
          const productHtml = `
            <div class="col-sm-6 col-md-3 col-lg-3 p-b-35 isotope-item">
                <div class="block2">
               <div class="block2-pic hov-img0">
                <a href="/productDetail?id=${productItem._id}&variantId=${firstVariant._id}">
                  <img src="/assets/productImages/${firstVariant.variantImg[0]}" alt="IMG-PRODUCT" />
                  </a>
                </div>
                <div class="block2-txt flex-w flex-t p-t-14">
                  <div class="block2-txt-child1 flex-col-l">
                    <a href="/productDetail?id=${productItem._id}&variantId=${firstVariant._id}" class="stext-104 cl4 hov-cl1 trans-04 js-name-b2 p-b-6">${productItem.productName}</a>
                    <span class="stext-105 cl3">RS ${firstVariant.variantDiscountPrice}</span>
                  </div>
                  <div class="block2-txt-child2 flex-r p-t-3">
                 
                  </div>
                </div>
              </div>
            </div>
          `;
          productGrid.insertAdjacentHTML('beforeend', productHtml);
        }
      }
    });
  }
});
