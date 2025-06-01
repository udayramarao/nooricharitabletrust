document.addEventListener('DOMContentLoaded', function() {
    // Select all donation option elements
    const donationOptions = document.querySelectorAll('.donation-option');
    const customAmountInput = document.querySelector('.custom-amount input');
    const donationForm = document.getElementById('donationForm');
    const amountInput = document.getElementById('amount');
    
    // Set default amount if not set
    if (!amountInput) {
        console.error('Amount input not found in the form');
        return;
    }

    // Set the first option as active by default
    if (donationOptions.length > 0 && !document.querySelector('.donation-option.active')) {
        donationOptions[0].classList.add('active');
    }

    // Handle donation option selection
    donationOptions.forEach(option => {
        option.addEventListener('click', function() {
            // Remove active class from all options
            donationOptions.forEach(opt => opt.classList.remove('active'));
            
            // Add active class to clicked option
            this.classList.add('active');
            
            // If it's not the custom amount option, set the amount
            if (!this.classList.contains('custom-amount')) {
                const amount = this.getAttribute('data-amount');
                amountInput.value = amount;
                if (customAmountInput) customAmountInput.value = ''; // Clear custom amount
            } else if (customAmountInput) {
                customAmountInput.focus();
            }
            
            console.log('Amount set to:', amountInput.value);
        });
    });

    // Handle custom amount input if exists
    if (customAmountInput) {
        customAmountInput.addEventListener('input', function() {
            const amount = this.value.trim();
            if (amount) {
                amountInput.value = amount;
                // Activate custom amount option
                const customOption = document.querySelector('.custom-amount');
                if (customOption) customOption.classList.add('active');
                // Deactivate other options
                document.querySelectorAll('.donation-option:not(.custom-amount)').forEach(opt => {
                    opt.classList.remove('active');
                });
                
                console.log('Custom amount set to:', amount);
            }
        });
    }
    
    // Prevent form submission if not handled by Razorpay
    donationForm.addEventListener('submit', function(e) {
        console.log('Form submission intercepted');
        // Let Razorpay handle the submission
    });
});
