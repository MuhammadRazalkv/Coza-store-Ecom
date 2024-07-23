

// // async function editCartReq (index,newQuantity){
// //   const variantId = document.getElementById('variantId'+index).value 
// //     const response =  await fetch('/editCart',{
// //         method: 'PATCH',
        
// //         headers: {
// //             'Content-Type': 'application/json'
// //         },
// //         body: JSON.stringify({
// //             variantId,
// //             newQuantity
// //         })
// //     })
// //     console.log('req to server send ');
// //     const data = await response.json()
// //     if (!response.ok) {
// //         const Toast = Swal.mixin({
// //             toast: true,
// //             position: 'bottom',
// //             iconColor: 'white',
// //             customClass: {
// //                 popup: 'colored-toast',
// //             },
// //             showConfirmButton: false,
// //             timer: 3000,
// //             timerProgressBar: true,
// //         });

// //         Toast.fire({
// //             icon: 'error',
// //             title: data.message
// //         }); 
// //         return false
// //     }


    
    
// // }








// function incrementQuantity(index, currentStock) {
//     var quantityElement = document.getElementById('quantity' + index);
//     var currentQuantity = parseInt(quantityElement.textContent);
//     currentStock = parseInt(currentStock);
//     let incrementBtn = document.getElementById('incrementBtn' + index);
     
//     if (currentQuantity >= 5 ) {
//         quantityElement.textContent = 5
        
//         const Toast = Swal.mixin({
//             toast: true,
//             position: 'bottom',
//             iconColor: 'white',
//             customClass: {
//                 popup: 'colored-toast',
//             },
//             showConfirmButton: false,
//             timer: 3000,
//             timerProgressBar: true,
//         });

//         Toast.fire({
//             icon: 'error',
//             title: `Purchasing limit reached`
//         });
//     }
     
//     else if (currentQuantity >= currentStock) {
//         quantityElement.textContent = currentStock;

//         const Toast = Swal.mixin({
//             toast: true,
//             position: 'bottom',
//             iconColor: 'white',
//             customClass: {
//                 popup: 'colored-toast',
//             },
//             showConfirmButton: false,
//             timer: 3000,
//             timerProgressBar: true,
//         });

//         Toast.fire({
//             icon: 'error',
//             title: `We're sorry, only ${currentStock} left in stock.`
//         });

//     } else {
//         quantityElement.textContent = currentQuantity + 1;
//         updateTotalPrice(index, currentQuantity + 1);
//         const newQuantity = quantityElement.textContent
//         // const variantId = document.getElementById('variantId'+index).value 
//        // console.log('variant id',variantId);
//         try {
            
//             editCartReq(index,newQuantity)
    
//             updateSubtotal();
        
//             } catch (error) {
//                 console.log('err in cart js ',error);
//             }
        
// }
// }

// function decrementQuantity(index) {
//     let quantityElement = document.getElementById('quantity' + index);
//     let currentQuantity = parseInt(quantityElement.textContent);
//     if (currentQuantity > 1) {
//         quantityElement.textContent = currentQuantity - 1;
//         let newQuantity = quantityElement.textContent
//         updateTotalPrice(index, currentQuantity - 1);
//         editCartReq(index,newQuantity)
//         updateSubtotal(); // Update subtotal after decrement
//     }
// }


// async function editCartReq(index, newQuantity) {
//     const variantId = document.getElementById('variantId' + index).value;
//     try {
//         const response = await fetch('/editCart', {
//             method: 'PATCH',
//             headers: {
//                 'Content-Type': 'application/json'
//             },
//             body: JSON.stringify({
//                 variantId,
//                 newQuantity
//             })
//         });
//         console.log('req to server sent');
//         const data = await response.json();
//         if (!response.ok) {
//             const Toast = Swal.mixin({
//                 toast: true,
//                 position: 'bottom',
//                 iconColor: 'white',
//                 customClass: {
//                     popup: 'colored-toast',
//                 },
//                 showConfirmButton: false,
//                 timer: 3000,
//                 timerProgressBar: true,
//             });

//             Toast.fire({
//                 icon: 'error',
//                 title: data.message
//             });
//             return false;
//         }
//         return true;
//     } catch (error) {
//         console.log('Error in editCartReq:', error);
//         return false;
//     }
// }


