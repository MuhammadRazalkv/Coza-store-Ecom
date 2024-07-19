

// document.addEventListener('DOMContentLoaded', function(){

async function removeItem(variantId,selectedSize){
    console.log('variant ID ',variantId);
    const confirmMessage = 'Are you sure you want to remove this item from wishlist'
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
        
        console.log('result con ');
        const response = await fetch(`/removeWishlistItem/${variantId}/${selectedSize}`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json'
            }
          });
        
        const data = await response.json()
        if (response.ok) {
            Swal.fire({
                title: "Success !",
                text:data.message,
                icon: "success"
              }).then(()=>{
                window.location.reload()
              })
        }else{
            Swal.fire({
                icon: "error",
                title: "Oops...",
                text: data.message,
               
              });
        }
       } catch (error) {
        console.log(error);
       }
     
      }

}


async function addToCart(variantId,selectedSize){
  
  if ( variantId && selectedSize ) {
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
      console.log('error in addToCart from wishlist',error);

    }
  }

}

// })