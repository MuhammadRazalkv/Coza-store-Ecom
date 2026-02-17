let cropper;
let currentIndex;
const modal = new bootstrap.Modal(document.querySelector("#cropperModal"));

document
  .querySelectorAll('#productImage1, #productImage2, #productImage3')
  .forEach(input => {
    input.addEventListener('change', function (event) {
      const file = event.target.files[0];
      const maxFileSize = 5 * 1024 * 1024;
      if (!file) return;
      if (file.size > maxFileSize) {
        Swal.fire({
          icon: 'error',
          title: 'Maximum file size exceeded.',
          text: 'Please select images less than 5mb.'
        });
        event.target.value = ''
        return
      }
      if (validateFileType(file)) {
        showCropper(event.target, event.target.id);
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Invalid file',
          text: 'Only JPG, PNG, or WEBP images are allowed.'
        });
        event.target.value = "";
      }
    });
  });

function validateFileType(file) {
  const allowedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp'
  ];

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
        initCropper(); // Ensure initCropper is called after the image has loaded
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
    aspectRatio: 270 / 360, // Aspect ratio for 270x360
    viewMode: 1, // Ensure the entire image is visible
    responsive: true,
    cropBoxResizable: false, // Prevent resizing of the crop box
    minCropBoxWidth: 270, // Minimum width of the crop box
    minCropBoxHeight: 360, // Minimum height of the crop box
    maxCropBoxWidth: 270, // Maximum width of the crop box
    maxCropBoxHeight: 360, // Maximum height of the crop box
    ready() {
      // Set the crop box to the desired dimensions once the image is ready
      cropper.setCropBoxData({
        width: 270,
        height: 360,
      });
    }
  });
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

    // Remove the previous image with the same index if it exists
    const existingImg = document.getElementById('chosenImage' + currentIndex);
    if (existingImg) {
      chosenImagesDiv.removeChild(existingImg);
    }

    // Add id to the new image for potential future removal
    newImg.id = 'chosenImage' + currentIndex;
    chosenImagesDiv.appendChild(newImg);

    // Replace the file input with the new blob
    const input = document.getElementById(currentIndex);
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(new File([blob], 'image.jpg')); // Provide a default file name 'image.jpg'
    input.files = dataTransfer.files;

    closeModal();
  });
});

function closeModal() {
  modal.hide();
  if (cropper) {
    cropper.destroy();
    cropper = null;
  }
}



// let selectedSizes = [];

// function updateSizes(input) {
//   if (input.checked && !selectedSizes.includes(input.value)) {
//     selectedSizes.push(input.value);
//   } else if (!input.checked) {
//     selectedSizes = selectedSizes.filter(size => size !== input.value);
//   }


//   const refinedValues = selectedSizes.filter(size => size && size !== '[]');
//   document.getElementById('sizes').value = JSON.stringify(refinedValues);
//   //console.log('Updated sizesInput:', document.getElementById('sizes').value);
// }

const selectedSizes = {};

function toggleSize(input) {
  const container = document.getElementById("stockContainer");

  if (input.checked) {
    // create stock input row
    selectedSizes[input.value] = 0;

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
    // remove size + stock
    delete selectedSizes[input.value];
    document.getElementById(`row-${input.value}`)?.remove();
  }

  updateHiddenField();
}

function updateStock(size, value) {
  selectedSizes[size] = Number(value) || 0;
  updateHiddenField();
}

function updateHiddenField() {
  const sizesArray = Object.entries(selectedSizes).map(([size, stock]) => ({
    size,
    stock
  }));

  document.getElementById("sizes").value = JSON.stringify(sizesArray);
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

  for (const s of data.sizes) {
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
document.getElementById('addVariantForm').addEventListener('submit', async function (event) {
  event.preventDefault();
  errorDiv.innerText = ''
  const form = event.target;
  const formData = new FormData(form);

  const data = {
    variantPrice: Number(formData.get("variantPrice")),
    variantColor: formData.get("variantColor")?.trim(),
    productId: formData.get("productId"),
    sizes: formData.get('sizesInput'),
  };
  const imageFiles = [
    formData.get("variantImg1"),
    formData.get("variantImg2"),
    formData.get("variantImg3")
  ].filter(file => file && file.size > 0);

  if (imageFiles.length !== 3) {
    return "Please upload exactly 3 images.";
  }

  const error = validateVariant(data)
  if (error) {
    errorDiv.innerText = error;
    return
  }

  try {
    setLoading(btn, true)
    const response = await fetch('/admin/product/addVariant', {
      method: 'POST',
      body: formData
    });

    const result = await response.json();
    if (!response.ok) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: result.message
      });
      return;
    }
    const productId = document.getElementById('productId').value;
    Swal.fire({
      icon: 'success',
      title: 'Success',
      text: result.message,
      confirmButtonText: 'OK'
    }).then(result => {
      if (result.isConfirmed) {
        window.location.href = `/admin/product/details?id=${productId}`;
      }
    });
  } catch (error) {
    console.error('Error submitting form:', error);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'An error occurred while adding the product.'
    });
  } finally {
    setLoading(btn, false)
  }
});