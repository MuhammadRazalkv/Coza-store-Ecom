document
  .getElementById('addProductForm')
  .addEventListener('submit', async function (event) {
    event.preventDefault()

    const form = event.target
    const formData = new FormData(form)
 
  
    try {
      const response = await fetch('/admin/product/add', {
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
          window.location.href = '/admin/products-list' // Redirect on successful response
        }
      })
    } catch (error) {
      console.error('Error submitting form:', error)
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'An error occurred while adding the product.'
      })
    }
  })
