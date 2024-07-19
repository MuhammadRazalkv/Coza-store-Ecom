// document.addEventListener('DOMContentLoaded', function() {



// const initialFormState = {
//   name: document.getElementById('firname').value,
//   phone: document.getElementById('telephone').value
// }
// // Validate phone number on input
// document.getElementById('telephone').addEventListener('input', function () {
//   const phoneInput = this
//   const phoneValue = phoneInput.value
//   const invalidFeedback = phoneInput.nextElementSibling
//   const validFeedback = invalidFeedback.nextElementSibling

//   // Check if the phone number is exactly 10 digits
//   if (!/^\d{10}$/.test(phoneValue)) {
//     invalidFeedback.style.display = 'block'
//     validFeedback.style.display = 'none'
//   } else {
//     invalidFeedback.style.display = 'none'
//     validFeedback.style.display = 'block'
//   }
// })

// // Validate name on input
// document.getElementById('firname').addEventListener('input', function () {
//   const nameInput = this
//   const nameValue = nameInput.value
//   const invalidFeedback = document.getElementById('invalidName')
//   const validFeedback = document.getElementById('validName')

//   // Check if the name is at least 3 characters long and contains only letters and spaces
//   if (!/^[a-zA-Z\s]{3,}$/.test(nameValue)) {
//     invalidFeedback.style.display = 'block'
//     validFeedback.style.display = 'none'
//   } else {
//     invalidFeedback.style.display = 'none'
//     validFeedback.style.display = 'block'
//   }
// })

// // Validate form on submit
// document
//   .getElementById('updateProfile')
//   .addEventListener('submit', async function (event) {
//     event.preventDefault()
//     const nameInput = document.getElementById('firname')
//     const nameValue = nameInput.value

//     const invalidNameFeedback = document.getElementById('invalidName')
//     const validNameFeedback = document.getElementById('validName')

//     const phoneInput = document.getElementById('telephone')
//     const phoneValue = phoneInput.value

//     const invalidFeedback = phoneInput.nextElementSibling
//     const validFeedback = invalidFeedback.nextElementSibling

//     let isValid = true

//     // Validate name
//     if (!/^[a-zA-Z\s]{3,}$/.test(nameValue)) {
//       isValid = false
//       invalidNameFeedback.style.display = 'block'
//       validNameFeedback.style.display = 'none'
//     } else {
//       invalidNameFeedback.style.display = 'none'
//       validNameFeedback.style.display = 'block'
//     }

//     // Validate phone number
//     if (!/^\d{10}$/.test(phoneValue)) {
//       isValid = false
//       invalidFeedback.style.display = 'block'
//       validFeedback.style.display = 'none'
//     } else {
//       invalidFeedback.style.display = 'none'
//       validFeedback.style.display = 'block'
//     }

//     if (isValid) {
//       if (
//         initialFormState.name === nameValue &&
//         initialFormState.phone === phoneValue
//       ) {
//         // Handle error response
//         Swal.fire({
//           icon: 'error',
//           title: 'Oops...',
//           text: 'No changes detected'
//         })
//         return
//       }
//       const id = document.getElementById('userId').value

//       // Send a PATCH request to update profile
//       try {
//         const response = await fetch(`/myAccount/editProfile/${id}`, {
//           method: 'PATCH',
//           headers: {
//             'Content-Type': 'application/json'
//           },
//           body: JSON.stringify({
//             name: nameValue,
//             phone: phoneValue
//           })
//         })

//         const result = await response.json()

//         if (response.ok) {
//           // Handle successful response
//           Swal.fire({
//             title: 'Success!',
//             text: result.message,
//             icon: 'success'
//           }).then(result => {
//             if (result.isConfirmed) {
//               window.location.href = '/myAccount' // Redirect on successful response
//             }
//           })
//         } else {
//           // Handle error response
//           Swal.fire({
//             icon: 'error',
//             title: 'Oops...',
//             text: result.message
//           })
//         }
//       } catch (error) {
//         console.error('Error:', error)
//         alert('An error occurred while updating profile')
//       }
//     }
//   })

// // Address Management

// const form = document.getElementById('addressForm')
// const id = document.getElementById('userId').value
// form.addEventListener('submit', async function (event) {
//   event.preventDefault()
//   event.stopPropagation()

//   // Reset validation messages
//   form.querySelectorAll('.invalid-feedback').forEach(feedback => {
//     feedback.style.display = 'none'
//   })

