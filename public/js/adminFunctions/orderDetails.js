// document.addEventListener('DOMContentLoaded', function () {
//   const selects = document.querySelectorAll('.status-select')

//   selects.forEach(select => {
//     select.addEventListener('change', async function () {
//       const orderId = this.dataset.orderId
//       const variantId = this.dataset.variantId
//       const newStatus = this.value
    
//       console.log('ns', newStatus)

//       const confirmMessage = `Are you sure you want to ${newStatus} this order`
//       const result = await Swal.fire({
//         title: confirmMessage,
//         icon: 'warning',
//         showCancelButton: true,
//         confirmButtonColor: '#3085d6',
//         cancelButtonColor: '#d33',
//         confirmButtonText: 'Yes'
//       })

//       if (result.isConfirmed) {
//         fetch(`/admin/userOrders/change-status/${orderId}`, {
//           method: 'POST',
//           headers: {
//             'Content-Type': 'application/json'
//           },
//           body: JSON.stringify({
//             status: newStatus,
//             variantId: variantId
//           })
//         })
//           .then(response => response.json())
//           .then(data => {
//             if (data.success) {
//               Swal.fire({
//                 title: 'Success',
//                 text: data.message,
//                 icon: 'success'
//               })
//             } else {
//               Swal.fire({
//                 title: 'Error',
//                 text: data.message,
//                 icon: 'error'
//               })
//             }
//           })
//           .catch(error => {
//             console.log('err in update orderStatus')
//             Swal.fire({
//               title: 'Error',
//               text: error,
//               icon: 'error'
//             })
//           })
//       }
//     })
//   })
// })

document.addEventListener('DOMContentLoaded', function () {
  const selects = document.querySelectorAll('.status-select')

  selects.forEach(select => {
    select.addEventListener('change', async function () {
      const orderId = this.dataset.orderId
      const variantId = this.dataset.variantId
      const newStatus = this.value
      const currentStatus = this.dataset.currentStatus // Get the current status from a data attribute
    

      const confirmMessage = `Are you sure you want to ${newStatus} this order`
      const result = await Swal.fire({
        title: confirmMessage,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes'
      })

      if (result.isConfirmed) {
        fetch(`/admin/userOrders/change-status/${orderId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            status: newStatus,
            variantId: variantId
          })
        })
          .then(response => response.json())
          .then(data => {
            if (data.success) {
              Swal.fire({
                title: 'Success',
                text: data.message,
                icon: 'success'
              }).then(()=>{
                this.dataset.currentStatus = newStatus
                window.location.reload()
              })
              
              
            } else {
              Swal.fire({
                title: 'Error',
                text: data.message,
                icon: 'error'
              })
              // Revert the select to the current status if there was an error
              this.value = currentStatus
            }
          })
          .catch(error => {
          
            Swal.fire({
              title: 'Error',
              text: error,
              icon: 'error'
            })
            // Revert the select to the current status if there was an error
            this.value = currentStatus
          })
      } else {
        // Revert the select to the current status if the user cancelled the confirmation
        this.value = currentStatus
      }
    })
  })
})

