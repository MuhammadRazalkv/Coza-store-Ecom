document.addEventListener('DOMContentLoaded', () => {
    // Handle Block/Unblock Coupons
    const blockForms = document.querySelectorAll('.block-product-form-unique');
  
    blockForms.forEach(form => {
      const button = form.querySelector('.block-product-btn-unique');
      const offerId = form.getAttribute('data-block-offer-id');
  
      button.addEventListener('click', async (e) => {
        e.preventDefault();
  
        const action = button.textContent.trim().toLowerCase();
        const confirmMessage = `Are you sure you want to ${action} this product?`;
  
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
            const response = await fetch('/admin/offers/changeStatus', {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ offerId })
            });
  
            const data = await response.json();
  
            if (response.ok) {
              Swal.fire({
                position: "top-end",
                icon: "success",
                title: data.message,
                showConfirmButton: false,
                timer: 1000
              }).then(() => {
                if (data.listed) {
                  button.textContent = 'Unlist';
                  button.classList.remove('cm-btn-list');
                  button.classList.add('cm-btn-delete');
                } else {
                  button.textContent = 'List';
                  button.classList.remove('cm-btn-delete');
                  button.classList.add('cm-btn-list');
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
            console.log(error);
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


  // Delete offer
  

  const deleteForms = document.querySelectorAll('.delete-coupon-form-unique');
  
  deleteForms.forEach(form => {
    const button = form.querySelector('.delete-coupon-btn-unique');
    const offerId = form.getAttribute('data-delete-offer-id');
   

    button.addEventListener('click', async (e) => {
      e.preventDefault();

      const confirmMessage = `Are you sure you want to delete this coupon?`;

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
          const response = await fetch('/admin/offers/deleteOffer', {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ offerId })
          });

          const data = await response.json();

          if (response.ok) {
            Swal.fire({
              position: "top-end",
              icon: "success",
              title: data.message,
              showConfirmButton: false,
              timer: 1000
            }).then(() => {
              window.location.reload();
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
