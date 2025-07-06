const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const axios = require('axios');
const express = require('express');
const path = require('path');
require('dotenv').config();

// Express app for health checks and web interface
const app = express();
app.use(express.static('public'));
app.use(express.json());

// Configuration
const BASE_API_URL = process.env.BASE_API_URL || 'http://order.nuwandibambooblinds.lk';
const PORT = process.env.PORT || 3000;

// WhatsApp Client with session storage
const client = new Client({
    authStrategy: new LocalAuth({
        clientId: "nuwandi-bamboo-bot"
    }),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu'
        ]
    }
});

// QR Code generation
client.on('qr', (qr) => {
    console.log('🔷 QR Code Generated!');
    console.log('📱 Open WhatsApp on your phone');
    console.log('⚙️  Go to Settings > Linked Devices');
    console.log('📷 Scan this QR code:');
    console.log('');
    qrcode.generate(qr, { small: true });
    console.log('');
    console.log('💡 After scanning, your bot will be ready!');
});

// Client ready
client.on('ready', () => {
    console.log('✅ WhatsApp bot is ready!');
    console.log('📱 Bot is now connected to your WhatsApp account');
    console.log('🌐 Web interface: http://localhost:' + PORT);
    console.log('');
    console.log('🤖 Bot Commands:');
    console.log('   • hi/hello - Welcome message');
    console.log('   • track [order_number] - Track order');
    console.log('   • support - Get contact information');
    console.log('   • help - Show help menu');
    console.log('');
});

// Authentication success
client.on('authenticated', () => {
    console.log('🔐 WhatsApp authentication successful!');
});

// Authentication failure
client.on('auth_failure', (msg) => {
    console.error('❌ Authentication failed:', msg);
});

// Client disconnected
client.on('disconnected', (reason) => {
    console.log('🔌 WhatsApp disconnected:', reason);
});

// Handle incoming messages
client.on('message', async (message) => {
    try {
        // Skip messages from groups and status updates
        if (message.from.includes('@g.us') || message.from.includes('status@broadcast')) {
            return;
        }

        // Get contact info
        const contact = await message.getContact();
        const chat = await message.getChat();
        const messageBody = message.body.toLowerCase().trim();
        
        console.log(`📨 Message from ${contact.name || contact.number}: ${message.body}`);

        // Handle different message types
        if (messageBody === 'hi' || messageBody === 'hello' || messageBody === 'start') {
            await handleWelcomeMessage(message, contact);
        }
        else if (messageBody === 'help' || messageBody === 'menu') {
            await handleHelpMessage(message);
        }
        else if (messageBody === 'support' || messageBody === 'contact' || messageBody === 'contact us') {
            await handleSupportMessage(message);
        }
        else if (messageBody.startsWith('track ')) {
            const orderNumber = messageBody.replace('track ', '').trim();
            await handleTrackOrder(message, orderNumber);
        }
        else if (isOrderNumber(messageBody)) {
            await handleTrackOrder(message, messageBody);
        }
        else {
            await handleDefaultMessage(message);
        }

    } catch (error) {
        console.error('❌ Error handling message:', error);
        await message.reply('Sorry, there was an error processing your message. Please try again.');
    }
});

// Handle welcome message
async function handleWelcomeMessage(message, contact) {
    const welcomeText = `Hello ${contact.name || 'there'}! 👋

Welcome to *Nuwandi Bamboo Blinds* order tracking service! 🎋

Here's what you can do:
📦 *Track Order*: Send your order number or type "track [order_number]"
📞 *Support*: Type "support" for contact information
❓ *Help*: Type "help" for more options

Just send your order number to get started! 🚀

Example: Send "ORD123" or "track ORD123"`;

    await message.reply(welcomeText);
}

// Handle help message
async function handleHelpMessage(message) {
    const helpText = `*🤖 Bot Commands Help:*

1️⃣ *Track specific order*:
   • Send: "track ORD123"
   • Or just: "ORD123"

2️⃣ *Get support*:
   • Send: "support" or "contact"

3️⃣ *Get help*:
   • Send: "help" or "menu"

4️⃣ *Start over*:
   • Send: "hi" or "hello"

💡 *Tips:*
• Order numbers are usually alphanumeric (e.g., ORD123, INV456)
• All commands are case-insensitive

🏢 *Business Hours:* Monday - Saturday, 9:00 AM - 6:00 PM
📞 *Support:* 077 122 9598
🌐 *Website:* https://nuwandibambooblinds.lk/`;

    await message.reply(helpText);
}

