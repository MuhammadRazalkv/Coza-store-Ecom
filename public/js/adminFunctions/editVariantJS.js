document.addEventListener("DOMContentLoaded", () => {
  let selectedSizes = {};

  try {
    const raw = document.getElementById("sizes")?.value;
    const parsed = raw ? JSON.parse(raw) : [];

    parsed.forEach(({ size, stock }) => {
      selectedSizes[size] = stock;
    });
  } catch (err) {
    console.error("Invalid sizes JSON:", err);
    selectedSizes = {};
  }

  const container = document.getElementById("stockContainer");

  Object.entries(selectedSizes).forEach(([size, stock]) => {
    const checkbox = document.querySelector(
      `input[type="checkbox"][value="${size}"]`
    );
    if (checkbox) checkbox.checked = true;

    const row = document.createElement("div");
    row.className = "size-row mb-1";
    row.id = `row-${size}`;

    row.innerHTML = `
      <label>${size} - Stock:</label>
      <input type="number" min="0" value="${stock}"
        onchange="updateStock('${size}', this.value)">
    `;

    container.appendChild(row);
  });
});

let cropper;
let currentIndex;
const modal = new bootstrap.Modal(document.querySelector("#cropperModal"));
document.querySelectorAll('#productImage1, #productImage2, #productImage3').forEach(input => {
  input.addEventListener('change', function (event) {
    if (validateFileType(event.target.files[0])) {
      showCropper(event.target, event.target.id);
    } else {
      alert('Only image files are allowed!');

      event.target.value = '';
    }
  });
});

function validateFileType(file) {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
  return allowedTypes.includes(file.type);
}

function showCropper(input, id) {
  currentIndex = id;
  const file = input.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      const image = document.getElementById('image');
      image.src = e.target.result;
      modal.show();
      image.onload = function () {
        initCropper();
      };
    };
    reader.readAsDataURL(file);
  }
}

function initCropper() {
  const image = document.getElementById('image');
  if (cropper) {
    cropper.destroy();
  }
  cropper = new Cropper(image, {
    aspectRatio: 270 / 360, // Set the aspect ratio to 270x360
    viewMode: 1, // Ensure the entire image is visible
    responsive: true,
    cropBoxResizable: false, // Prevent resizing of the crop box
    minCropBoxWidth: 270,
    minCropBoxHeight: 360,
    ready() {
      cropper.setCropBoxData({
        width: 270,
        height: 360,
      });
    }
  });
}

function closeModal() {
  modal.hide();
  if (cropper) {
    cropper.destroy();
    cropper = null;
  }
}

document.getElementById('cancelCropButton').addEventListener('click', function () {
  closeModal();
});

document.getElementById('cropButton').addEventListener('click', function () {
  cropper.getCroppedCanvas({ width: 270, height: 360 }).toBlob(function (blob) {
    const url = URL.createObjectURL(blob);
    const chosenImagesDiv = document.getElementById('chosenImages');
    const newImg = document.createElement('img');
    newImg.src = url;
    newImg.alt = 'Chosen Image ' + currentIndex;
    newImg.style.minWidth = '80px';
    newImg.style.maxWidth = '80px';
    newImg.style.maxHeight = '80px';
    newImg.style.marginRight = '10px';
    newImg.style.marginTop = '15px';
    newImg.style.display = 'block';

    const existingImg = document.getElementById('chosenImage' + currentIndex);
    if (existingImg) {
      chosenImagesDiv.removeChild(existingImg);
    }

    newImg.id = 'chosenImage' + currentIndex;
    chosenImagesDiv.appendChild(newImg);

    const input = document.getElementById(`productImage${currentIndex}`);
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(new File([blob], 'image.jpg'));
    input.files = dataTransfer.files;

    closeModal();
  });
});

document.querySelectorAll(".custom-file-input").forEach(input => {
  input.addEventListener("change", function () {
    const index = this.dataset.index;
    showCropper(this, index);
  });
});

let selectedSizes = JSON.parse(document.getElementById('sizes').value || []);


