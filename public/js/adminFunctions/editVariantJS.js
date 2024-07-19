let cropper;
let currentIndex;
const modal = new bootstrap.Modal(document.querySelector("#cropperModal"));
document.querySelectorAll('#productImage1, #productImage2, #productImage3').forEach(input => {
  input.addEventListener('change', function(event) {
    if (validateFileType(event.target.files[0])) {
      showCropper(event.target, event.target.id);
    } else {
      alert('Only image files are allowed!');
      console.log(event.target.value);
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

    const input = document.getElementById(currentIndex);
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(new File([blob], 'image.jpg'));
    input.files = dataTransfer.files;

    closeModal();
  });
});


let selectedSizes = JSON.parse(document.getElementById('sizes').value || '[]');

function updateSizes(input) {
  if (input.checked && !selectedSizes.includes(input.value)) {
    selectedSizes.push(input.value);
  } else if (!input.checked) {
    selectedSizes = selectedSizes.filter(size => size !== input.value);
  }

  const refinedValues = selectedSizes.filter(size => size && size !== '[]');
  document.getElementById('sizes').value = JSON.stringify(refinedValues);
}

document.querySelectorAll('input[name="sizes"]').forEach(input => {
  input.addEventListener('change', () => updateSizes(input));
});

document.getElementById('editVariantForm').addEventListener('submit', async function(event) {
  event.preventDefault()

  const form = event.target
  const formData = new FormData(form)

  const variantId = document.getElementById('variantId').value
  
  try {
   const response = await fetch(`/admin/product/editVariant/${variantId}`,{
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
    console.log('err in editVariantJS.js',error);
    throw error
  }

});
 