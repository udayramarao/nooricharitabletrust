require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const Razorpay = require('razorpay');
const fs = require('fs');
const path = require('path');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const { v4: uuidv4 } = require('uuid');

// Import custom modules
const logger = require('./config/logger');
const { apiLimiter, paymentLimiter } = require('./middleware/rateLimiter');
const emailService = require('./utils/emailService');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet()); // Set security HTTP headers
app.use(mongoSanitize()); // Sanitize data against NoSQL injection
app.use(xss()); // Prevent XSS attacks
app.use(hpp()); // Prevent parameter pollution

// Enable CORS with specific options in production
const corsOptions = {
    origin: process.env.NODE_ENV === 'production' 
        ? ['https://yourdomain.com', 'https://www.yourdomain.com']
        : '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
};
app.use(cors(corsOptions));

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Initialize Razorpay with error handling
let razorpay;
try {
    razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
    logger.info('Razorpay initialized successfully');
} catch (error) {
    logger.error('Failed to initialize Razorpay:', error);
    process.exit(1);
}

// Request logging middleware
app.use((req, res, next) => {
    const start = Date.now();
    const requestId = uuidv4();
    
    res.on('finish', () => {
        const duration = Date.now() - start;
        logger.info(`${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`, {
            requestId,
            method: req.method,
            url: req.originalUrl,
            status: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip,
            userAgent: req.get('user-agent') || ''
        });
    });
    
    next();
});

// Rate limiting
app.use('/api', apiLimiter);
app.use('/api/create-order', paymentLimiter);

// API Routes
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'Server is running', 
        timestamp: new Date().toISOString(),
        env: process.env.NODE_ENV || 'development',
        razorpay: {
            keyId: process.env.RAZORPAY_KEY_ID ? 'Set' : 'Not Set',
            testMode: process.env.RAZORPAY_KEY_ID?.startsWith('rzp_test_') ? 'Yes' : 'No'
        }
    });
});

// Create a Razorpay order
app.post('/api/create-order', async (req, res) => {
    try {
        const { amount, currency = 'INR', notes = {} } = req.body;
        
        // Validate amount
        if (!amount || isNaN(amount) || amount < 1) {
            logger.warn('Invalid amount provided', { amount });
            return res.status(400).json({ 
                status: 'error',
                message: 'A valid amount of at least ₹1 is required' 
            });
        }

        // Additional validation for notes
        if (notes.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(notes.email)) {
            return res.status(400).json({
                status: 'error',
                message: 'Please provide a valid email address'
            });
        }

        const orderOptions = {
            amount: Math.round(parseFloat(amount) * 100), // Convert to paise
            currency,
            receipt: `donation_${Date.now()}`,
            notes,
            payment_capture: 1 // Auto-capture payment
        };

        logger.info('Creating Razorpay order', { orderOptions });
        
        const order = await razorpay.orders.create(orderOptions);
        
        logger.info('Order created successfully', { orderId: order.id });
        
        res.status(201).json({
            status: 'success',
            data: {
                order
            }
        });
    } catch (error) {
        logger.error('Error creating order:', error);
        res.status(500).json({ 
            status: 'error',
            message: 'Failed to create order',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Verify payment signature and handle successful payment
app.post('/api/verify-payment', async (req, res) => {
    const { order_id, payment_id, signature, ...rest } = req.body;
    
    if (!order_id || !payment_id || !signature) {
        logger.warn('Missing required parameters for payment verification', { order_id, payment_id });
        return res.status(400).json({ 
            status: 'error',
            message: 'Missing required parameters: order_id, payment_id, and signature are required' 
        });
    }

    try {
        // Verify the payment signature
        const crypto = require('crypto');
        const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
        hmac.update(order_id + '|' + payment_id);
        const generatedSignature = hmac.digest('hex');

        if (generatedSignature !== signature) {
            logger.warn('Invalid payment signature', { order_id, payment_id });
            return res.status(400).json({
                status: 'error',
                message: 'Invalid payment signature'
            });
        }

        // In a real application, you would fetch the order details from Razorpay
        // and verify the payment status and amount
        const paymentData = {
            order_id,
            payment_id,
            signature,
            timestamp: new Date().toISOString(),
            status: 'verified',
            ...rest
        };

        // Log the payment (in production, save to a database)
        const logEntry = JSON.stringify(paymentData) + '\n';
        fs.appendFileSync('payments.log', logEntry);
        
        // Send email receipt to donor if email is provided
        if (rest.notes?.email) {
            try {
                await emailService.sendDonationReceipt({
                    name: rest.notes?.name || 'Valued Donor',
                    email: rest.notes.email,
                    amount: (rest.amount / 100).toFixed(2),
                    purpose: rest.notes?.purpose || 'General Donation',
                    paymentId: payment_id
                });
                
                // Send admin notification
                await emailService.sendAdminNotification({
                    name: rest.notes?.name || 'Anonymous Donor',
                    email: rest.notes.email,
                    amount: (rest.amount / 100).toFixed(2),
                    purpose: rest.notes?.purpose || 'General Donation',
                    paymentId: payment_id
                });
            } catch (emailError) {
                logger.error('Error sending emails:', emailError);
                // Don't fail the request if email sending fails
            }
        }
        
        logger.info('Payment verified successfully', { payment_id, order_id });
        
        res.json({
            status: 'success',
            message: 'Payment verified successfully',
            data: {
                payment: paymentData
            }
        });
        
    } catch (error) {
        logger.error('Error verifying payment:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to verify payment',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Serve static files from the parent directory (for the frontend)
app.use(express.static(path.join(__dirname, '..'), {
    maxAge: '1d',
    setHeaders: (res, path) => {
        // Set longer cache for static assets
        if (path.endsWith('.js') || path.endsWith('.css') || path.endsWith('.png') || path.endsWith('.jpg') || path.endsWith('.jpeg') || path.endsWith('.gif') || path.endsWith('.svg')) {
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        }
    }
}));

// Catch-all route to serve index.html for SPA routing
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    
    logger.error(`Error: ${message}`, {
        statusCode,
        path: req.originalUrl,
        method: req.method,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
    
    res.status(statusCode).json({
        status: 'error',
        message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// Handle 404 - Keep this as the last route
app.use((req, res) => {
    res.status(404).json({
        status: 'error',
        message: 'Not Found'
    });
});

// Start server
const server = app.listen(PORT, () => {
    logger.info(`Server is running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    
    // Log environment status
    logger.info('Environment:', {
        node_env: process.env.NODE_ENV,
        razorpay_key: process.env.RAZORPAY_KEY_ID ? 'Set' : 'Not Set',
        razorpay_mode: process.env.RAZORPAY_KEY_ID?.startsWith('rzp_test_') ? 'Test' : 'Live'
    });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    logger.error('UNHANDLED REJECTION! 💥 Shutting down...');
    logger.error(err.name, err.message);
    
    // Gracefully close the server
    server.close(() => {
        process.exit(1);
    });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    logger.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
    logger.error(err.name, err.message);
    
    // Gracefully close the server
    server.close(() => {
        process.exit(1);
    });
});

// Handle SIGTERM (for Heroku, etc.)
process.on('SIGTERM', () => {
    logger.info('👋 SIGTERM RECEIVED. Shutting down gracefully');
    server.close(() => {
        logger.info('💥 Process terminated!');
    });
});

// Export the server for testing
module.exports = server;