//   if (form.checkValidity() === false) {
//     form.classList.add('was-validated')
//   } else {
//     const userName = document.getElementById('firstname').value
//     const userLocality = document.getElementById('locality').value
//     const userAltPhone = document.getElementById('userphone').value
//     const userAddress = document.getElementById('useraddress').value
//     const userLandmark = document.getElementById('userLandmark').value
//     const userCity = document.getElementById('userCity').value
//     const userState = document.getElementById('userState').value
//     const userPIN = document.getElementById('userPIN').value
//     const addressType = document.getElementById('addressType').value

//     await fetch(`/myAccount/save-address/${id}`, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json'
//       },
//       body: JSON.stringify({
//         userName,
//         userLocality,
//         userAltPhone,
//         userAddress,
//         userLandmark,
//         userCity,
//         userState,
//         userPIN,
//         addressType
//       })
//     })
//       .then(response => response.json())
//       .then(result => {
//         if (result.success) {
//           Swal.fire({
//             title: 'Success!',
//             text: result.message,
//             icon: 'success'
//           }).then(() => {
//             console.log('Modal should close now')
//             $('#addressModal').modal('hide')
//           })
//         } else {
//           Swal.fire({
//             icon: 'error',
//             title: 'Oops...',
//             text: result.message
//           })
//         }
//       })
//       .catch(error => {
//         console.error('Error:', error)
//       })
//   }
// })

// form.addEventListener('input', function (event) {
//   if (event.target.checkValidity()) {
//     event.target.classList.remove('is-invalid')
//   } else {
//     event.target.classList.add('is-invalid')
//   }
// })



// const deleteAddress = document.querySelector('.deleteAddressForm');

// deleteAddress.addEventListener('submit', async event => {
//   event.preventDefault()
//   const id = document.querySelector('.userID').value
//   const addressId = document.querySelector('.addressID').value

//   const confirmMessage = 'Are sure you want to delete this address ?'

//   const result = await Swal.fire({
//     title: confirmMessage,
//     icon: 'warning',
//     showCancelButton: true,
//     confirmButtonColor: '#3085d6',
//     cancelButtonColor: '#d33',
//     confirmButtonText: 'Yes'
//   })

//   if (result.isConfirmed) {
//     try {
//       const response =  await fetch(`/deleteAddress/${id}/${addressId}`, {
//         method: 'PATCH',
//         headers: {
//           'Content-Type': 'application/json'
//         }
//       })
      

//       if (response.ok) {
//         Swal.fire({
//           title: 'Success',
//           text: response.message,
//           icon: 'success'
//         })
//     }else{
//         Swal.fire({
//             title: 'Error',
//             text: response.message,
//             icon: 'error'
//           });
//     } 

//     } catch (error) {
//         Swal.fire({
//             title: 'Error',
//             text: error.message,
//             icon: 'error'
//           });
//     }
//   }
// })


// })

