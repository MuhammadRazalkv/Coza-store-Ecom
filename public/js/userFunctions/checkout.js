

let grandTotalInitial;
document.addEventListener('DOMContentLoaded',function(){
    grandTotalInitial  = document.getElementById('grandTotalTD').textContent
    const subTotal = document.getElementById('cartSubTotal').textContent
    
    if (subTotal > 1000) {
        document.getElementById('COD').style.display = 'none'
    }

})



let verifiedCouponCode = null
// apply coupon
document.getElementById('button-addon2').addEventListener('click',async function (e){
    let errMsgC =  document.getElementById('errCoupon') 
    const couponCode = document.getElementById('c_code').value.trim();
    const cartSubTotal = document.getElementById('cartSubTotal').textContent;
    const couponDiscountTd = document.getElementById('couponDiscountTd')  
    const grandTotal = document.getElementById('grandTotalTD').textContent
    const grandTotalTD = document.getElementById('grandTotalTD')

    if (verifiedCouponCode !== null) {
        errMsgC.innerText = 'Coupon already applied '
        errMsgC.style.display = 'block'
        return
    }

  
    if (couponCode == '' || !couponCode) {
        errMsgC.style.display = 'block'
        return
    }else if(couponCode.length <5 ){
        errMsgC.innerText = 'Coupon must be at least 5 characters'
        errMsgC.style.display = 'block'
        return
    }else{
        errMsgC.style.display = 'none'
         try {
           

            const response =  await fetch('/applyCoupon',{
                method:'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body:JSON.stringify({
                    couponCode,
                    cartSubTotal
                    
                })
               })
    
               const data = await response.json()
               
               if (!response.ok) {
                
                Swal.fire({
                    icon: "error",
                    title: "Oops...",
                    text: data.message,
                })
    
               }else{
                
                const Toast = Swal.mixin({
                    toast: true,
                    position: 'bottom',
                    iconColor: 'white',
                    customClass: {
                      popup: 'colored-toast'
                    },
                    showConfirmButton: false,
                    timer: 1500,
                    timerProgressBar: true
                  })
                   Toast.fire({
                    icon: 'success',
                    title: 'Coupon applied successfully',
                  })
            
                // .then(()=>{
                    verifiedCouponCode = couponCode
                    couponDiscountTd.innerText = data.couponDiscount
                    grandTotalTD.innerText = grandTotal - data.couponDiscount
                    document.getElementById('button-addon2').style.display = 'none'
                    document.getElementById('button-removeC').style.display = 'block'
                //   })
               }
            
            
        } catch (error) {
            console.log('err in  apply coupon js ',error);
            Swal.fire({
                icon:"error",
                title:"oops...",
                text:'Internal server error js'
            })
        }
            
       
    }
})


// remove coupon 
document.getElementById('button-removeC').addEventListener('click',async (req,res)=>{

    let errMsgC =  document.getElementById('errCoupon') 
    const couponCode = document.getElementById('c_code')
    // const cartSubTotal = document.getElementById('cartSubTotal').textContent;
    const couponDiscountTd = document.getElementById('couponDiscountTd')  
    // const grandTotal = document.getElementById('grandTotalTD').textContent
    const grandTotalTD = document.getElementById('grandTotalTD')

    // verifiedCouponCode = couponCode
    couponDiscountTd.innerText = '---'
    couponCode.value =''
    grandTotalTD.innerText = grandTotalInitial
    verifiedCouponCode = null
    document.getElementById('button-addon2').style.display = 'block'
    document.getElementById('button-removeC').style.display = 'none'

})



let selectedOption = null
 
function selectPaymentOption(optionId) {
    // console.log('Selected option ID:', optionId);
    const element = document.getElementById(optionId);
    // console.log('Element:', element);
    
    if (selectedOption) {
        document.getElementById(selectedOption).classList.remove('selected');
    }

    if (element) {
        element.classList.add('selected');
        selectedOption = optionId;
    } else {
        console.error(`Element with ID '${optionId}' not found.`);
    }
}

