# Noor Charitable Trust - Backend Server

This is the secure, production-ready backend server for Noor Charitable Trust's website, handling Razorpay payment integration, email notifications, and other server-side functionality.

## 🚀 Features

- 💳 Secure Razorpay payment integration
- ✉️ Automated email receipts for donors
- 🔔 Admin notifications for new donations
- 📊 Comprehensive logging and error tracking
- 🔒 Security best practices (CORS, rate limiting, input sanitization)
- 📱 RESTful API design
- 🛡️ Protection against common web vulnerabilities

## 📋 Prerequisites

- Node.js (v14 or higher)
- npm (comes with Node.js)
- Razorpay account with API keys
- Email service credentials (Gmail, SendGrid, etc.)

## 🛠️ Setup Instructions

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/nooricharitabletrust.git
   cd nooricharitabletrust/server
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit the `.env` file with your configuration. See [Configuration](#-configuration) for details.

4. **Start the Server**
   - Development mode with hot-reload:
     ```bash
     npm run dev
     ```
   - Production mode:
     ```bash
     npm start
     ```
   - Debug mode:
     ```bash
     npm run dev:debug
     ```

5. **Verify Installation**
   Visit `http://localhost:3000/api/health` in your browser or use cURL:
   ```bash
   curl http://localhost:3000/api/health
   ```

## 🔧 Configuration

Copy `.env.example` to `.env` and configure the following variables:

### Server
- `PORT` - Port to run the server on (default: 3000)
- `NODE_ENV` - Environment (development, production, etc.)
- `JWT_SECRET` - Secret for JWT tokens (generate a secure random string)
- `COOKIE_SECRET` - Secret for signing cookies (generate a secure random string)

### Razorpay
- `RAZORPAY_KEY_ID` - Your Razorpay API key ID
- `RAZORPAY_KEY_SECRET` - Your Razorpay API key secret

### Email (for receipts and notifications)
- `EMAIL_SERVICE` - Email service provider (e.g., 'gmail', 'sendgrid')
- `EMAIL_USER` - Email address to send from
- `EMAIL_PASSWORD` - Email password or API key
- `ADMIN_EMAIL` - Email to send admin notifications to

### Rate Limiting
- `RATE_LIMIT_WINDOW_MS` - Rate limit window in milliseconds (default: 15 minutes)
- `RATE_LIMIT_MAX` - Maximum requests per window per IP (default: 100)
- `PAYMENT_RATE_LIMIT_MAX` - Stricter limit for payment endpoints (default: 10)

## 📚 API Documentation

### Base URL
All endpoints are prefixed with `/api`

### Health Check
- `GET /health` - Check if the server is running
  - Response:
    ```json
    {
      "status": "Server is running",
      "timestamp": "2023-06-01T12:00:00.000Z",
      "env": "development",
      "razorpay": {
        "keyId": "Set",
        "testMode": "Yes"
      }
    }
    ```

### Create Order
- `POST /create-order` - Create a new Razorpay order
  - Headers: `Content-Type: application/json`
  - Request body:
    ```json
    {
      "amount": 1000,
      "currency": "INR",
      "notes": {
        "name": "John Doe",
        "email": "john@example.com",
        "phone": "+919876543210",
        "purpose": "General Donation"
      }
    }
    ```
  - Response (success):
    ```json
    {
      "status": "success",
      "data": {
        "order": {
          "id": "order_1234567890",
          "entity": "order",
          "amount": 1000,
          "amount_paid": 0,
          "amount_due": 1000,
          "currency": "INR",
          "receipt": "donion_12345",
          "status": "created",
          "attempts": 0,
          "notes": {
            "name": "John Doe",
            "email": "john@example.com"
          },
          "created_at": 1617703832
        }
      }
    }
    ```

### Verify Payment
- `POST /verify-payment` - Verify a payment signature
  - Headers: `Content-Type: application/json`
  - Request body:
    ```json
    {
      "order_id": "order_1234567890",
      "payment_id": "pay_1234567890",
      "signature": "signature_1234567890",
      "amount": 1000,
      "currency": "INR",
      "notes": {
        "name": "John Doe",
        "email": "john@example.com",
        "purpose": "General Donation"
      }
    }
    ```
  - Response (success):
    ```json
    {
      "status": "success",
      "message": "Payment verified successfully",
      "data": {
        "payment": {
          "order_id": "order_1234567890",
          "payment_id": "pay_1234567890",
          "signature": "signature_1234567890",
          "timestamp": "2023-06-01T12:05:30.000Z",
          "status": "verified",
          "amount": 1000,
          "currency": "INR",
          "notes": {
            "name": "John Doe",
            "email": "john@example.com",
            "purpose": "General Donation"
          }
        }
      }
    }
    ```

## 🔒 Security

### Best Practices
- Always use HTTPS in production
- Never commit `.env` files to version control
- Rotate API keys and secrets regularly
- Keep dependencies up to date
- Monitor logs for suspicious activity

### Rate Limiting
- General API endpoints: 100 requests per 15 minutes per IP
- Payment endpoints: 10 requests per hour per IP

### Input Validation
All user input is validated and sanitized to prevent common attacks:
- SQL/NoSQL injection
- XSS (Cross-Site Scripting)
- Parameter pollution
- HTTP Parameter Pollution

## 📦 Deployment

### Prerequisites
- Node.js 14+ installed on the server
- PM2 or similar process manager (recommended)
- Nginx or Apache as a reverse proxy (recommended)
- SSL certificate (Let's Encrypt recommended)

### Steps
1. **Set up the server**
   ```bash
   # Clone the repository
   git clone https://github.com/yourusername/nooricharitabletrust.git
   cd nooricharitabletrust/server
   
   # Install dependencies
   npm install --production
   
   # Configure environment variables
   cp .env.example .env
   nano .env  # Edit with your configuration
   ```

2. **Start with PM2**
   ```bash
   # Install PM2 globally
   npm install -g pm2
   
   # Start the application
   NODE_ENV=production pm2 start server.js --name "noor-charity"
   
   # Set up startup script
   pm2 startup
   pm2 save
   ```

3. **Set up Nginx** (example configuration)
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com www.yourdomain.com;
       return 301 https://$host$request_uri;
   }
   
   server {
       listen 443 ssl http2;
       server_name yourdomain.com www.yourdomain.com;
       
       ssl_certificate /path/to/your/cert.pem;
       ssl_certificate_key /path/to/your/privkey.pem;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```

## 🐛 Debugging

### Logs
Logs are stored in the `logs/` directory with daily rotation:
- `combined.log` - All logs
- `error.log` - Error logs only

### Common Issues
- **Razorpay authentication failed**: Check your API keys in `.env`
- **Email not sending**: Verify email credentials and check spam folder
- **CORS errors**: Update `CORS_ORIGIN` in `.env` with your frontend URL

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Razorpay](https://razorpay.com/) for their excellent payment gateway
- All the amazing open source libraries used in this project
- The Noor Charitable Trust team for their dedication to helping others
