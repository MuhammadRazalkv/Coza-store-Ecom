const numberInputs = document.querySelectorAll('.numberVal')

numberInputs.forEach(input => {
  input.addEventListener('input', function () {
    if (this.value < 0) {
      this.value = 0
    }
  })
})

document
  .getElementById('addCoupon')
  .addEventListener('submit', async function (e) {
    e.preventDefault()
    const alert = document.getElementById('alertMessage')
    const couponName = document.getElementById('couponName').value
    const couponCode = document.getElementById('couponCode').value
    const minimumPurchaseAmount = document.getElementById('minimumPurchaseAmount').value
    const discountPercentage = document.getElementById('discountPercentage').value
    const maxRedeemAmount = document.getElementById('maxRedeemAmount').value
    

    const expiryDate = document.getElementById('expiryDate').value
    const currentDate = new Date()
    const inputDate = new Date(expiryDate)
   
    if ( couponName == '' ||couponCode == '' ||  minimumPurchaseAmount =='' || maxRedeemAmount =='' || discountPercentage =='' ) {
      alert.innerText = 'Please fill out all the columns'
      alert.style.display = 'block';
      return
     }

    if (discountPercentage < 10 || discountPercentage > 90) {
      alert.innerText = 'Please select the discount percentage between 10-90'
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
    

   const response = await fetch('/admin/addCoupon',{
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body:JSON.stringify({
      couponName,
      couponCode,
      minimumPurchaseAmount,
      discountPercentage,
      maxRedeemAmount,
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
      window.location.href = '/admin/couponList'
    })
} else {
    Swal.fire({
        icon: "error",
        title: "Oops...",
        text: data.message,
    });
}

})


