// Razorpay Configuration
const razorpayConfig = {
    // Replace with your actual Razorpay API Key (starts with 'rzp_test_' for test mode)
    key: 'YOUR_RAZORPAY_KEY',
    
    // Business Details
    business: {
        name: 'Noor Charitable Trust',
        address: 'D.NO: 15/273, Ameen Peer Dargah Road, Beside Water Tank, Kadapa, Andhra Pradesh 516001, India',
        contact: '+91 63018 02653',
        email: 'noorcharitabletrustforyou@gmail.com',
        website: 'https://yourwebsite.com' // Replace with your actual website URL
    },
    
    // Bank Account Details (already shown on your website)
    bank: {
        accountName: 'NOOR CHARITABLE TRUST',
        accountNumber: '0207102000010371',
        ifsc: 'IBKL0000207',
        bankName: 'IDBI BANK',
        branch: 'Kadapa'
    },
    
    // Legal Documents (links to the policy pages we created)
    legal: {
        privacyPolicy: 'legal/privacy-policy.html',
        terms: 'legal/terms-conditions.html',
        refundPolicy: 'legal/refund-policy.html'
    },
    
    // Business Category (Select from Razorpay's list)
    category: 'NGO',
    
    // Business Type (Individual/Company/Partnership/LLP/Trust/Society)
    businessType: 'Trust',
    
    // Business Description
    description: 'Noor Charitable Trust is dedicated to transforming lives through compassion, healthcare, education, and sustainable development.'
};

// Export the configuration
if (typeof module !== 'undefined' && module.exports) {
    module.exports = razorpayConfig;
}
