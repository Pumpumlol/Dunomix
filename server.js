const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const app = express();
app.use(bodyParser.json());

const port = process.env.PORT || 3000;

// M-Pesa Sandbox Credentials
const consumerKey = 'lfoWDPt6gq455n6l87Hv2Rag6GCGEVqTi3yrGGv7KZtlmhwK';
const consumerSecret = 'VcNaqrAV7KHODZIrTS7pI5U61sTcyA7LJORcv2CiDF03Se3RaCsfw7cG8Z0SpfIH';

const shortcode = '174379'; // Sandbox paybill
const passkey = 'bfb279f9aa9bdbcf113b1f6b459ede5b1c0f7cd2f7b3e8a78b7d5a5d1f8a2cd52';
const callbackURL = 'https://yourdomain.com/callback'; // Use a real URL in production

// Get access token
async function getAccessToken() {
  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
  const response = await axios.get('https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
    headers: { Authorization: `Basic ${auth}` },
  });
  return response.data.access_token;
}

// STK Push route
app.post('/api/mpesa', async (req, res) => {
  try {
    const { phone, amount } = req.body;
    const accessToken = await getAccessToken();

    const timestamp = new Date()
      .toISOString()
      .replace(/[^0-9]/g, '')
      .slice(0, 14);

    const password = Buffer.from(shortcode + passkey + timestamp).toString('base64');

    const payload = {
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: amount,
      PartyA: phone,
      PartyB: shortcode,
      PhoneNumber: phone,
      CallBackURL: callbackURL,
      AccountReference: 'DunomixOrder',
      TransactionDesc: 'Purchase from Dunomix',
    };

    const response = await axios.post('https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest', payload, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('M-Pesa STK Request:', response.data);
    res.status(200).json({ success: true, data: response.data });
  } catch (error) {
    console.error('M-Pesa Error:', error.response?.data || error.message);
    res.status(500).json({ success: false, message: 'STK Push failed', error: error.message });
  }
});

app.listen(port, () => {
  console.log(`M-Pesa API running on http://localhost:${port}`);
});
