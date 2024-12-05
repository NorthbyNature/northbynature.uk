document.addEventListener('DOMContentLoaded', function () {
    const fieldsets = document.querySelectorAll('form.membership-form fieldset');
    const nextButtons = document.querySelectorAll('.next-btn');
    const prevButtons = document.querySelectorAll('.prev-btn');
    const form = document.querySelector('.membership-form');
    let currentStep = 0;

    // Function to update visibility of fieldsets
    function updateFormSteps() {
        fieldsets.forEach((fieldset, index) => {
            if (index === currentStep) {
                fieldset.style.display = 'block';
            } else {
                fieldset.style.display = 'none';
            }
        });
    }

    // Event listeners for "Next" buttons
    nextButtons.forEach((button) => {
        button.addEventListener('click', () => {
            if (currentStep < fieldsets.length - 1) {
                currentStep++;
                updateFormSteps();
            }
        });
    });

    // Event listeners for "Back" buttons
    prevButtons.forEach((button) => {
        button.addEventListener('click', () => {
            if (currentStep > 0) {
                currentStep--;
                updateFormSteps();
            }
        });
    });

    // Initialize form steps
    updateFormSteps();

    // Prevent default form submission (for testing)
    form.addEventListener('submit', (e) => {
        alert('Form submitted!');
    });
});

document.addEventListener('DOMContentLoaded', function () {
    const eventCards = document.querySelectorAll('.event-card'); // Select all event cards

    // Function to hide or show events based on data-active attribute
    function updateEventVisibility() {
        eventCards.forEach((card) => {
            const isActive = card.getAttribute('data-active') === 'true'; // Check if the event is active
            if (isActive) {
                card.style.display = 'block'; // Show the card if active
            } else {
                card.style.display = 'none'; // Hide the card if inactive
            }
        });
    }

    // Call the function to initialize event visibility
    updateEventVisibility();

    // Example: If you want to dynamically change the status of an event
    // Uncomment and modify this section for testing or future functionality
    /*
    setTimeout(() => {
        // Change the first event to active after 5 seconds
        eventCards[0].setAttribute('data-active', 'true');
        updateEventVisibility(); // Reapply the visibility changes
    }, 5000);
    */
});
document.addEventListener('DOMContentLoaded', function () {
    // Select DOM elements
    const quantityInput = document.querySelector('#quantity-input');
    const increaseQuantityButton = document.querySelector('#increase-quantity');
    const decreaseQuantityButton = document.querySelector('#decrease-quantity');
    const ticketButtons = document.querySelectorAll('.ticket-btn');
    const addToCartButton = document.querySelector('#add-to-cart');
    const buyNowButton = document.querySelector('#buy-now');

    let selectedTicket = null; // Track the currently selected ticket

    // Function to update quantity
    function updateQuantity(change) {
        const currentQuantity = parseInt(quantityInput.value, 10) || 1; // Default to 1 if invalid
        let newQuantity = currentQuantity + change;

        // Prevent quantity from going below 1
        if (newQuantity < 1) newQuantity = 1;

        quantityInput.value = newQuantity;
    }

    // Event listeners for increasing/decreasing quantity
    increaseQuantityButton.addEventListener('click', () => {
        updateQuantity(1); // Increment quantity
    });

    decreaseQuantityButton.addEventListener('click', () => {
        updateQuantity(-1); // Decrement quantity
    });

    // Event listeners for ticket selection
    ticketButtons.forEach((button) => {
        button.addEventListener('click', () => {
            // Remove "selected" class from all buttons
            ticketButtons.forEach((btn) => btn.classList.remove('selected'));

            // Add "selected" class to the clicked button
            button.classList.add('selected');

            // Update the selected ticket
            selectedTicket = {
                name: button.getAttribute('data-name'),
                price: parseFloat(button.getAttribute('data-price')),
            };
        });
    });

    // Event listener for "Add to Cart"
    addToCartButton.addEventListener('click', () => {
        const quantity = parseInt(quantityInput.value, 10) || 1;

        if (!selectedTicket) {
            alert('Please select a ticket type before adding to the cart!');
            return;
        }

        // Add ticket to cart logic (replace this with actual cart integration)
        console.log(`Added ${quantity} x ${selectedTicket.name} (£${selectedTicket.price} each) to the cart.`);
        alert(`Added ${quantity} x ${selectedTicket.name} (£${selectedTicket.price} each) to your cart.`);
    });

    // Event listener for "Buy Now"
    buyNowButton.addEventListener('click', () => {
        const quantity = parseInt(quantityInput.value, 10) || 1;

        if (!selectedTicket) {
            alert('Please select a ticket type before proceeding!');
            return;
        }

        // Redirect to checkout or handle the purchase directly
        console.log(`Buying ${quantity} x ${selectedTicket.name} (£${selectedTicket.price} each) now.`);
        alert(`Proceeding to buy ${quantity} x ${selectedTicket.name}.`);
    });
});

