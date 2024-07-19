
document.getElementById('selectType').addEventListener('change', function () {
    var type = this.value;
    var categoryContainer = document.getElementById('categoryContainer');
    var productContainer = document.getElementById('productContainer');

    if (type === 'Category Offer') {
      categoryContainer.style.display = 'block';
      productContainer.style.display = 'none';
    } else if (type === 'Product Offer') {
      categoryContainer.style.display = 'none';
      productContainer.style.display = 'block';
    } else {
      categoryContainer.style.display = 'none';
      productContainer.style.display = 'none';
    }
  });


const numberInputs = document.querySelectorAll('.numberVal')

numberInputs.forEach(input => {
  input.addEventListener('input', function () {
    if (this.value < 0) {
      this.value = 0
    }
  })
})

document
  .getElementById('addOffer')
  .addEventListener('submit', async function (e) {
    e.preventDefault()
    const alert = document.getElementById('alertMessage')
    const offerName = document.getElementById('offerName').value
    const selectType = document.getElementById('selectType').value
    const productId = document.getElementById('productSelect').value
    const categoryId = document.getElementById('categorySelect').value
    const discountPercentage = document.getElementById('discountPercentage').value
    

    const expiryDate = document.getElementById('expiryDate').value
    const currentDate = new Date()
    const inputDate = new Date(expiryDate)
   
    if ( offerName == '' ||selectType == '' ||   discountPercentage =='' ) {
      alert.innerText = 'Please fill out all the columns'
      alert.style.display = 'block';
      return
     }

    if (discountPercentage < 1 || discountPercentage > 90) {
      alert.innerText = 'Please select the discount percentage between 1-90'
      alert.style.display = 'block';
      return
    }

    if (expiryDate == '' || inputDate < currentDate) {
      const Toast = Swal.mixin({
        toast: true,
        position: 'bottom',
        iconColor: 'white',
        customClass: {
          popup: 'colored-toast'
        },
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true
      })

      Toast.fire({
        icon: 'error',
        title: `Please choose a future date for expiry`
      })
      // this.value = '';
      return
    }
    

   const response = await fetch('/admin/addOffer',{
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body:JSON.stringify({
        offerName,
        selectType,
        productId,
        categoryId,
        discountPercentage,
        expiryDate
    })
   })
   
   const data = await response.json()
   if (response.ok) {
    Swal.fire({
       
        icon: "success",
        title: data.message,
        showConfirmButton: true,
        
    }).then(()=>{
      window.location.href = '/admin/offers'
    })
} else {
    Swal.fire({
        icon: "error",
        title: "Oops...",
        text: data.message,
    });
}

})

