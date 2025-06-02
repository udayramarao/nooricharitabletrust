// Razorpay Configuration
const razorpayConfig = {
    // Server endpoints
    apiBaseUrl: 'https://noori-charitable-trust-backend.onrender.com', // Production backend URL
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

// Function to show success message by navigating to About section
function showSuccessModal(paymentId) {
    try {
        // Hide loading spinner if visible
        const loadingSpinner = document.getElementById('donationLoading');
        if (loadingSpinner) {
            loadingSpinner.classList.remove('active');
            loadingSpinner.style.display = 'none';
        }
        
        // Create success message in the About section
        const aboutSection = document.getElementById('about');
        if (aboutSection) {
            // Remove any existing success messages first
            const existingMessage = document.getElementById('paymentSuccessMessage');
            if (existingMessage) {
                existingMessage.remove();
            }
            
            // Create new success message element
            const successMessage = document.createElement('div');
            successMessage.id = 'paymentSuccessMessage';
            successMessage.className = 'payment-message success-message';
            successMessage.innerHTML = `
                <div class="message-icon-container">
                    <i class="fas fa-check-circle success-icon pulse"></i>
                </div>
                <h3>Thank you for your donation!</h3>
                <p>Every rupee is important in this journey and congrats for being part of our mission.</p>
                <p>Payment ID: <span class="highlight-text">${paymentId || 'N/A'}</span></p>
            `;
            
            // Insert at the beginning of the About section
            aboutSection.insertBefore(successMessage, aboutSection.firstChild);
            
            // Scroll to the About section
            aboutSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
            // Fallback if About section not found
            alert('Thank you for your donation! Payment ID: ' + (paymentId || 'N/A'));
        }
        
        // Reset form
        const donationForm = document.getElementById('donationForm');
        if (donationForm) {
            donationForm.reset();
        }
        
        // Re-enable donate button
        const donateButton = document.getElementById('donateButton');
        if (donateButton) {
            donateButton.disabled = false;
        }
    } catch (error) {
        console.error('Error showing success message:', error);
        alert('Thank you for your donation! Payment ID: ' + (paymentId || 'N/A'));
    }
}

// Function to show failure message in the donation form area
function showFailureModal(errorMessage = 'An unknown error occurred') {
    try {
        // Hide loading spinner if visible
        const loadingSpinner = document.getElementById('donationLoading');
        if (loadingSpinner) {
            loadingSpinner.classList.remove('active');
            loadingSpinner.style.display = 'none';
        }
        
        // Find the donation form container
        const donationForm = document.getElementById('donationForm');
        if (donationForm) {
            // Remove any existing failure messages first
            const existingMessage = document.getElementById('paymentFailureMessage');
            if (existingMessage) {
                existingMessage.remove();
            }
            
            // Create new failure message element
            const failureMessage = document.createElement('div');
            failureMessage.id = 'paymentFailureMessage';
            failureMessage.className = 'payment-message failure-message';
            failureMessage.innerHTML = `
                <div class="message-icon-container">
                    <i class="fas fa-exclamation-triangle error-icon shake"></i>
                </div>
                <h3>Payment Unsuccessful</h3>
                <p>We encountered an issue with your donation: ${errorMessage}</p>
                <p>Don't worry - no money has been deducted from your account.</p>
                <button class="btn btn-primary retry-button" onclick="document.getElementById('paymentFailureMessage').remove();">Try Again</button>
            `;
            
            // Insert right after the donate button
            const donateButtonContainer = document.querySelector('#donationForm .form-group:last-of-type');
            if (donateButtonContainer) {
                donateButtonContainer.after(failureMessage);
                // Scroll to the failure message
                failureMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else {
                // Fallback - append to the form
                donationForm.appendChild(failureMessage);
                failureMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        } else {
            // Fallback if donation form not found
            alert('Payment failed: ' + errorMessage);
        }
        
        // Re-enable donate button
        const donateButton = document.getElementById('donateButton');
        if (donateButton) {
            donateButton.disabled = false;
        }
    } catch (error) {
        console.error('Error showing failure message:', error);
        alert('Payment failed: ' + errorMessage);
    }
}

// Initialize any event handlers when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Add any additional initialization code here if needed
    
    // No need for modal event handlers with inline messages
});

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
    const loadingElement = document.getElementById('donationLoading');
    
    // Show loading state immediately
    const originalButtonText = donateButton.innerHTML;
    donateButton.disabled = true;
    donateButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    
    // Show loading spinner immediately
    if (loadingElement) {
        loadingElement.classList.add('active');
        document.querySelector('.loading-text').textContent = 'Preparing your donation...';
    }
    
    try {
        // Validate form - only name and amount are mandatory
        if (!name || isNaN(amount) || amount < 1) {
            throw new Error('Please enter your name and a valid donation amount (minimum ₹1)');
        }
        
        // Validate email only if provided
        if (email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                throw new Error('Please enter a valid email address or leave it blank');
            }
        }
        
        // Validate phone only if provided
        if (phone) {
            const phoneRegex = /^[6-9]\d{9}$/;
            if (!phoneRegex.test(phone)) {
                throw new Error('Please enter a valid 10-digit Indian mobile number or leave it blank');
            }
        }
    
        // Update loading message with more informative text
        if (loadingElement) {
            document.querySelector('.loading-text').textContent = 'Creating your donation order... This may take a few moments.';
        }
        
        // Create order on server with a timeout to prevent hanging
        const orderPromise = makeRequest(razorpayConfig.createOrderUrl, 'POST', {
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
        
        // Set a timeout to handle slow server responses
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Server request timed out. Please try again.')), 15000);
        });
        
        // Race the order creation against a timeout
        const response = await Promise.race([orderPromise, timeoutPromise]);

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
                // Only include email and phone if provided
                ...(email ? { email } : {}),
                ...(phone ? { contact: phone } : {})
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
                const loadingElement = document.getElementById('donationLoading');
                try {
                    // Show loading spinner
                    if (loadingElement) {
                        loadingElement.classList.add('active');
                    }
                    
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
                    showFailureModal(error.message || 'Payment verification failed. Please try again or contact support.');
                } finally {
                    // Hide loading spinner
                    if (loadingElement) {
                        loadingElement.classList.remove('active');
                    }
                    // Re-enable button
                    if (donateButton) {
                        donateButton.disabled = false;
                        donateButton.innerHTML = originalButtonText;
                    }
                }
            },
            modal: {
                escape: true,
                backdropclose: true,
                handleback: true,
                confirm_close: true,
                ondismiss: function() {
                    // This function is called when the payment popup is closed without completing payment
                    // Hide loading spinner first
                    const loadingSpinner = document.getElementById('donationLoading');
                    if (loadingSpinner) {
                        loadingSpinner.classList.remove('active');
                        loadingSpinner.style.display = 'none';
                    }
                    
                    // Show failure message
                    showFailureModal('Payment was cancelled. Please try again if you wish to complete your donation.');
                    
                    // Re-enable button
                    if (donateButton) {
                        donateButton.disabled = false;
                        donateButton.innerHTML = originalButtonText;
                    }
                }
            },
            prefill: {
                name,
                // Only include email and phone if provided
                ...(email ? { email } : {}),
                ...(phone ? { contact: phone } : {})
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
            
            // Hide loading spinner
            const loadingSpinner = document.getElementById('donationLoading');
            if (loadingSpinner) {
                loadingSpinner.classList.remove('active');
                loadingSpinner.style.display = 'none';
            }
            
            // Show failure message instead of alert
            showFailureModal(response.error.description || 'Unknown error');
            
            // Re-enable button
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
