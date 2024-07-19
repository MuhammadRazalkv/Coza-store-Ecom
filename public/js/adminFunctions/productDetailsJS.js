document.addEventListener('DOMContentLoaded', () => {
    const forms = document.querySelectorAll('.block-product-form');
  
    forms.forEach(form => {
      const button = form.querySelector('.block-product-btn');
      const variantId = form.getAttribute('data-id');
  
      button.addEventListener('click', async (e) => {
        e.preventDefault();
  
        const action = button.textContent.trim().toLowerCase();
        const confirmMessage = `Are you sure you want to ${action} this variant?`;
  
        const result = await Swal.fire({
          title: confirmMessage,
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#3085d6',
          cancelButtonColor: '#d33',
          confirmButtonText: 'Yes'
        });
  
        if (result.isConfirmed) {
          try {
            const response = await fetch('/admin/product/blockVariant', {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ id: variantId })
            });
  
            const data = await response.json();
  
            if (response.ok) {
              Swal.fire({
                title: 'Success',
                text: data.message,
                icon: 'success'
              }).then(() => {
                // Update the button text and class based on the new status
                if (data.listed) {
                  button.textContent = 'Unlist';
                  button.classList.remove('btn-success');
                  button.classList.add('btn-danger');
                } else {
                  button.textContent = 'List';
                  button.classList.remove('btn-danger');
                  button.classList.add('btn-success');
                }
              });
            } else {
              Swal.fire({
                title: 'Error',
                text: data.message,
                icon: 'error'
              });
            }
          } catch (error) {
            Swal.fire({
              title: 'Error',
              text: 'An unexpected error occurred.',
              icon: 'error'
            });
          }
        }
      });
    });
  });
  