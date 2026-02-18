function showToast(type, message) {
    const Toast = Swal.mixin({
        toast: true,
        position: "bottom",
        iconColor: "white",
        customClass: { popup: "colored-toast" },
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
    });

    Toast.fire({ icon: type, title: message });
}

document.addEventListener("click", async (e) => {
    const incBtn = e.target.closest(".js-qty-increment");
    const decBtn = e.target.closest(".js-qty-decrement");
    const delBtn = e.target.closest(".js-delete-cart");

    if (!incBtn && !decBtn && !delBtn) return;

    const row = e.target.closest(".table_row");
    const variantId = row.dataset.variantId;
    const stock = Number(row.dataset.stock);
    const price = Number(row.dataset.price);

    const qtyEl = row.querySelector(".js-qty");
    let qty = Number(qtyEl.textContent);
    let ogQty = qty;
    /* DELETE */
    if (delBtn) {
        return deleteCartItem(variantId, row.dataset.size);
    }

    /* DECREMENT */
    if (decBtn) {
        if (qty <= 1) return;
        qty--;
    }

    /* INCREMENT */
    if (incBtn) {
        if (qty >= stock) {
            return showToast("error", `Only ${stock} left in stock`);
        } else if (qty > 5) {
            return showToast("error", `You can purchase a maximum of 5 units of this item.`);
        }
        qty++;
    }

    /* OPTIMISTIC UI */
    qtyEl.textContent = qty;
    row.querySelector(".js-row-total").textContent =
        `₹ ${(price * qty).toLocaleString()}`;

    try {
        await updateCartOnServer(variantId, qty);
        recalcSubtotal();
    } catch (err) {
        qtyEl.textContent = ogQty;
        showToast("error", err.message || "Failed to update cart");
    }
});


async function deleteCartItem(variantId, selectedSize) {
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
                }).then(() => {
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

async function updateCartOnServer(variantId, newQuantity) {
    try {
        const res = await fetch("/editCart", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ variantId, newQuantity }),
        });

        const data = await res.json();

        if (!res.ok) throw new Error(data.message || "Cart update failed");

        return data; // expected: { quantity, stockAdjusted, message }
    } catch (err) {
        throw err;
    }
}

async function reconcileCartOnLoad() {
    const rows = document.querySelectorAll(".table_row");

    for (const row of rows) {
        const variantId = row.dataset.variantId;
        const qtyEl = row.querySelector(".num-product");
        const stock = Number(row.dataset.stock);
        const variantName = row.dataset.variantName;

        const currentQty = Number(qtyEl.textContent);

        if (currentQty > stock) {
            try {
                // Optimistically update UI
                qtyEl.textContent = stock;

                const data = await updateCartOnServer(variantId, stock);

                showToast(
                    "info",
                    `Only ${stock} left in stock for ${variantName}. Cart adjusted.`
                );

            } catch (err) {
                showToast("error", "Failed to sync cart with server.");
            }
        }
    }

    recalcSubtotal();
}

document.addEventListener("DOMContentLoaded", reconcileCartOnLoad);


function recalcSubtotal() {
    let subtotal = 0;

    document.querySelectorAll(".qPrice").forEach((el) => {
        const value = Number(el.textContent.replace(/[^\d.]/g, ""));
        subtotal += value;
    });

    document.getElementById("cartTotal").textContent =
        `₹ ${subtotal.toFixed(2)}`;
}