

let cropper;
let currentIndex;
const modal = new bootstrap.Modal(document.querySelector("#cropperModal"));

document.querySelectorAll('#productImage1, #productImage2, #productImage3').forEach(input => {
  input.addEventListener('change', function(event) {
    if (validateFileType(event.target.files[0])) {
      showCropper(event.target, event.target.id); // Pass the input element's ID as the second argument
    } else {
      alert('Only image files are allowed!');
      event.target.value = ''; // Clear the invalid file input
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



let selectedSizes = [];

function updateSizes(input) {
  if (input.checked && !selectedSizes.includes(input.value)) {
    selectedSizes.push(input.value);
  } else if (!input.checked) {
    selectedSizes = selectedSizes.filter(size => size !== input.value);
  }


  const refinedValues = selectedSizes.filter(size => size && size !== '[]');
  document.getElementById('sizes').value = JSON.stringify(refinedValues);
  //console.log('Updated sizesInput:', document.getElementById('sizes').value);
}

document.querySelectorAll('input[name="sizes"]').forEach(input => {
  input.addEventListener('change', () => updateSizes(input));
});

document.getElementById('addVariantForm').addEventListener('submit', async function(event) {
  event.preventDefault();
  console.log('submit ');
  const form = event.target;
  const formData = new FormData(form);

  // Logging the FormData entries to debug
//   for (let [key, value] of formData.entries()) {
//     console.log(`${key}: ${value}`);
//   }

  try {
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
  }
});
