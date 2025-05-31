// Razorpay Configuration
const razorpayConfig = {
    // Server endpoints
    apiBaseUrl: 'http://localhost:3000', // Update this in production to your actual domain
    createOrderUrl: '/api/create-order',
    verifyPaymentUrl: '/api/verify-payment',
    
    // Client-side only configurations
    company_name: 'Noor Charitable Trust',
    theme: {
        color: '#6a1b9a'  // Purple theme to match your site
    }
};

// Helper function to make API requests
async function makeRequest(url, method = 'GET', data = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'same-origin'
    };

    if (data) {
        options.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(`${razorpayConfig.apiBaseUrl}${url}`, options);
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Something went wrong');
        }
        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Function to show success modal
function showSuccessModal(paymentId) {
    const modal = document.getElementById('successModal');
    const transactionId = document.getElementById('transactionId');
    const closeModal = document.querySelector('.close-modal');
    const closeButton = document.getElementById('closeModal');
    const printButton = document.getElementById('printReceipt');

    // Set transaction ID
    transactionId.textContent = paymentId || 'N/A';
    
    // Show modal
    modal.style.display = 'flex';
    
    // Close modal when clicking the close button or outside the modal
    const closeModalHandler = () => modal.style.display = 'none';
    
    closeModal.onclick = closeModalHandler;
    closeButton.onclick = closeModalHandler;
    
    // Close when clicking outside the modal content
    window.onclick = (event) => {
        if (event.target === modal) {
            closeModalHandler();
        }
    };
    
    // Handle print receipt
    printButton.onclick = () => {
        // You can implement print functionality here
        alert('Print receipt functionality will be implemented here');
    };
}

// Function to handle form submission
async function handleDonation(e) {
    e.preventDefault();
    
    // Get form values
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const amount = parseFloat(document.getElementById('amount').value);
    const purpose = document.getElementById('purpose').value;
    const purposeText = document.getElementById('purpose').options[document.getElementById('purpose').selectedIndex].text;
    const donateButton = document.getElementById('donateButton');
    
    // Validate form
    if (!name || !email || !phone || isNaN(amount) || amount < 1) {
        alert('Please fill in all fields and enter a valid amount (minimum ₹1)');
        return;
    }
    
    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        alert('Please enter a valid email address');
        return;
    }
    
    // Validate phone number (basic validation for Indian numbers)
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
        alert('Please enter a valid 10-digit Indian phone number');
        return;
    }
    
    // Show loading state
    const originalButtonText = donateButton.innerHTML;
    donateButton.disabled = true;
    donateButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    
    try {
        // Create order on the server
        const orderData = await makeRequest(razorpayConfig.createOrderUrl, 'POST', {
            amount: amount * 100, // Convert to paise
            currency: 'INR',
            receipt: 'donation_' + Date.now(),
            notes: {
                name,
                email,
                phone,
                purpose: purposeText
            }
        });
        
        // Initialize Razorpay with order details
        const options = {
            key: 'rzp_live_w0S4HMSEhghpNu', // Your Razorpay Key ID
            amount: orderData.amount,
            currency: orderData.currency,
            name: razorpayConfig.company_name,
            description: `Donation for ${purposeText}`,
            order_id: orderData.id,
            handler: async function(response) {
                try {
                    // Verify payment on the server
                    const verification = await makeRequest(razorpayConfig.verifyPaymentUrl, 'POST', {
                        razorpay_order_id: response.razorpay_order_id,
                        razorpay_payment_id: response.razorpay_payment_id,
                        razorpay_signature: response.razorpay_signature
                    });
                    
                    if (verification.status === 'success') {
                        // Show success message
                        showSuccessModal(response.razorpay_payment_id);
                        // Reset form
                        document.getElementById('donationForm').reset();
                    } else {
                        alert('Payment verification failed. Please contact support with payment ID: ' + response.razorpay_payment_id);
                    }
                } catch (error) {
                    console.error('Verification error:', error);
                    alert('Payment successful but verification failed. Please contact support with payment ID: ' + response.razorpay_payment_id);
                }
            },
            prefill: {
                name: name,
                email: email,
                contact: phone
            },
            theme: {
                color: razorpayConfig.theme.color
            },
            modal: {
                ondismiss: function() {
                    // Handle modal dismissal
                    console.log('Payment modal dismissed');
                }
            }
        };
        
        // Initialize Razorpay payment
        const rzp = new Razorpay(options);
        rzp.open();
        
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred: ' + (error.message || 'Please try again later.'));
    } finally {
        // Reset button state
        donateButton.disabled = false;
        donateButton.innerHTML = originalButtonText;
    }
}

// Initialize the donation form
function initDonationForm() {
    // Check if Razorpay is loaded
    if (typeof Razorpay === 'undefined') {
        console.error('Razorpay SDK not loaded');
        return;
    }
    
    // Get the donation form
    const donationForm = document.getElementById('donationForm');
    if (!donationForm) {
        console.error('Donation form not found');
        return;
    }
    
    // Add submit event listener to the form
    donationForm.addEventListener('submit', handleDonation);
}

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDonationForm);
} else {
    initDonationForm();
}
