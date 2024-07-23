

async function cancelOrderItem(orderId,variantObjectId){
    
    if (!orderId || !variantObjectId) {
        await Swal.fire({
            title: 'Oops...',
            icon: 'warning',
            text:'Product not found'
          }).then(()=>{
            window.location.reload()
          })
    }





    const confirmMessage = 'Are you sure you want to cancel this item  ?';
  
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
            
            const response = await fetch('/orders/cancelOrder',{
                headers:{
                    'Content-Type':'application/json'
                },
                method:'POST',
                body:JSON.stringify({
                    orderId,
                    variantObjectId
                })
            })
         
            const data = await response.json()

            if (response.ok) {
                Swal.fire({
                    title: "Success",
                    text: data.message ,
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
        
            Swal.fire({
                title:"Oops...",
                icon:"error",
                text:error
            })
        }
    }

}

function viewOrderDetails(orderId) {
  window.location.href = `/orderTracking/?orderId=${orderId}`;
}


// request return 

async function requestReturn(orderId, variantId) {
  const result = await Swal.fire({
    title: 'Are you sure you want to return this product ',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Yes'
  });
if (result.isConfirmed) {
  document.getElementById('orderId').value = orderId;
  document.getElementById('variantId').value = variantId;
  document.getElementById('returnModal').style.display = 'flex';
}
 
}

function closeModal() {
  document.getElementById('returnModal').style.display = 'none';
}

document.getElementById('returnForm').addEventListener('submit', async function (event) {
  event.preventDefault();
  const orderId = document.getElementById('orderId').value;
  const variantId = document.getElementById('variantId').value;
  const returnReason = document.getElementById('returnReason').value;
  
  
  try {
    const response = await fetch('/requestReturn', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ orderId, variantId, returnReason })
    });

    const data = await response.json();
    if (response.ok) {
      Swal.fire({
        title: "Success",
        text: data.message ,
        icon: "success"
      }).then(()=>{
        closeModal()
        window.location.reload()
      })
      
    } else {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: data.message,
       
    });
    }
  } catch (error) {
    console.error('Error in reques return js:', error);
    Swal.fire({
      icon: "error",
      title: "Oops...",
      text: error,
     
  });
  }
});


// function for re payment 

async function rePayment(orderId){

  if (!orderId) {
    await Swal.fire({
        title: 'Oops...',
        icon: 'warning',
        text:'Order not found'
      }).then(()=>{
        window.location.reload()
      })
}





const confirmMessage = 'Are you sure you want to rePay  this order ?';

const result = await Swal.fire({
  title: confirmMessage,
  icon: 'warning',
  showCancelButton: true,
  confirmButtonColor: '#3085d6',
  cancelButtonColor: '#d33',
  confirmButtonText: 'Yes'
});

if (result.isConfirmed) {
  const response = await fetch('/rePayment',{
  
    headers:{
      'Content-Type':'application/json'
  },
  method:'POST',
  body:JSON.stringify({
    orderId:orderId
  })
  })
  
  const data = await response.json()

  if (response.ok) {
   
    const {order,placedOrder,KEY} = data
  
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
                    window.location.reload()
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

  }else{

      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: data.message,
      })
  }



}







}

async function downloadInvoice(orderId) {
  if (!orderId) {
      Swal.fire({
          icon: "error",
          title: "Oops...",
          text: 'Order Id not found'
      }).then(() => {
          window.location.reload();
      });
      return;
  }

  try {
      const response = await fetch(`/downloadInvoice?orderId=${orderId}`, {
          method: 'GET',
          headers: {
              'Content-Type': 'application/json'
          }
      });

   
      if (response.redirected) {
          window.location.href = response.url;
          return;
      }

      const data = await response.json();

      if (!response.ok) {
          Swal.fire({
              icon: "error",
              title: "Oops...",
              text: data.message
          });
        }
      // } else {
       
      //     Swal.fire({
      //         icon: "success",
      //         title: "Success",
      //         text: "Invoice is ready!"
      //     }).then(() => {
      //         window.location.href = response.url;
      //     });
      // }
  } catch (error) {
      console.error('Error fetching the invoice:', error);
      Swal.fire({
          icon: "error",
          title: "Oops...",
          text: 'An error occurred while fetching the invoice'
      });
  }
}



