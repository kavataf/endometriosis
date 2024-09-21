const express = require('express');
const braintree = require('braintree');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const nodemailer = require('nodemailer');
const path = require('path');

// Load environment variables from .env file
dotenv.config();

const app = express();
app.use(bodyParser.json());

// Braintree configuration using environment variables
const gateway = new braintree.BraintreeGateway({
  environment: braintree.Environment.Production,
  merchantId: process.env.BRAINTREE_MERCHANT_ID,
  publicKey: process.env.BRAINTREE_PUBLIC_KEY,
  privateKey: process.env.BRAINTREE_PRIVATE_KEY,
});

// Nodemailer configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Serve static files from the views directory
app.use(express.static(path.join(__dirname, 'views')));

// Define the /process-payment endpoint
app.post('/process-payment', (req, res) => {
  const { paymentMethodNonce, amount, email, name } = req.body;

  console.log('Received payment request body:', req.body);

  if (!paymentMethodNonce || !amount) {
    console.error('Invalid payment details:', { paymentMethodNonce, amount });
    return res.status(400).json({ success: false, message: 'Invalid payment details' });
  }

  gateway.transaction.sale({
    amount: amount,
    paymentMethodNonce: paymentMethodNonce,
    options: {
      submitForSettlement: true,
    }
  }, (err, result) => {
    if (err) {
      console.error('Payment error:', err);
      return res.status(500).json({ success: false, message: 'Payment processing failed', error: err });
    }

    // Log the entire result object for detailed debugging
    console.log('Braintree transaction result:', JSON.stringify(result, null, 2));

    // Extracting transaction status details
    const { transaction } = result;
    if (transaction) {
      const { status, processorResponseCode, processorResponseText } = transaction;

      if (result.success && status === 'submitted_for_settlement') {
        // Send email after successful payment
        const mailOptions = {
          from: 'faith kavata <kavatafaith412@gmail.com>',
          to: email,
          subject: 'Payment Successful',
          html: `
          <div style="background-color: #f5f5f5; padding: 20px;">
              <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
                  <div style="text-align: center;">
                      <img src="cid:logo" style="width: 150px; height: auto;" alt="Enthuse Logo">
                  </div>
                  <p>Hi ${name},</p>
                  <p>Thank you for your donation of $${amount}. Your transaction ID is ${transaction.id}.</p>
              </div>
              <div style="text-align: center; margin-top: 20px; padding-top: 10px; border-top: 1px solid #ddd;">
                  
                  <p>Enthuse Office 6, 155 Minories, London, EC3N 1AD.</p>
                  <p>You are receiving this email because you are a registered user of our platform.</p>
                  <p>
                      <a href="https://www.enthuse.com/legal/" target="_blank">Terms of Use</a> | 
                      <a href="https://www.enthuse.com/privacy/" target="_blank">Privacy Policy</a>
                  </p>
                  <p>Enthuse is a registered trademark of Online Giving Ltd, a company registered in England and Wales with number 06886190.</p>
              </div>
          </div>
      `,
      attachments: [
          {
              filename: 'logo.png',
              path: 'https://static.wixstatic.com/media/6b01fc_014072e05aa0408a8a3a5d2fca37276c~mv2.png/v1/crop/x_0,y_25,w_4500,h_1624/fill/w_266,h_96,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/TEF%20logo%20pink_white.png',
              cid: 'logo'
          }
      ]
  };
        
        

        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            console.error('Error sending email:', error);
          } else {
            console.log('Email sent:', info.response);
          }
        });
        res.json({ success: true, message: 'Payment processed successfully', transactionId: transaction.id });
      } else {
        console.error('Transaction failed:', processorResponseCode, processorResponseText);
        res.status(400).json({
          success: false,
          message: processorResponseText,
          processorResponseCode: processorResponseCode,
          processorResponseText: processorResponseText,
          validationErrors: result.errors
        });
      }
    } else {
      res.status(400).json({
        success: false,
        message: 'Transaction failed without transaction details',
        result: result
      });
    }
  });
});

// Generate a client token endpoint
app.get('/client-token', (req, res) => {
  gateway.clientToken.generate({}, (err, response) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.send(response.clientToken);
    }
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
