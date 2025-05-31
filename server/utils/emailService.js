const nodemailer = require('nodemailer');
const logger = require('../config/logger');

class EmailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            service: process.env.EMAIL_SERVICE || 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD
            }
        });
    }

    async sendDonationReceipt(donation) {
        const { name, email, amount, purpose, paymentId } = donation;
        
        const mailOptions = {
            from: `"Noor Charitable Trust" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Thank you for your generous donation!',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #6a1b9a;">Thank you for your donation!</h2>
                    <p>Dear ${name},</p>
                    <p>We are incredibly grateful for your generous donation of ₹${amount} towards ${purpose}.</p>
                    <p>Your support helps us continue our mission to make a positive impact in the community.</p>
                    
                    <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <h3 style="color: #6a1b9a; margin-top: 0;">Donation Details</h3>
                        <p><strong>Amount:</strong> ₹${amount}</p>
                        <p><strong>Purpose:</strong> ${purpose}</p>
                        <p><strong>Payment ID:</strong> ${paymentId}</p>
                        <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
                    </div>
                    
                    <p>This email serves as your receipt for tax purposes. No goods or services were provided in exchange for this contribution.</p>
                    
                    <p>With gratitude,<br>The Noor Charitable Trust Team</p>
                    
                    <div style="margin-top: 30px; font-size: 12px; color: #6c757d; border-top: 1px solid #dee2e6; padding-top: 15px;">
                        <p>Noor Charitable Trust</p>
                        <p>D.NO: 15/273, Ameen Peer Dargah Road, Beside Water Tank, Kadapa, Andhra Pradesh 516001, India</p>
                        <p>Email: noorcharitabletrustforyou@gmail.com | Phone: +91 63018 02653</p>
                    </div>
                </div>
            `
        };

        try {
            await this.transporter.sendMail(mailOptions);
            logger.info(`Donation receipt sent to ${email} for payment ${paymentId}`);
            return true;
        } catch (error) {
            logger.error(`Failed to send donation receipt to ${email}:`, error);
            return false;
        }
    }

    async sendAdminNotification(donation) {
        const { name, email, amount, purpose, paymentId } = donation;
        
        if (!process.env.ADMIN_EMAIL) {
            logger.warn('ADMIN_EMAIL not set, skipping admin notification');
            return false;
        }

        const mailOptions = {
            from: `"Noor Charitable Trust" <${process.env.EMAIL_USER}>`,
            to: process.env.ADMIN_EMAIL,
            subject: `New Donation Received - ₹${amount}`,
            text: `
                New Donation Received
                ---------------------
                
                Amount: ₹${amount}
                Purpose: ${purpose}
                Donor: ${name} (${email})
                Payment ID: ${paymentId}
                Date: ${new Date().toLocaleString()}
                
                This is an automated notification from the Noor Charitable Trust donation system.
            `
        };

        try {
            await this.transporter.sendMail(mailOptions);
            logger.info(`Admin notification sent for payment ${paymentId}`);
            return true;
        } catch (error) {
            logger.error('Failed to send admin notification:', error);
            return false;
        }
    }
}

module.exports = new EmailService();