let addressId;
// place order
async function submitForm() {
    const subTotal = document.getElementById('cartSubTotal').textContent
    
    if (subTotal > 1000) {
        document.getElementById('COD').style.display = 'none'
    }


    const selectedAddress = document.querySelector('input[name="selectedAddress"]:checked');
    if (selectedAddress) {
         addressId = selectedAddress.value;
        // console.log('Selected Address ID:', addressId);
  
    } else {
        Swal.fire({
            icon: "error",
            title: "Oops...",
            text: "Please select a address",
        });
    }
    
    if(selectedOption == null){
        Swal.fire({
            icon: "error",
            title: "Oops...",
            text: "Please select a Payment method ",
        });
    }
   

    if (selectedOption == 'COD') {
   parseInt(subTotal)

        if ( subTotal > 1000) {
            const Toast = Swal.mixin({
                toast: true,
                position: 'bottom',
                iconColor: 'white',
                customClass: {
                  popup: 'colored-toast'
                },
                showConfirmButton: false,
                timer: 1500,
                timerProgressBar: true
              })
               Toast.fire({
                icon: 'error',
                title: 'Order above 1000 is not eligible for COD',
              })
              return 
        }


        try {
            verifiedCouponCode
           const response =  await fetch('/placeOrder',{
               method:'POST',
               headers: {
                   'Content-Type': 'application/json'
               },
               body:JSON.stringify({
                   selectedOption,
                   addressId,
                   appliedCoupon:verifiedCouponCode
               })
              })
   
              const data = await response.json()
              console.log('data cod',data);
              if (!response.ok) {
               Swal.fire({
                   icon: "error",
                   title: "Oops...",
                   text: data.message,
               }).then((result) => {
                   if (result.isConfirmed && data.redirectUrl) {
                       window.location.href = data.redirectUrl;
                   }
               });
   
              }else{
               Swal.fire({
                   title: "Success !",
                   text: data.message,
                   icon: "success"
                  }).then(()=>{
                    return window.location.href=`/orderTracking/?orderId=${data.orderId}`
                })
              }
           
           
       } catch (error) {
           console.log('err in placing order ',error);
           Swal.fire({
               icon:"error",
               title:"oops...",
               text:'Internal server error js'
           })
       }
    }else if(selectedOption == 'Online-Payment'){
        try {
          
            verifiedCouponCode
            const response =  await fetch('/placeOrder',{
                method:'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body:JSON.stringify({
                    selectedOption,
                    addressId,
                    appliedCoupon:verifiedCouponCode
                })
               })
    
               const data = await response.json()
            //    console.log('online first data',data);

            if (response.ok) {
                console.log('in the function after first data ');
                const {order,placedOrder,KEY} = data
                // console.log('order',order);
                // console.log('po',placedOrder);
                let  options = {
                    key:KEY, // Enter the Key ID generated from the Dashboard
                    amount: order.amount, // Amount is in currency subunits. Default currency is INR. Hence, 50000 refers to 50000 paise
                    currency: "INR",
                    name: "COZASOTRE",
                    // "description": "Test Transaction",
                    // "image": "https://example.com/your_logo",
                    order_id:order.id,
                     //This is a sample Order ID. Pass the `id` obtained in the response of Step 1
                     handler: async function (response) {
                                       
                        const paymentData={
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            order_id: placedOrder._id
                        };

                        const res = await fetch('/verify-payment',{
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            method:"POST",
                            body:JSON.stringify(paymentData)
                        })
                        const data = await res.json()

                        if (res.ok) {
                            Swal.fire({
                                title: "Success !",
                                text: data.message,
                                icon: "success"
                              }) .then(()=>{
                                return window.location.href=`/orderTracking/?orderId=${data.order_id}`
                            })
                        }else {
                            Swal.fire({
                                icon:"error",
                                title:"oops...",
                                text:data.message
                            })
                            
                        }

  


                    },
                    "prefill": {
                        "name": placedOrder.shippingAddress.name,
                        "email": "gaurav.kumar@example.com",
                        "contact": placedOrder.shippingAddress.altPhone
                    },
                    // "notes": {
                    //     "address": "Razorpay Corporate Office"
                    // },
                    "theme": {
                        "color": "#3399cc"
                    },
                    modal: {
                        ondismiss: function () {
                            Swal.fire({
                            text: "Payment failed or was dismissed. Please try again.",
                            icon: "error"
                                }).then(()=>{
                                    return window.location.href='/orders'
                                })
                        }
                    } 
                };
                const rzp1=new Razorpay(options);
                rzp1.open();




            }

        } catch (error) {
            console.log('err in place order online js',error);
            Swal.fire({
                icon:"error",
                title:"oops...",
                text:'Internal server error js'
            })
        }



    }else{
        Swal.fire({
            icon:"error",
            title:"oops...",
            text:'Payment method not found'
        })
        
    }




}


