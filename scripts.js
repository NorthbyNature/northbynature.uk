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
