document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('addToCart').addEventListener('submit', async (e) => {
        e.preventDefault();
        // console.log('Entered addToCart event listener');

        const variantId = document.getElementById('variantId').value;
        const selectedSize = document.getElementById('selectedSize') ? document.getElementById('selectedSize').value : '';
        let valid = true;
        const confirmMsg = 'Please select a size';

        if (!selectedSize) {
            Swal.fire({
                icon: "error",
                title: "Oops...",
                text: confirmMsg,
            });
            valid = false;
          
        }

        if (valid) {
            try {
                const response = await fetch('/addToCart', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        variantId,
                        selectedSize
                    })
                });

                if (response.redirected) {
                    Swal.fire({
                        title: 'Error!',
                        text: 'Please login to perform this action',
                        icon: 'error'
                    }).then(() => {
                        window.location.href = response.url;
                    });
                    return; // Stop further execution if redirected
                }

                
                const data = await response.json();

                if (response.ok) {
                    Swal.fire({
                        position: "top-end",
                        icon: "success",
                        title: data.message,
                        showConfirmButton: false,
                        timer: 1500
                    });
                } else {
                    Swal.fire({
                        icon: "error",
                        title: "Oops...",
                        text: data.message,
                    });
                }
            } catch (error) {
                console.error('Error in addToCart request:', error);
                Swal.fire({
                    title: 'Error',
                    icon: 'error',
                    text: 'An unexpected error occurred. Please try again later.'
                });
            }
        }
    });


//* Add to Wish list 


document.getElementById('addToWishlist').addEventListener('click',async function (e){
    e.preventDefault()
    
    const  variantId = document.getElementById('variantId').value; 
    const selectedSize = document.getElementById('selectedSize') ? document.getElementById('selectedSize').value : '';
    try {
        if (variantId) {
            const response =    await fetch('/addToWishlist',{
                   method: 'POST',
                   headers: {
                       'Content-Type': 'application/json'
                   },
                   body: JSON.stringify({
                       variantId,
                       selectedSize
                   })
               })
               if (response.redirected) {
                   Swal.fire({
                       title: 'Error!',
                       text: 'Please login to perform this action',
                       icon: 'error'
                   }).then(() => {
                       window.location.href = response.url;
                   });
                   return;
               }
             
               const data = await response.json()
               if (response.ok) {
                   Swal.fire({
                    icon: "success",
                       title: "Success",
                       text: data.message,
                       footer: '<a href="/wishlist">Go to wishlist </a>'
                     });
               } else {
                   Swal.fire({
                       icon: "error",
                       title: "Oops...",
                       text: data.message,
                   });
               }
       
           }
    } catch (error) {
    
        Swal.fire({
            title: 'Error',
            icon: 'error',
            text: 'An unexpected error occurred. Please try again later.'
        });
    }



})








});
