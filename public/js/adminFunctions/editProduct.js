const errorDiv = document.getElementById('messageContainer');
const showError = (msg) => {
    errorDiv.style.display = 'block'
    errorDiv.innerText = msg
}
document
    .getElementById('editProductForm')
    .addEventListener('submit', async function (event) {
        event.preventDefault();
        const productName = document.getElementById('productName').value.trim();
        const productCategory = document.getElementById('productCategory').value.trim();
        const productBrand = document.getElementById('productBrand').value.trim();
        const productDescription = document.getElementById('productDescription').value.trim();
        const productId = document.getElementById('productId').value.trim();
        const namePattern = /^(?=.*[A-Za-z0-9])[A-Za-z0-9 ]{3,}$/;
        const brandPattern = /^(?=.*[A-Za-z0-9])[A-Za-z0-9 &-]{2,}$/;
        const descriptionPattern = /^.{8,}$/;


        if (!productName || !productCategory || !productBrand || !productDescription) {
            showError('All fields are required')
            return
        }

        if (!namePattern.test(productName)) {
            showError('Product name can only contain letters, numbers, spaces, &, - and minimum of 3 char.')
            return;
        }
        if (!brandPattern.test(productBrand)) {
            showError('Brand name can only contain letters, numbers, spaces, &, - and minimum of 2 char.');
            return;
        }
        if (!descriptionPattern.test(productDescription)) {
            showError('Product description must be at least 8 characters long');
            return;
        }

        try {
            const response = await fetch('/admin/product/edit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    id: productId,
                    productName,
                    productCategory,
                    productBrand,
                    productDescription
                })
            });

            const result = await response.json();

            if (!response.ok) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: result.message
                });
                return;
            }

            Swal.fire({
                icon: 'success',
                title: 'Success',
                text: result.message,
                confirmButtonText: 'OK'
            }).then(() => {
                window.location.href = result.redirect
            });
        } catch (error) {
            console.error('Error submitting form:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'An error occurred while adding the product.'
            });
        }
    });