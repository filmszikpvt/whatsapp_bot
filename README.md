# WhatsApp Bot Setup Instructions for Nuwandi Bamboo Blinds

## Prerequisites

1. **Node.js** (v14 or higher)
2. **WhatsApp Business Account**
3. **Facebook Developer Account**
4. **Meta Business Account**

## Step 1: WhatsApp Business API Setup

### 1.1 Create Facebook App
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app → Business → Next
3. Add WhatsApp product to your app

### 1.2 Configure WhatsApp
1. In your Facebook app, go to WhatsApp → Getting Started
2. Add a phone number (or use the test number provided)
3. Generate an access token
4. Note down:
   - **Phone Number ID**
   - **WhatsApp Business Account ID**  
   - **Access Token**

## Step 2: Bot Installation

### 2.1 Download and Install
```bash
# Clone or download the bot files
mkdir whatsapp-order-bot
cd whatsapp-order-bot

# Copy the bot.js and package.json files to this directory

# Install dependencies
npm install
```

### 2.2 Environment Configuration
Create a `.env` file in the root directory:

```env
# WhatsApp Configuration
WHATSAPP_TOKEN=your_whatsapp_access_token_here
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id_here
VERIFY_TOKEN=your_custom_verify_token_here

# Server Configuration
PORT=3000
BASE_API_URL=http://order.nuwandibambooblinds.lk

# Optional: Add your business details
BUSINESS_NAME=Nuwandi Bamboo Blinds
BUSINESS_PHONE=+94 77 XXX XXXX
BUSINESS_EMAIL=info@nuwandibambooblinds.lk
```

### 2.3 Update Bot Configuration
Edit `bot.js` and replace these values:
```javascript
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const BASE_API_URL = process.env.BASE_API_URL;
```

## Step 3: Webhook Setup

### 3.1 Local Testing (Development)
```bash
# Install ngrok for local testing
npm install -g ngrok

# Start your bot
npm start

# In another terminal, expose your local server
ngrok http 3000
```

### 3.2 Configure Webhook in Facebook
1. Go to WhatsApp → Configuration in your Facebook app
2. Set Webhook URL: `https://your-ngrok-url.ngrok.io/webhook`
3. Set Verify Token: (same as in your .env file)
4. Subscribe to webhook fields:
   - `messages`
   - `message_deliveries`
   - `message_reads`

## Step 4: Production Deployment

### 4.1 Deploy to a Server
Deploy to platforms like:
- **Heroku**: `git push heroku main`
- **DigitalOcean**: Upload files and run `npm start`
- **AWS EC2**: Set up Node.js environment
- **Vercel**: For serverless deployment

### 4.2 Update Webhook URL
Replace ngrok URL with your production URL in Facebook Developer Console.

## Step 5: Testing

### 5.1 Test Messages
Send these messages to your WhatsApp number:
- `hi` - Welcome message
- `help` - Help menu
- `ORD123` - Track order (replace with real order number)
- `track ORD123` - Track order with command
- `search John Doe` - Search orders by name

### 5.2 API Integration Test
Make sure your Laravel API endpoints are working:
```bash
# Test order tracking
curl http://order.nuwandibambooblinds.lk/api/order/ORD123

# Test order search
curl "http://order.nuwandibambooblinds.lk/api/orders/search?q=John"
```

## Step 6: Customization

### 6.1 Modify API Response Format
Update the `formatOrderDetails()` function based on your actual API response structure.

### 6.2 Add More Features
- Order status updates via webhook
- Payment status checking
- Delivery tracking
- Product catalog browsing
- Customer support chat

### 6.3 Multilingual Support
Add Sinhala/Tamil language support:
```javascript
const messages = {
    en: {
        welcome: "Welcome to Nuwandi Bamboo Blinds!",
        // ... other messages
    },
    si: {
        welcome: "නුවන්දී බම්බු අන්ධ වෙත සාදරයෙන් පිළිගනිමු!",
        // ... other messages
    }
};
```

## Step 7: Monitoring and Maintenance

### 7.1 Logging
- Monitor webhook calls
- Track message delivery rates
- Log API errors

### 7.2 Rate Limiting
- WhatsApp has messaging limits
- Implement rate limiting for API calls
- Handle rate limit errors gracefully

### 7.3 Error Handling
- Handle API downtime
- Implement retry mechanisms
- Provide fallback messages

## Security Considerations

1. **Environment Variables**: Never commit tokens to version control
2. **Webhook Verification**: Always verify webhook signatures
3. **API Security**: Implement proper authentication for your APIs
4. **Rate Limiting**: Prevent abuse of your bot
5. **Data Privacy**: Handle customer data securely

## Troubleshooting

### Common Issues:
1. **Webhook not receiving messages**: Check ngrok URL and webhook configuration
2. **API errors**: Verify your Laravel API endpoints are accessible
3. **Token errors**: Ensure WhatsApp access token is valid
4. **Message not sending**: Check phone number format and permissions

### Debug Mode:
Add debug logging to track issues:
```javascript
console.log('Received message:', message);
console.log('API Response:', response.data);
```

## Support

For technical support:
- Check Facebook Developer documentation
- Review WhatsApp Business API documentation
- Test API endpoints directly
- Monitor server logs for errors

## Next Steps

1. Set up production environment
2. Configure SSL certificate for webhook
3. Implement business logic customizations
4. Add analytics and reporting
5. Scale for high message volumes