const showCouponsBtn = document.getElementById('showCouponsBtn');
const closeModalBtn = document.getElementById('closeModalBtn');
const modalCloseBtn = document.getElementById('modalCloseBtn');
const couponListModal = document.getElementById('couponListModal');

const openModal = () => {
    couponListModal.classList.add('show');
    couponListModal.style.display = 'block';
    couponListModal.removeAttribute('aria-hidden');
    couponListModal.setAttribute('aria-modal', 'true');
    document.body.classList.add('modal-open');
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop fade show';
    backdrop.id = 'modalBackdrop';
    document.body.appendChild(backdrop);
};

const closeModal = () => {
    couponListModal.classList.remove('show');
    couponListModal.style.display = 'none';
    couponListModal.setAttribute('aria-hidden', 'true');
    couponListModal.removeAttribute('aria-modal');
    document.body.classList.remove('modal-open');
    const backdrop = document.getElementById('modalBackdrop');
    if (backdrop) {
        document.body.removeChild(backdrop);
    }
};

showCouponsBtn.addEventListener('click', openModal);
closeModalBtn.addEventListener('click', closeModal);
modalCloseBtn.addEventListener('click', closeModal);

window.addEventListener('click', (event) => {
    if (event.target === couponListModal) {
        closeModal();
    }
});


function copyText(index) {
    var couponCode = document.getElementById("code" + index).textContent;

    // Create a temporary textarea element
    var textarea = document.createElement('textarea');
    textarea.value = couponCode;

    // Append the textarea to the body
    document.body.appendChild(textarea);

    // Select the text inside the textarea
    textarea.select();
    textarea.setSelectionRange(0, 99999); // For mobile devices

    // Copy the selected text
    document.execCommand('copy');

    // Remove the textarea from the DOM
    document.body.removeChild(textarea);

    // Alert the user
    // alert("Copied the code: " + couponCode + " to clipboard!");
    const Toast = Swal.mixin({
        toast: true,
        position: 'bottom',
        iconColor: 'white',
        customClass: {
          popup: 'colored-toast'
        },
        showConfirmButton: false,
        timer: 1500,
        timerProgressBar: true
      })
       Toast.fire({
        icon: 'success',
        title: 'Coupon code copied to  clipboard',
      })
}

// document.getElementById('differentAddress').addEventListener('click',async function (){
//     const addressModal =  document.getElementById('addressModal')
//     addressModal.display = 'block'
// })

const form = document.getElementById('addressForm');

form.addEventListener('submit', async function(event) {
  event.preventDefault();
  event.stopPropagation();

  // Reset validation messages
  form.querySelectorAll('.invalid-feedback').forEach(feedback => {
    feedback.style.display = 'none';
  });

  if (form.checkValidity() === false) {
    form.classList.add('was-validated');
  } else {
    const userName = document.getElementById('firstname').value;
    const userLocality = document.getElementById('locality').value;
    const userAltPhone = document.getElementById('userphone').value;
    const userAddress = document.getElementById('useraddress').value;
    const userLandmark = document.getElementById('userLandmark').value;
    const userCity = document.getElementById('userCity').value;
    const userState = document.getElementById('userState').value;
    const userPIN = document.getElementById('userPIN').value;
    const addressType = document.getElementById('addressType').value;

    await fetch(`/myAccount/save-address`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userName,
        userLocality,
        userAltPhone,
        userAddress,
        userLandmark,
        userCity,
        userState,
        userPIN,
        addressType
      })
    })
    .then(response => response.json())
    .then(result => {
      if (result.success) {
        Swal.fire({
          title: 'Success!',
          text: result.message,
          icon: 'success'
        }).then(() => {
          $(`#addressModal`).modal('hide'); // Close the modal
           window.location.reload(); 
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Oops...',
          text: result.message
        });
      }
    })
    .catch(error => {
      console.error('Error:', error);
    });
  }
});

// Validate inputs on change in the address form
form.addEventListener('input', function(event) {
  if (event.target.checkValidity()) {
    event.target.classList.remove('is-invalid');
  } else {
    event.target.classList.add('is-invalid');
  }
});
