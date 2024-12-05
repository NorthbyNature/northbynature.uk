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