// Handle support message
async function handleSupportMessage(message) {
    const supportText = `📞 *Contact & Support Information*

🏢 *Nuwandi Bamboo Blinds*

📱 *Phone:* 077 122 9598
📧 *Email:* nuwandhibambooblinds@gmail.com
🌐 *Website:* https://nuwandibambooblinds.lk/

🕐 *Business Hours:*
Monday - Saturday: 9:00 AM - 6:00 PM
Sunday: Closed

💬 *How to reach us:*
• Call us during business hours
• Send us an email anytime
• Visit our website for more information
• Continue chatting here for order tracking

🎋 *What we do:*
• Custom bamboo blinds
• Window treatments
• Interior design solutions
• Professional installation services

Need immediate help? Call us at 077 122 9598! 📞`;

    await message.reply(supportText);
}

// Handle track order
async function handleTrackOrder(message, orderNumber) {
    try {
        // Send "typing" indicator
        const chat = await message.getChat();
        await chat.sendStateTyping();

        console.log(`🔍 Tracking order: ${orderNumber}`);
        
        const response = await axios.get(`${BASE_API_URL}/api/order/${orderNumber}`);
        const orderData = response.data;

        if (orderData && orderData.success) {
            const orderText = formatOrderDetails(orderData.order);
            await message.reply(orderText);
        } else {
            await message.reply(`❌ *Order Not Found*\n\nOrder "${orderNumber}" could not be found in our system.\n\n💡 *Please check:*\n• Order number spelling\n• Order number format\n• Contact us if you need assistance\n\n📞 Support: 077 122 9598`);
        }
    } catch (error) {
        console.error('❌ Error tracking order:', error.message);
        
        if (error.response?.status === 404) {
            await message.reply(`❌ *Order Not Found*\n\nOrder "${orderNumber}" was not found.\n\n💡 Please verify your order number and try again.\n\n📞 Need help? Contact: 077 122 9598`);
        } else {
            await message.reply(`❌ *Service Temporarily Unavailable*\n\nSorry, we're experiencing technical difficulties.\n\n🔄 Please try again in a few moments.\n📞 If the issue persists, contact: 077 122 9598`);
        }
    }
}

// Handle search orders
async function handleSearchOrders(message, searchTerm) {
    try {
        const chat = await message.getChat();
        await chat.sendStateTyping();

        console.log(`🔍 Searching orders for: ${searchTerm}`);
        
        const response = await axios.get(`${BASE_API_URL}/api/orders/search`, {
            params: { q: searchTerm }
        });
        
        const searchData = response.data;

        if (searchData && searchData.success && searchData.orders && searchData.orders.length > 0) {
            const orders = searchData.orders;
            let resultText = `🔍 *Search Results for "${searchTerm}":*\n\n`;
            
            orders.slice(0, 5).forEach((order, index) => {
                resultText += `${index + 1}. *${order.order_number}*\n`;
                resultText += `   Status: ${getStatusEmoji(order.status)} ${order.status}\n`;
                resultText += `   Date: ${formatDate(order.created_at)}\n`;
                if (order.total_amount) {
                    resultText += `   Amount: Rs. ${order.total_amount}\n`;
                }
                resultText += `\n`;
            });
            
            if (orders.length > 5) {
                resultText += `... and ${orders.length - 5} more orders\n\n`;
            }
            
            resultText += `💡 *Tip:* Send any order number to get full details!\n`;
            resultText += `📞 For more orders, contact: 077 122 9598`;
            
            await message.reply(resultText);
        } else {
            await message.reply(`❌ *No Orders Found*\n\nNo orders found for "${searchTerm}".\n\n💡 *Try searching with:*\n• Full name (e.g., "John Doe")\n• Phone number (e.g., "0771234567")\n• Email address\n\n📞 Need help? Contact: 077 122 9598`);
        }
    } catch (error) {
        console.error('❌ Error searching orders:', error.message);
        await message.reply(`❌ *Search Error*\n\nSorry, there was an error searching for orders.\n\n🔄 Please try again in a few moments.\n📞 If the issue persists, contact: 077 122 9598`);
    }
}