function toggleSize(input) {
  const container = document.getElementById("stockContainer");
  if (input.checked) {
    // create stock input row
    let obj = {}

    obj.size = input.value;
    obj.stock = 0
    selectedSizes.push(obj);
    
    const row = document.createElement("div");
    row.className = "size-row mb-1";
    row.id = `row-${input.value}`;

    row.innerHTML = `
    <label>${input.value} - Stock:</label>
    <input type="number" min="0" value="0"
    onchange="updateStock('${input.value}', this.value)">
    `;

    container.appendChild(row);

  } else {

    let newSizeArray = selectedSizes.filter(
      ({ size }) => size !== input.value
    );

    selectedSizes = newSizeArray;
    document.getElementById(`row-${input.value}`)?.remove();
  }
  updateHiddenField();
}

function updateStock(size, value) {
  for (const obj of selectedSizes) {
    if (obj.size === size) {
      obj.stock = Number(value) || 0;
    }
  }
  updateHiddenField();
}

function updateHiddenField() {
  document.getElementById("sizes").value = JSON.stringify(selectedSizes);
}


document.querySelectorAll('input[name="sizes"]').forEach(input => {
  input.addEventListener('change', () => updateSizes(input));
});

function validateVariant(data) {
  const colorPattern = /^(?=.*[A-Za-z])[A-Za-z ]{3,}$/;
  const maxPrice = 100000;
  const price = Number(data.variantPrice);

  if (!Number.isFinite(price)) {
    return "Price must be a valid number.";
  }

  if (price <= 0) {
    return "Price must be greater than ₹0.";
  }

  if (price > maxPrice) {
    return `Price cannot exceed ₹${maxPrice}.`;
  }

  if (!colorPattern.test(data.variantColor)) {
    return "Color must contain only letters and be at least 3 characters.";
  }

  data.sizes = JSON.parse(data.sizes)
  if (!Array.isArray(data.sizes) || data.sizes.length === 0) {
    return "At least one size is required.";
  }

  const seen = new Set();
  console.log('sizes',data.sizes);
  
  for (const s of data.sizes) {
    console.log('S',s);
    
    if (!s.size || s.size.trim() === "") {
      return "Size name cannot be empty.";
    }

    if (seen.has(s.size)) {
      return "Duplicate sizes are not allowed.";
    }
    seen.add(s.size);

    if (isNaN(s.stock) || Number(s.stock) < 0) {
      return "Stock must be zero or a positive number.";
    }
  }

  return null;
}

const errorDiv = document.getElementById('messageContainer')

function setLoading(button, isLoading, text = "Submitting...") {
  if (!button) return;

  button.disabled = isLoading;
  button.textContent = isLoading ? text : button.dataset.originalText;
}
const btn = document.getElementById("submit-btn");
btn.dataset.originalText = btn.textContent;

document.getElementById('editVariantForm').addEventListener('submit', async function (event) {
  event.preventDefault()

  const form = event.target
  const formData = new FormData(form)

  const variantId = document.getElementById('variantId').value
  const data = {
    variantPrice: Number(formData.get("variantPrice")),
    variantColor: formData.get("variantColor")?.trim(),
    productId: formData.get("productId"),
    variantId: formData.get('variantId'),
    sizes: formData.get('sizesInput'),
    existingImages: [
      formData.get("existingImg1"),
      formData.get("existingImg2"),
      formData.get("existingImg3")
    ]
  };
  const imageFiles = [
    formData.get("variantImg1"),
    formData.get("variantImg2"),
    formData.get("variantImg3")
  ].filter(file => file && file.size > 0);

  const error = validateVariant(data)
  if (error) {
    errorDiv.innerText = error;
    return
  }

  try {
    setLoading(btn, true)
    const response = await fetch(`/admin/product/editVariant/${variantId}`, {
      method: 'POST',
      body: formData
    })

    const result = await response.json()

    if (!response.ok) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: result.message
      })
      return
    }

    Swal.fire({
      icon: 'success',
      title: 'Success',
      text: result.message,
      confirmButtonText: 'OK'
    }).then(result => {
      if (result.isConfirmed) {
        const productId = document.getElementById('productId').value
        window.location.href = `/admin/product/details?id=${productId}` // Redirect on successful response
      }
    })

  } catch (error) {
    console.error('Error submitting form:', error);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'An error occurred while editing the product.'
    });
  } finally {
    setLoading(btn, false)
  }

});