document.addEventListener('DOMContentLoaded', function() {

    // Initial form state for profile update
    const initialFormState = {
      name: document.getElementById('firname').value,
      phone: document.getElementById('telephone').value
    };
  
    // Validate phone number on input
    document.getElementById('telephone').addEventListener('input', function() {
      const phoneInput = this;
      const phoneValue = phoneInput.value;
      const invalidFeedback = phoneInput.nextElementSibling;
      const validFeedback = invalidFeedback.nextElementSibling;
  
      // Check if the phone number is exactly 10 digits
      if (!/^\d{10}$/.test(phoneValue)) {
        invalidFeedback.style.display = 'block';
        validFeedback.style.display = 'none';
      } else {
        invalidFeedback.style.display = 'none';
        validFeedback.style.display = 'block';
      }
    });
  
    // Validate name on input
    document.getElementById('firname').addEventListener('input', function() {
      const nameInput = this;
      const nameValue = nameInput.value;
      const invalidFeedback = document.getElementById('invalidName');
      const validFeedback = document.getElementById('validName');
  
      // Check if the name is at least 3 characters long and contains only letters and spaces
      if (!/^[a-zA-Z\s]{3,}$/.test(nameValue)) {
        invalidFeedback.style.display = 'block';
        validFeedback.style.display = 'none';
      } else {
        invalidFeedback.style.display = 'none';
        validFeedback.style.display = 'block';
      }
    });
  
    // Validate form on submit for profile update
    
    document.getElementById('updateProfile').addEventListener('submit', async function(event) {
      event.preventDefault();
      const nameInput = document.getElementById('firname');
      const nameValue = nameInput.value;
  
      const invalidNameFeedback = document.getElementById('invalidName');
      const validNameFeedback = document.getElementById('validName');
  
      const phoneInput = document.getElementById('telephone');
      const phoneValue = phoneInput.value;
  
      const invalidFeedback = phoneInput.nextElementSibling;
      const validFeedback = invalidFeedback.nextElementSibling;
  
      let isValid = true;
  
      // Validate name
      if (!/^[a-zA-Z\s]{3,}$/.test(nameValue)) {
        isValid = false;
        invalidNameFeedback.style.display = 'block';
        validNameFeedback.style.display = 'none';
      } else {
        invalidNameFeedback.style.display = 'none';
        validNameFeedback.style.display = 'block';
      }
  
      // Validate phone number
      if (!/^\d{10}$/.test(phoneValue)) {
        isValid = false;
        invalidFeedback.style.display = 'block';
        validFeedback.style.display = 'none';
      } else {
        invalidFeedback.style.display = 'none';
        validFeedback.style.display = 'block';
      }
  
      if (isValid) {
        if (initialFormState.name === nameValue && initialFormState.phone === phoneValue) {
          // Handle error response if no changes detected
          Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'No changes detected'
          });
          return;
        }
        const id = document.getElementById('userId').value;
  
        // Send a PATCH request to update profile
        try {
          const response = await fetch(`/myAccount/editProfile/${id}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              name: nameValue,
              phone: phoneValue
            })
          });
  
          const result = await response.json();
  
          if (response.ok) {
            // Handle successful response
            Swal.fire({
              title: 'Success!',
              text: result.message,
              icon: 'success'
            }).then(result => {
              if (result.isConfirmed) {
                window.location.href = '/myAccount'; // Redirect on successful response
              }
              
            });
          } else {
            // Handle error response
            Swal.fire({
              icon: 'error',
              title: 'Oops...',
              text: result.message
            });
          }
        } catch (error) {
          console.error('Error:', error);
          alert('An error occurred while updating profile');
        }
      }
    });
  


    // Address Management
  
    // Validate form on submit for adding new address

    const form = document.getElementById('addressForm');
    // const id = document.getElementById('userId').value;
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
  


    // Handle address deletion
    const deleteForms = document.querySelectorAll('.deleteAddressForm');
    deleteForms.forEach(form => {
      form.addEventListener('submit', async function(event) {
        event.preventDefault();
        const id = form.querySelector('.userID').value;
        const addressId = form.querySelector('.addressID').value;
  
        const confirmMessage = 'Are you sure you want to delete this address?';
  
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
            const response = await fetch(`/deleteAddress/${id}/${addressId}`, {
              method: 'DELETE',
              headers: {
                'Content-Type': 'application/json'
              }
            });
  
            const data = await response.json();
  
            if (response.ok) {
              Swal.fire({
                title: 'Success',
                text: data.message,
                icon: 'success'
              });
              form.closest('.col-md-6').remove(); // Remove the address element from the DOM
            } else {
              Swal.fire({
                title: 'Error',
                text: data.message,
                icon: 'error'
              });
            }
  
          } catch (error) {
            console.error('Error:', error);
            Swal.fire({
              title: 'Error',
              text: error.message,
              icon: 'error'
            });
          }
        }
      });
    });

  // Edit address 
  const editForms = document.querySelectorAll('form[id^="editAddressForm"]');

  editForms.forEach(form => {
      form.addEventListener('submit', async function(event) {
          event.preventDefault();
          event.stopPropagation();
  
          const index = form.id.replace('editAddressForm', '');
          const addressId = document.getElementById(`addressID${index}`).value;
          const userID = document.getElementById(`userID${index}`).value;
  
          const userName = document.getElementById(`editedName${index}`).value.trim();
          const userLocality = document.getElementById(`editLocality${index}`).value.trim();
          const userAltPhone = document.getElementById(`editUserphone${index}`).value.trim();
          const userAddress = document.getElementById(`editUseraddress${index}`).value.trim();
          const userLandmark = document.getElementById(`editUserLandmark${index}`).value.trim();
          const userCity = document.getElementById(`editUserCity${index}`).value.trim();
          const userState = document.getElementById(`editUserState${index}`).value.trim();
          const userPIN = document.getElementById(`editUserPIN${index}`).value.trim();
          const addressType = document.getElementById(`addressType${index}`).value.trim();
  
          try {
              const response = await fetch(`/edit-Address/${userID}/${addressId}`, {
                  method: 'PATCH',
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
              });
  
              if (!response.ok) {
                  const errorData = await response.text(); // Read the response as text
                  throw new Error(errorData);
              }
  
              const data = await response.json();
  
              Swal.fire({
                title: 'Success!',
                text: data.message,
                icon: 'success'
            }).then(() => {
                $(`#editAddressModal${index}`).modal('hide'); // Close the modal
                window.location.reload(); // Reload the page
            });

          } catch (error) {
              let errorMessage = 'An unexpected error occurred';
              try {
                  const errorData = JSON.parse(error.message);
                  errorMessage = errorData.message || errorMessage;
              } catch (parseError) {
                  console.error('Failed to parse error message:', error.message);
              }
  
              Swal.fire({
                  icon: 'error',
                  title: 'Oops...',
                  text: errorMessage
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
  });
  



// Change password 


document.querySelectorAll('.toggle-password').forEach(item => {
  item.addEventListener('click', function () {
      const passwordInput = this.previousElementSibling;
      const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
      passwordInput.setAttribute('type', type);
      this.textContent = type === 'password' ? 'Show' : 'Hide';
  });
});

document.getElementById('changePassword').addEventListener('submit',async (event)=>{
  event.preventDefault()
  const userId = document.getElementById('USERID').value
  const password = document.getElementById('currentpass').value.trim()
  const newPassword = document.getElementById('pass').value.trim()
  const rePassword = document.getElementById('repass').value.trim()
  const currentPass = document.getElementById('currentpass').value
  const invalidPass = document.getElementById('invalidPass');
  const validPass = document.getElementById('validPass');
  const invalidRePass = document.getElementById('invalidRePass');
  const validRePass = document.getElementById('validRePass');
  const invalidCurrPass = document.getElementById('invalidCurrPass')
  const passPattern = /^[a-zA-Z0-9]{4,}$/;

  let checked = true;

  invalidPass.style.display = 'none';
  validPass.style.display = 'none';
  invalidRePass.style.display = 'none';
  validRePass.style.display = 'none';
  
   if (currentPass === "") {
     invalidCurrPass.style.display = 'block'
     checked = false
   }else{
    invalidCurrPass.style.display = 'none'
   }


   
  // Check for empty values
  if (newPassword === "" || rePassword === "") {
    invalidPass.innerText = 'Fields cannot be empty.';
    invalidPass.style.display = 'block';
    validPass.style.display = 'none';
    invalidRePass.style.display = 'block';
    validRePass.style.display = 'none';
    checked = false;
  }

  // Password pattern validation
  if (!passPattern.test(newPassword)) {
    invalidPass.innerText = 'Password must be at least 4 characters long and contain only letters and numbers.';
    invalidPass.style.display = 'block';
    validPass.style.display = 'none';
    checked = false;
  } else {
    invalidPass.style.display = 'none';
    validPass.style.display = 'block';
  }

  // Re-entered password pattern validation
  if (!passPattern.test(rePassword)) {
    invalidRePass.innerText = 'Password must be at least 4 characters long and contain only letters and numbers.';
    invalidRePass.style.display = 'block';
    validRePass.style.display = 'none';
    checked = false;
  } else {
    invalidRePass.style.display = 'none';
    validRePass.style.display = 'block';
  }

  // Password match validation
  if (newPassword !== rePassword) {
    invalidRePass.innerText = 'Passwords do not match.';
    invalidRePass.style.display = 'block';
    validRePass.style.display = 'none';
    checked = false;
  } else {
    invalidRePass.style.display = 'none';
  //  validRePass.style.display = 'block';
  }

  if (checked) {
    
//  console.log('Password validation success ');
  const confirmMessage = 'Are you sure you want to change your PASSWORD ? ' 
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
    const response =  await fetch( `/change-password/${userId}`,{
      method:'PATCH',
      headers:{
        'Content-Type': 'application/json'
      },
      body:JSON.stringify({
        password,newPassword,rePassword
      })
  
    })
    const data = await response.json()
    if (response.ok) {
      Swal.fire({
        title: 'Success!',
        text: data.message,
        icon: 'success'
      }).then(()=>{
       window.location.reload()
      })
    }else{
      Swal.fire({
        title:'Failed !',
        text:data.message,
        icon:'error'
      })
    }
    
  } catch (error) {
    console.log('err in change password js',error);
    Swal.fire({
      title:'error',
      icon:'error',
      text:'unexpected error occurred in change pass js catch '
    })
  }
   


}
}
})


});    