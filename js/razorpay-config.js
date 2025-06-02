// Initialize global error and timeout tracking
window.activeTimeouts = window.activeTimeouts || [];
window.paymentErrors = window.paymentErrors || [];

// Clear orphaned timeouts on page load/reload
window.addEventListener('load', () => {
    window.activeTimeouts = [];
    window.paymentErrors = [];
});

// Razorpay Configuration
const razorpayConfig = {
    // Server endpoints
    apiBaseUrl: 'https://noori-charitable-trust-backend.onrender.com', // Production backend URL
    createOrderUrl: '/api/create-order',
    verifyPaymentUrl: '/api/verify-payment',
    
    // Client-side only configurations
    company_name: 'Noor Charitable Trust',
    theme: {
        color: '#2980b9',  // Primary blue to match our updated site colors
        backdrop_color: '#f9f9f9',
        hide_topbar: false,
        branding: '#16a085'  // Accent teal for branding elements
    },
    modal: {
        confirm_close: true,
        animation: true
    },
    send_sms_hash: true
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

    // Set a timeout for the fetch request with increased timeout for better reliability
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
        controller.abort();
        console.warn(`Request to ${url} timed out after 30 seconds`);
        // Track this timeout in our global timeouts array
        if (window.activeTimeouts) {
            window.activeTimeouts.push({
                type: 'fetch',
                url: url,
                timestamp: new Date().toISOString()
            });
        }
    }, 30000); // 30 second timeout for better reliability
    options.signal = controller.signal;

    try {
        const response = await fetch(fullUrl, options);
        clearTimeout(timeoutId); // Clear the timeout
        
        // Check for empty response
        if (!response.ok) {
            const errorMessage = `Server returned ${response.status}: ${response.statusText}`;
            console.error('API Error:', {
                status: response.status,
                message: errorMessage
            });
            throw new Error(errorMessage);
        }
        
        // Parse JSON response with error handling
        let responseData;
        try {
            responseData = await response.json();
        } catch (jsonError) {
            console.error('Failed to parse JSON response:', jsonError);
            // Track this error in our global errors array
            if (window.paymentErrors) {
                window.paymentErrors.push({
                    type: 'json_parse',
                    url: url,
                    timestamp: new Date().toISOString(),
                    details: jsonError.message
                });
            }
            throw new Error('The server response could not be processed. This might be a temporary issue. Please try again in a few moments.');
        }
        
        console.log('Response status:', response.status);
        console.log('Response data:', responseData);
        
        // Check for API error in response
        if (responseData.error || responseData.status === 'error') {
            const errorMessage = responseData.message || responseData.error || 'Something went wrong';
            console.error('API Error in response:', errorMessage);
            throw new Error(errorMessage);
        }
        
        return responseData;
    } catch (error) {
        console.error('Request failed:', error);
        
        // Handle specific error types with user-friendly messages
        if (error.name === 'AbortError') {
            throw new Error('Request timed out. The server is taking too long to respond. Please try again later.');
        } else if (error.message.includes('NetworkError') || error.message.includes('network')) {
            throw new Error('Network connection issue. Please check your internet connection and try again.');
        } else if (error.message.includes('JSON')) {
            throw new Error('Invalid response from server. Please try again later.');
        }
        
        throw new Error(`Failed to process request: ${error.message}`);
    } finally {
        // Ensure timeout is cleared in all cases
        clearTimeout(timeoutId);
    }
}

// Function to clear loading state and reset UI
function clearLoadingState() {
    // Hide loading spinner
    const loadingSpinner = document.getElementById('donationLoading');
    if (loadingSpinner) {
        loadingSpinner.classList.remove('active');
        loadingSpinner.style.display = 'none';
    }
    
    // Reset donate button
    const donateButton = document.getElementById('donateButton');
    if (donateButton) {
        donateButton.disabled = false;
        donateButton.innerHTML = donateButton.getAttribute('data-original-text') || 'Donate Now';
    }
    
    // Clear any existing timeouts to prevent multiple callbacks
    if (window.razorpayTimeouts) {
        window.razorpayTimeouts.forEach(timeoutId => clearTimeout(timeoutId));
        window.razorpayTimeouts = [];
    }
}