// Handle bot status
async function handleBotStatus(message) {
    const uptime = process.uptime();
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    
    const statusText = `🤖 *Bot Status*\n\n✅ *Status:* Online & Active\n⏱️ *Uptime:* ${hours}h ${minutes}m\n🔗 *API:* Connected\n📱 *WhatsApp:* Connected\n\n🕐 *Last Update:* ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Colombo' })}\n\n💡 All systems operational!`;
    
    await message.reply(statusText);
}

// Handle default message
async function handleDefaultMessage(message) {
    const defaultText = `🤖 *I didn't understand that command.*\n\n💡 *Try these:*\n• Send your order number (e.g., "ORD123")\n• Type "help" for all commands\n• Type "support" for contact info\n• Type "hi" to start over\n\n📞 Need human help? Contact: 077 122 9598`;
    
    await message.reply(defaultText);
}

// Check if string looks like an order number
function isOrderNumber(str) {
    return /^[A-Za-z0-9]{3,}$/.test(str) && str.length >= 3;
}

// Format order details
function formatOrderDetails(order) {
    const status = order.order_status || 'Unknown';
    const statusEmoji = getStatusEmoji(status);
    
    let orderText = `📦 *Order Details*\n\n`;
    orderText += `*Order Number:* ${order.order_number}\n`;
    orderText += `*Status:* ${statusEmoji} ${status.charAt(0).toUpperCase() + status.slice(1)}\n`;
    
    // Customer information
    const customerName = `${order.customer_first_name || ''} ${order.customer_last_name || ''}`.trim();
    if (customerName) {
        orderText += `*Customer:* ${customerName}\n`;
    }
    
    if (order.customer_email) {
        orderText += `*Email:* ${order.customer_email}\n`;
    }
    
    if (order.phone_number) {
        orderText += `*Phone:* ${order.phone_number}\n`;
    }
    
    if (order.customer_address) {
        orderText += `*Address:* ${order.customer_address}\n`;
    }
    
    // Order dates
    if (order.created_at) {
        orderText += `*Order Date:* ${formatDate(order.created_at)}\n`;
    }
    
    // Product information
    if (order.product_type) {
        orderText += `*Product Type:* ${order.product_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}\n`;
    }
    
    if (order.product_material) {
        orderText += `*Material:* ${order.product_material}\n`;
    }
    
    if (order.full_area) {
        orderText += `*Area:* ${order.full_area} sq ft\n`;
    }
    
    if (order.delivery_method) {
        orderText += `*Delivery:* ${order.delivery_method.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}\n`;
    }
    
    // Pricing information
    orderText += `\n💰 *Pricing:*\n`;
    if (order.price) {
        orderText += `*Original Price:* Rs. ${parseFloat(order.price).toLocaleString()}\n`;
    }
    
    if (order.discount && parseFloat(order.discount) > 0) {
        orderText += `*Discount:* Rs. ${parseFloat(order.discount).toLocaleString()}\n`;
    }
    
    if (order.final_amount) {
        orderText += `*Final Amount:* Rs. ${parseFloat(order.final_amount).toLocaleString()}\n`;
    }
    
    // Payment information
    if (order.payment_type) {
        orderText += `\n💳 *Payment:*\n`;
        orderText += `*Payment Type:* ${order.payment_type.charAt(0).toUpperCase() + order.payment_type.slice(1)}\n`;
        
        if (order.payment_type === 'installment') {
            // First installment
            if (order.first_installment) {
                const firstStatus = order.first_installment_status || 'pending';
                const firstEmoji = firstStatus === 'paid' ? '✅' : '⏳';
                orderText += `*1st Installment:* ${firstEmoji} Rs. ${parseFloat(order.first_installment).toLocaleString()} (${firstStatus})\n`;
                
                if (order.first_installment_paid_date && firstStatus === 'paid') {
                    orderText += `*Paid Date:* ${formatDate(order.first_installment_paid_date)}\n`;
                }
            }
            
            // Second installment
            if (order.second_installment) {
                const secondStatus = order.second_installment_status || 'pending';
                const secondEmoji = secondStatus === 'paid' ? '✅' : '⏳';
                orderText += `*2nd Installment:* ${secondEmoji} Rs. ${parseFloat(order.second_installment).toLocaleString()} (${secondStatus})\n`;
                
                if (order.second_installment_paid_date && secondStatus === 'paid') {
                    orderText += `*Paid Date:* ${formatDate(order.second_installment_paid_date)}\n`;
                }
            }
        }
    }
    
    if (order.product_description) {
        orderText += `\n📝 *Description:* ${order.product_description}\n`;
    }
    
    orderText += `\n📱 *Questions?* Reply to this chat or contact: 077 122 9598\n🌐 *Website:* https://nuwandibambooblinds.lk/`;
    
    return orderText;
}