// function incrementQuantity(index, currentStock) {
//     var quantityElement = document.getElementById('quantity' + index);
//     var currentQuantity = parseInt(quantityElement.textContent);
//     currentStock = parseInt(currentStock);
//     let incrementBtn = document.getElementById('incrementBtn' + index);
     
//     if (currentQuantity >= 5 ) {
//         quantityElement.textContent = 5
        
//         const Toast = Swal.mixin({
//             toast: true,
//             position: 'bottom',
//             iconColor: 'white',
//             customClass: {
//                 popup: 'colored-toast',
//             },
//             showConfirmButton: false,
//             timer: 3000,
//             timerProgressBar: true,
//         });

//         Toast.fire({
//             icon: 'error',
//             title: `Purchasing limit reached`
//         });
//     }
     
//     else if (currentQuantity >= currentStock) {
//         quantityElement.textContent = currentStock;

//         const Toast = Swal.mixin({
//             toast: true,
//             position: 'bottom',
//             iconColor: 'white',
//             customClass: {
//                 popup: 'colored-toast',
//             },
//             showConfirmButton: false,
//             timer: 3000,
//             timerProgressBar: true,
//         });

//         Toast.fire({
//             icon: 'error',
//             title: `We're sorry, only ${currentStock} left in stock.`
//         });

//     } else {
//         quantityElement.textContent = currentQuantity + 1;
//         const newQuantity = currentQuantity + 1;
//         updateTotalPrice(index, newQuantity);
//         try {
//             editCartReq(index, newQuantity).then(() => {
//                 updateSubtotal();
//             }).catch((error) => {
//                 console.log('err in cart js ', error);
//             });
//         } catch (error) {
//             console.log('err in cart js ', error);
//         }
//     }
// }

// function decrementQuantity(index) {
//     let quantityElement = document.getElementById('quantity' + index);
//     let currentQuantity = parseInt(quantityElement.textContent);
//     if (currentQuantity > 1) {
//         const newQuantity = currentQuantity - 1;
//         quantityElement.textContent = newQuantity;
//         updateTotalPrice(index, newQuantity);
//         try {
//             editCartReq(index, newQuantity).then(() => {
//                 updateSubtotal();
//             }).catch((error) => {
//                 console.log('err in cart js ', error);
//             });
//         } catch (error) {
//             console.log('err in cart js ', error);
//         }
//     }
// }








// function updateTotalPrice(index, newQuantity) {
//     let totalPriceElement = document.getElementById('totalQuantityPrice' + index);
//     let pricePerUnitElement = document.getElementById('pricePerUnit' + index);
//     let pricePerUnitValue = parseFloat(pricePerUnitElement.dataset.pricePerUnit);
//     totalPriceElement.textContent = 'RS ' + (pricePerUnitValue * newQuantity).toFixed(2);
// }


// function updateSubtotal() {


//     let subTotal = 0;
//     let qPriceElements = document.querySelectorAll('.qPrice');

//     qPriceElements.forEach(element => {
//         subTotal += parseFloat(element.textContent.replace('RS ', ''));
//     });

//     let cartTotalElement = document.querySelector('.cartTotal');
//     cartTotalElement.textContent = 'RS ' + subTotal.toFixed(2);
// }

// document.addEventListener('DOMContentLoaded', function () {
//     var quantityElement = document.getElementById('quantity' + index);
//     var currentQuantity = parseInt(quantityElement.textContent);
//     currentStock = parseInt(currentStock);
//    if (currentQuantity > currentStock) {
//     currentQuantity = currentStock
//    }
//     updateSubtotal();
// });

async function editCartReq(index, newQuantity) {
    const variantId = document.getElementById('variantId' + index).value;
    const response = await fetch('/editCart', {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            variantId,
            newQuantity
        })
    });
    const data = await response.json();
    if (!response.ok) {
        const Toast = Swal.mixin({
            toast: true,
            position: 'bottom',
            iconColor: 'white',
            customClass: {
                popup: 'colored-toast',
            },
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
        });

        Toast.fire({
            icon: 'error',
            title: data.message
        });
        return false;
    }
}