// Helper to track timeouts globally for cleanup
function trackTimeout(timeoutId) {
    if (!window.razorpayTimeouts) {
        window.razorpayTimeouts = [];
    }
    window.razorpayTimeouts.push(timeoutId);
    return timeoutId;
}

// Function to show success message by navigating to About section
function showSuccessModal(paymentId) {
    try {
        // Clear loading state
        clearLoadingState();
        
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
        // Clear loading state
        clearLoadingState();
        
        // Get the donation form container
        const donationForm = document.getElementById('donationForm');
        if (!donationForm) return;
        
        // Remove any existing error messages first
        const existingMessage = document.getElementById('paymentFailureMessage');
        if (existingMessage) {
            existingMessage.remove();
        }
        
        // Format the error message for better user experience
        let formattedMessage = errorMessage;
        if (errorMessage.toLowerCase().includes('timeout') || errorMessage.toLowerCase().includes('timed out')) {
            formattedMessage = 'Request timed out. Please try again.';
        } else if (errorMessage.toLowerCase().includes('network') || errorMessage.toLowerCase().includes('connection')) {
            formattedMessage = 'Network connection issue. Please check your internet connection and try again.';
        } else if (errorMessage.toLowerCase().includes('abort')) {
            formattedMessage = 'Request was interrupted. Please try again.';
        }
        
        // Create new error message element with updated styling
        const failureMessage = document.createElement('div');
        failureMessage.id = 'paymentFailureMessage';
        failureMessage.className = 'payment-failed-container';
        failureMessage.innerHTML = `
            <div class="payment-failed-icon">
                <i class="fas fa-exclamation"></i>
            </div>
            <h2>Payment Failed</h2>
            <p>${formattedMessage}</p>
            <p>Please try again or contact support if the problem persists.</p>
            <button id="dismissFailureBtn" class="dismiss-button">DISMISS</button>
        `;
        
        // Insert at the end of the form
        donationForm.appendChild(failureMessage);
        
        // Add event listener to dismiss button
        const dismissBtn = document.getElementById('dismissFailureBtn');
        if (dismissBtn) {
            dismissBtn.addEventListener('click', function() {
                failureMessage.remove();
            });
        }
        
        // Scroll to the error message
        failureMessage.scrollIntoView({ behavior: 'smooth', block: 'start' });
        
        // Log the error for debugging
        console.error('Payment failure:', errorMessage);
    } catch (error) {
        console.error('Error showing failure modal:', error);
        alert(`Payment failed: ${errorMessage}`);
    }
}