// Get status emoji
function getStatusEmoji(status) {
    const statusLower = status.toLowerCase();
    switch (statusLower) {
        case 'pending':
            return '⏳';
        case 'processing':
            return '🔄';
        case 'confirmed':
            return '✅';
        case 'shipped':
        case 'dispatched':
            return '🚚';
        case 'out for delivery':
            return '🏃‍♂️';
        case 'delivered':
            return '📦';
        case 'completed':
            return '🎉';
        case 'cancelled':
            return '❌';
        case 'refunded':
            return '💰';
        case 'in_production':
        case 'manufacturing':
            return '🔨';
        case 'ready_for_delivery':
            return '📋';
        default:
            return '📋';
    }
}

// Format date
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            timeZone: 'Asia/Colombo'
        });
    } catch (error) {
        return dateString;
    }
}

// Web interface routes
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Nuwandi Bamboo Blinds - WhatsApp Bot</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
                .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                h1 { color: #25D366; text-align: center; }
                .status { padding: 15px; border-radius: 5px; margin: 20px 0; }
                .online { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
                .offline { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
                .info { background: #d1ecf1; color: #0c5460; border: 1px solid #bee5eb; }
                .commands { background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0; }
                .command { margin: 10px 0; padding: 10px; background: white; border-radius: 3px; }
                .footer { text-align: center; margin-top: 30px; color: #666; }
                .contact { background: #fff3cd; color: #856404; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🎋 Nuwandi Bamboo Blinds - WhatsApp Bot</h1>
                
                <div class="status online">
                    <strong>✅ Bot Status:</strong> Online & Active<br>
                    <strong>🕐 Started:</strong> ${new Date().toLocaleString()}
                </div>

                <div class="contact">
                    <strong>📞 Support Contact:</strong><br>
                    Phone: 077 122 9598<br>
                    Email: nuwandhibambooblinds@gmail.com<br>
                    Website: https://nuwandibambooblinds.lk/
                </div>

                <div class="info">
                    <strong>📱 How to Use:</strong><br>
                    1. Save this number in your contacts<br>
                    2. Send a WhatsApp message<br>
                    3. Start with "hi" or send your order number
                </div>

                <div class="commands">
                    <h3>🤖 Available Commands:</h3>
                    <div class="command"><strong>hi/hello</strong> - Welcome message</div>
                    <div class="command"><strong>track ORD123</strong> - Track specific order</div>
                    <div class="command"><strong>ORD123</strong> - Direct order tracking</div>
                    <div class="command"><strong>support</strong> - Get contact information</div>
                    <div class="command"><strong>help</strong> - Show all commands</div>
                </div>

                <div class="footer">
                    <p>🌐 <a href="https://nuwandibambooblinds.lk/" target="_blank">Visit Our Website</a></p>
                    <p>© 2024 Nuwandi Bamboo Blinds</p>
                </div>
            </div>
        </body>
        </html>
    `);
});

app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        connected: client.info ? true : false
    });
});

// Start the web server
app.listen(PORT, () => {
    console.log(`🌐 Web interface running on http://localhost:${PORT}`);
});

// Initialize WhatsApp client
console.log('🚀 Starting WhatsApp Bot...');
console.log('📱 Please wait for QR code to appear...');
client.initialize();

// Handle process termination
process.on('SIGINT', async () => {
    console.log('🔄 Shutting down bot...');
    await client.destroy();
    process.exit(0);
});

module.exports = { client, app };