function incrementQuantity(index, currentStock) {
    var quantityElement = document.getElementById('quantity' + index);
    var currentQuantity = parseInt(quantityElement.textContent);
    currentStock = parseInt(currentStock);
    let incrementBtn = document.getElementById('incrementBtn' + index);

    if (currentQuantity >= 5) {
        quantityElement.textContent = 5;

        const Toast = Swal.mixin({
            toast: true,
            position: 'bottom',
            iconColor: 'white',
            customClass: {
                popup: 'colored-toast',
            },
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
        });

        Toast.fire({
            icon: 'error',
            title: `Purchasing limit reached`
        });
    } else if (currentQuantity >= currentStock) {
        quantityElement.textContent = currentStock;

        const Toast = Swal.mixin({
            toast: true,
            position: 'bottom',
            iconColor: 'white',
            customClass: {
                popup: 'colored-toast',
            },
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
        });

        Toast.fire({
            icon: 'error',
            title: `We're sorry, only ${currentStock} left in stock.`
        });

    } else {
        quantityElement.textContent = currentQuantity + 1;
        updateTotalPrice(index, currentQuantity + 1);
        const newQuantity = quantityElement.textContent;
        try {
            editCartReq(index, newQuantity);
            updateSubtotal();
        } catch (error) {
            console.log('err in cart js ', error);
        }
    }
}

function decrementQuantity(index) {
    let quantityElement = document.getElementById('quantity' + index);
    let currentQuantity = parseInt(quantityElement.textContent);
    if (currentQuantity > 1) {
        quantityElement.textContent = currentQuantity - 1;
        let newQuantity = quantityElement.textContent;
        updateTotalPrice(index, currentQuantity - 1);
        editCartReq(index, newQuantity);
        updateSubtotal(); // Update subtotal after decrement
    }
}

function updateTotalPrice(index, newQuantity) {
    let totalPriceElement = document.getElementById('totalQuantityPrice' + index);
    let pricePerUnitElement = document.getElementById('pricePerUnit' + index);
    let pricePerUnitValue = parseFloat(pricePerUnitElement.dataset.pricePerUnit);
    totalPriceElement.textContent = 'RS ' + (pricePerUnitValue * newQuantity).toFixed(2);
}

function updateSubtotal() {
    let subTotal = 0;
    let qPriceElements = document.querySelectorAll('.qPrice');

    qPriceElements.forEach(element => {
        subTotal += parseFloat(element.textContent.replace('RS ', ''));
    });

    let cartTotalElement = document.querySelector('.cartTotal');
    cartTotalElement.textContent = 'RS ' + subTotal.toFixed(2);
}

function checkAndAdjustQuantities() {
  
    const cartItems = document.querySelectorAll('.table_row');
    cartItems.forEach((item, index) => {
 
        const quantityElement = document.getElementById('quantity' + index);
        const currentStock = parseInt(document.getElementById('currentStock' + index).value);
        let currentQuantity = parseInt(quantityElement.textContent);

        if (currentQuantity > currentStock) {
        
            let variantName = document.getElementById('variantName'+index).value
            quantityElement.textContent = currentStock;
            updateTotalPrice(index, currentStock);
            editCartReq(index, currentStock).then(() => {
                const Toast = Swal.mixin({
                    toast: true,
                    position: 'bottom',
                    iconColor: 'white',
                    customClass: {
                        popup: 'colored-toast',
                    },
                    showConfirmButton: false,
                    timer: 3000,
                    timerProgressBar: true,
                });

                Toast.fire({
                    icon: 'info',
                    title: `Quantity adjusted of the product ${variantName} to available stock: ${currentStock}}`
                });
            });
        }
    });
    updateSubtotal(); // Ensure subtotal is updated after adjustments
}

document.addEventListener('DOMContentLoaded', checkAndAdjustQuantities);


async function deleteCartItem(index, variantId, selectedSize) {
    const confirmMessage = 'Are you sure you want to delete this item from cart ?';
  
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
        const response = await fetch('/deleteCartItem', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            variantId: variantId,
            selectedSize: selectedSize
          })
        });

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new TypeError("Response is not JSON");
        }
  
        const data = await response.json();
  
        if (response.ok) {
          Swal.fire({
            title: 'Success',
            text: data.message,
            icon: 'success'
          }).then(()=>{
            window.location.reload()
          })
          
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
          text: error.message,
          icon: 'error'
        });
      }
    }
  }