// Function to handle form submission
async function handleDonation(e) {
    e.preventDefault();
    
    // Get form data
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone').value;
    const amount = document.getElementById('amount').value;
    const purpose = document.getElementById('purpose').value;
    
    // Validate form data
    if (!name || !amount || !purpose) {
        alert('Please fill in all required fields');
        return;
    }
    
    // Validate amount
    if (isNaN(amount) || amount < 1) {
        alert('Please enter a valid amount');
        return;
    }
    
    // Get the donate button
    const donateButton = document.getElementById('donateButton');
    const originalButtonText = donateButton.innerHTML;
    
    // Store original text for later use
    donateButton.setAttribute('data-original-text', originalButtonText);
    
    // Disable button and show loading
    donateButton.disabled = true;
    donateButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    
    // Show loading spinner
    const loadingSpinner = document.getElementById('donationLoading');
    if (loadingSpinner) {
        loadingSpinner.style.display = 'flex';
        loadingSpinner.classList.add('active');
    }
    
    // Set a timeout to clear the loading state if the request takes too long
    const loadingTimeout = setTimeout(() => {
        clearLoadingState();
        showFailureModal('Request is taking longer than expected. This could be due to slow internet connection or server issues. Please try again.');
    }, 40000); // 40 seconds timeout for better reliability
    
    try {
        // Create order on the server
        const orderData = {
            amount: parseFloat(amount) * 100, // Convert to paise (e.g., 500 rupees = 50000 paise)
            currency: 'INR',
            notes: {
                name,
                purpose,
                ...(email ? { email } : {}),
                ...(phone ? { phone } : {})
            }
        };
        
        const response = await makeRequest(razorpayConfig.createOrderUrl, 'POST', orderData);
        
        // Clear the timeout since we got a response
        clearTimeout(loadingTimeout);
        
        if (!response || !response.data || !response.data.order) {
            throw new Error('Failed to create order');
        }
        
        const { order, key } = response.data;
        
        // Initialize Razorpay payment
        const options = {
            key,
            amount: order.amount,
            currency: order.currency,
            name: razorpayConfig.company_name,
            description: `Donation for ${purpose}`,
            order_id: order.id,
            handler: function(response) {
                // This function is called when payment is successful
                console.log('Payment successful:', response);
                
                // Set a verification timeout with longer duration
                const verificationTimeout = setTimeout(() => {
                    clearLoadingState();
                    // If we have a payment ID, we can assume payment was successful even if verification is slow
                    if (response.razorpay_payment_id) {
                        showSuccessModal(response.razorpay_payment_id);
                        console.warn('Payment verification took too long, but payment ID exists. Showing success. ID:', response.razorpay_payment_id);
                    } else {
                        // This should rarely happen since we already have payment ID in the handler
                        showFailureModal('Payment verification is taking longer than expected. If your payment was successful, please contact us with your transaction details.');
                    }
                }, 15000); // 15 seconds timeout for verification for better reliability
                
                // Verify payment on server
                makeRequest(razorpayConfig.verifyPaymentUrl, 'POST', {
                    order_id: response.razorpay_order_id,
                    payment_id: response.razorpay_payment_id,
                    signature: response.razorpay_signature,
                    amount: order.amount,
                    notes: orderData.notes
                })
                .then(verificationResponse => {
                    clearTimeout(verificationTimeout);
                    console.log('Payment verified:', verificationResponse);
                    showSuccessModal(response.razorpay_payment_id);
                })
                .catch(error => {
                    clearTimeout(verificationTimeout);
                    console.error('Verification error:', error);
                    // Still show success if payment ID exists, but log the verification error
                    if (response.razorpay_payment_id) {
                        showSuccessModal(response.razorpay_payment_id);
                        console.warn('Payment succeeded but verification failed. Payment ID:', response.razorpay_payment_id);
                    } else {
                        showFailureModal('Payment verification failed. Please contact support.');
                    }
                });
            },
            modal: {
                escape: true,
                backdropclose: false,
                handleback: true,
                confirm_close: true,
                animation: true,
                ondismiss: function() {
                    // This function is called when the payment popup is closed without completing payment
                    clearTimeout(loadingTimeout); // Clear the main timeout
                    showFailureModal('Payment was cancelled. Please try again if you wish to complete your donation.');
                }
            },
            prefill: {
                name,
                // Only include email and phone if provided
                ...(email ? { email } : {}),
                ...(phone ? { contact: phone } : {})
            },
            notes: {
                purpose: purpose
            },
            theme: razorpayConfig.theme,
            // Add custom branding
            image: 'images/logo.png', // Logo in payment popup
            remember_customer: true
        };
        
        const rzp = new Razorpay(options);
        rzp.open();
        
        // Handle payment failure
        rzp.on('payment.failed', function(response) {
            clearTimeout(loadingTimeout); // Clear the main timeout
            console.error('Payment failed:', response.error);
            showFailureModal(response.error.description || 'Unknown error');
        });
        
    } catch (error) {
        clearTimeout(loadingTimeout); // Clear the timeout
        console.error('Error:', error);
        showFailureModal(error.message || 'An error occurred. Please try again.');
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
