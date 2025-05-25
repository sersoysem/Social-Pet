// Sepet sayısını güncelle
function updateCartCount() {
    const cartItems = JSON.parse(localStorage.getItem('cart_items') || '[]');
    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const cartCountElement = document.getElementById('cartCount');
    if (cartCountElement) {
        cartCountElement.textContent = totalItems;
    }
}

// Sayfa yüklendiğinde sepet sayısını güncelle
document.addEventListener('DOMContentLoaded', function() {
    updateCartCount();
}); 