// Razorpay Configuration
const razorpayConfig = {
    // Server endpoints
    apiBaseUrl: 'http://localhost:3002', // Local development server URL
    createOrderUrl: '/api/create-order',
    verifyPaymentUrl: '/api/verify-payment',
    
    // Client-side only configurations
    company_name: 'Noor Charitable Trust',
    theme: {
        color: '#8e44ad'  // Purple theme to match your site
    }
};

// Helper function to make API requests
async function makeRequest(url, method = 'GET', data = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        credentials: 'same-origin',
        mode: 'cors'
    };

    if (data) {
        options.body = JSON.stringify(data);
        console.log('Request data:', data);
    }

    const fullUrl = `${razorpayConfig.apiBaseUrl}${url}`;
    console.log(`Making ${method} request to:`, fullUrl);

    try {
        const response = await fetch(fullUrl, options);
        const responseData = await response.json().catch(() => ({}));
        
        console.log('Response status:', response.status);
        console.log('Response data:', responseData);
        
        if (!response.ok) {
            const errorMessage = responseData.message || responseData.error || 'Something went wrong';
            console.error('API Error:', {
                status: response.status,
                statusText: response.statusText,
                error: errorMessage,
                url: fullUrl
            });
            throw new Error(errorMessage);
        }
        
        return responseData;
    } catch (error) {
        console.error('Network/API Error:', {
            url: fullUrl,
            method,
            error: error.message,
            stack: error.stack
        });
        throw new Error(`Failed to process request: ${error.message}`);
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
    
    // Show loading state
    const originalButtonText = donateButton.innerHTML;
    donateButton.disabled = true;
    donateButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    
    try {
        // Validate form
        if (!name || !email || !phone || isNaN(amount) || amount < 1) {
            throw new Error('Please fill in all fields and enter a valid amount (minimum ₹1)');
        }
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            throw new Error('Please enter a valid email address');
        }
        
        const phoneRegex = /^[6-9]\d{9}$/;
        if (!phoneRegex.test(phone)) {
            throw new Error('Please enter a valid 10-digit Indian mobile number');
        }
    
        // Create order on server
        const response = await makeRequest(razorpayConfig.createOrderUrl, 'POST', {
            amount: amount, // Server will handle conversion to paise
            currency: 'INR',
            receipt: 'donation_' + Date.now(),
            notes: {
                name,
                email,
                phone,
                purpose,
                purposeText
            }
        });

        // Extract order data and key from server response
        const orderData = response.data.order;
        const razorpayKey = response.data.key;
        
        console.log('Order created:', orderData);
        console.log('Using Razorpay Key:', razorpayKey);

        // Open Razorpay checkout
        const options = {
            key: razorpayKey,
            amount: orderData.amount,
            currency: orderData.currency || 'INR',
            name: razorpayConfig.company_name,
            description: `Donation for ${purposeText}`,
            order_id: orderData.id,
            prefill: {
                name: name,
                email: email,
                contact: phone
            },
            theme: razorpayConfig.theme,
            // Show all payment methods with UPI at the top
            config: {
                display: {
                    blocks: {
                        upi: {
                            name: 'Pay using UPI',
                            instruments: [
                                {
                                    method: 'upi'
                                }
                            ]
                        },
                        banks: {
                            name: 'Pay using Netbanking',
                            instruments: [
                                {
                                    method: 'netbanking'
                                }
                            ]
                        },
                        cards: {
                            name: 'Pay using Cards',
                            instruments: [
                                {
                                    method: 'card'
                                }
                            ]
                        },
                        wallets: {
                            name: 'Pay using Wallets',
                            instruments: [
                                {
                                    method: 'wallet'
                                }
                            ]
                        }
                    },
                    sequence: ['block.upi', 'block.banks', 'block.cards', 'block.wallets'],
                    preferences: {
                        show_default_blocks: true
                    }
                }
            },
            handler: async function(response) {
                try {
                    // Verify payment on server
                    console.log('Payment response:', response);
                    const verification = await makeRequest(razorpayConfig.verifyPaymentUrl, 'POST', {
                        order_id: response.razorpay_order_id,
                        payment_id: response.razorpay_payment_id,
                        signature: response.razorpay_signature,
                        notes: {
                            name: name,
                            email: email,
                            phone: phone,
                            purpose: purpose,
                            purposeText: purposeText
                        }
                    });
                    
                    // Show success message
                    showSuccessModal(response.razorpay_payment_id);
                    
                    // Reset form
                    document.getElementById('donationForm').reset();
                    
                } catch (error) {
                    console.error('Payment verification failed:', error);
                    alert('Payment verification failed. Please contact support with your payment ID.');
                } finally {
                    // Re-enable button
                    donateButton.disabled = false;
                    donateButton.innerHTML = originalButtonText;
                }
            },
            prefill: {
                name,
                email,
                contact: phone
            },
            theme: razorpayConfig.theme,
            modal: {
                ondismiss: function() {
                    // Re-enable button if user closes the Razorpay modal
                    donateButton.disabled = false;
                    donateButton.innerHTML = originalButtonText;
                }
            }
        };
        
        const rzp = new Razorpay(options);
        rzp.open();
        
        // Handle payment failure
        rzp.on('payment.failed', function(response) {
            console.error('Payment failed:', response.error);
            alert('Payment failed: ' + (response.error.description || 'Unknown error'));
            donateButton.disabled = false;
            donateButton.innerHTML = originalButtonText;
        });
        
    } catch (error) {
        console.error('Error:', error);
        alert(error.message || 'An error occurred. Please try again.');
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

// Initialize donation form event listeners
function initDonationForm() {
    const donationForm = document.getElementById('donationForm');
    if (donationForm) {
        donationForm.addEventListener('submit', handleDonation);
    }
    
    // Set default amount if not set
    const amountInput = document.getElementById('amount');
    if (amountInput && !amountInput.value) {
        amountInput.value = '500';
    }
}

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDonationForm);
} else {
    initDonationForm();
}
