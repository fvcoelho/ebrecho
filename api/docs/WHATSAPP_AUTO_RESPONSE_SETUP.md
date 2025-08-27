# WhatsApp Auto-Response System Configuration Guide

## 📋 Overview
The WhatsApp auto-response system automatically responds to incoming messages with time-appropriate Brazilian greetings and the partner's business name. This guide covers the final configuration steps needed for production deployment.

## 🚀 Quick Start Checklist

### ✅ Already Implemented
- [x] Event-driven architecture with Redis pub/sub
- [x] Brazilian timezone support (America/Sao_Paulo)
- [x] Time-based greetings (Bom dia, Boa tarde, Boa noite)
- [x] Database schema with auto-response tracking
- [x] Serverless function for Vercel deployment
- [x] Non-blocking webhook processing
- [x] Deduplication logic (5-minute cooldown)
- [x] Database fallback when Redis unavailable

### 🔧 Configuration Required

## 1️⃣ Upstash Redis Setup (Required for Production)

### Step 1: Create Upstash Account
1. Go to [https://console.upstash.com/](https://console.upstash.com/)
2. Sign up for a free account (or log in)
3. Create a new Redis database:
   - Name: `ebrecho-whatsapp-queue`
   - Region: Choose closest to your deployment (e.g., `us-east-1`)
   - Type: Regional (for lower latency)

### Step 2: Get Credentials
1. In your Upstash database dashboard, find:
   - **REST URL**: `https://your-database.upstash.io`
   - **REST Token**: Long base64 encoded string
2. Copy these values

### Step 3: Update Environment Variables
```bash
# In /api/.env (Development)
UPSTASH_REDIS_REST_URL=https://your-actual-database.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-actual-token-here

# Optional: Job security token
AUTO_RESPONSE_JOB_TOKEN=generate-a-secure-random-string-here
```

### Step 4: Vercel Production Setup
1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add the same Redis credentials for Production environment

## 2️⃣ WhatsApp Cloud API Token Renewal

### Current Issue
The WhatsApp access token has expired. You need to generate a new long-lived token.

### Steps to Renew Token:
1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Navigate to your WhatsApp Business App
3. Go to WhatsApp → API Setup
4. Generate a new **Permanent Access Token**:
   - Click "Generate" under Access Tokens
   - For production, use System User tokens (60-day expiry)
   - For longer tokens, implement token refresh logic

### Update Token:
```bash
# In /api/.env
WHATSAPP_ACCESS_TOKEN=your-new-whatsapp-token-here
```

## 3️⃣ Partner Configuration

### Enable Auto-Response per Partner
```sql
-- Enable auto-response for specific partner
UPDATE "Partner" 
SET "autoResponseEnabled" = true,
    "whatsappName" = 'Your Business Name'
WHERE id = 'partner-id-here';

-- Optional: Set custom greeting template
UPDATE "Partner"
SET "customGreetingTemplate" = 'Olá! {partnerName} agradece seu contato.'
WHERE id = 'partner-id-here';
```

### Custom Greeting Templates
Partners can use these placeholders in custom templates:
- `{partnerName}` - Replaced with partner's WhatsApp name
- `{morning}` - Morning greeting
- `{afternoon}` - Afternoon greeting  
- `{night}` - Night greeting

Example:
```sql
UPDATE "Partner"
SET "customGreetingTemplate" = '👋 {morning} Bem-vindo à {partnerName}! Como posso ajudar?'
WHERE id = 'partner-id-here';
```

## 4️⃣ Vercel Deployment Configuration

### Update vercel.json (Already configured)
```json
{
  "crons": [
    {
      "path": "/jobs/whatsapp-autoresponse",
      "schedule": "*/2 * * * *"  // Runs every 2 minutes
    }
  ]
}
```

### Deploy to Vercel
```bash
# From /api directory
npm run build:vercel
npm run deploy:vercel
```

### Verify Cron Job
1. Go to Vercel Dashboard → Functions → Crons
2. You should see `whatsapp-autoresponse` scheduled
3. Check logs to ensure it's running

## 5️⃣ Testing the Complete System

### Test Webhook Processing
```bash
# Send test message to webhook
curl -X POST http://localhost:3001/api/whatsapp/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "object": "whatsapp_business_account",
    "entry": [{
      "id": "YOUR_BUSINESS_ACCOUNT_ID",
      "changes": [{
        "value": {
          "messaging_product": "whatsapp",
          "metadata": {
            "display_phone_number": "15551234567",
            "phone_number_id": "YOUR_PHONE_NUMBER_ID"
          },
          "messages": [{
            "from": "5511999887766",
            "id": "wamid.test_$(date +%s)",
            "timestamp": "'$(date +%s)'",
            "text": {"body": "Test message"},
            "type": "text"
          }]
        },
        "field": "messages"
      }]
    }]
  }'
```

### Test Auto-Response Processing (Development)
```bash
# Manually trigger auto-response processing
curl -X POST http://localhost:3001/api/dev/test-auto-response

# Check health status
curl http://localhost:3001/api/dev/auto-response-health
```

## 6️⃣ Monitoring & Maintenance

### Check System Health
```javascript
// GET /api/dev/auto-response-health
{
  "success": true,
  "health": {
    "redis": true,    // Redis connectivity
    "database": true  // Database connectivity
  }
}
```

### Monitor Failed Messages
```sql
-- Find messages without auto-responses
SELECT * FROM "WhatsAppMessage"
WHERE direction = 'inbound'
  AND "autoResponseSent" IS NULL
  AND "createdAt" > NOW() - INTERVAL '1 day';

-- Check auto-response metrics
SELECT 
  DATE("createdAt") as date,
  COUNT(*) as total_messages,
  COUNT("autoResponseSent") as responses_sent,
  AVG(EXTRACT(EPOCH FROM ("autoResponseAt" - "createdAt"))) as avg_response_time_seconds
FROM "WhatsAppMessage"
WHERE direction = 'inbound'
GROUP BY DATE("createdAt")
ORDER BY date DESC;
```

### Clear Old Messages (Optional)
```sql
-- Clean up old processed messages (older than 30 days)
DELETE FROM "WhatsAppMessage"
WHERE "createdAt" < NOW() - INTERVAL '30 days'
  AND "autoResponseSent" = true;
```

## 7️⃣ Advanced Configuration

### Adjust Response Timing
```typescript
// In /api/src/services/auto-response.service.ts
// Change deduplication window (currently 5 minutes)
const wasRecentlyProcessed = await RedisService.wasRecentlyProcessed(
  event.fromNumber, 
  event.partnerId, 
  10 // Change to 10 minutes
);
```

### Customize Greeting Times
```typescript
// In /api/src/services/auto-response.service.ts
// Adjust time ranges for greetings
if (hour >= 5 && hour < 12) {        // Morning: 5:00 - 11:59
  greeting = this.defaultTemplate.morning;
} else if (hour >= 12 && hour < 18) { // Afternoon: 12:00 - 17:59
  greeting = this.defaultTemplate.afternoon;
} else {                              // Night: 18:00 - 4:59
  greeting = this.defaultTemplate.night;
}
```

### Rate Limiting
```typescript
// Add rate limiting per phone number
const RATE_LIMIT = 10; // Max auto-responses per hour
const RATE_WINDOW = 3600; // 1 hour in seconds

// Check rate limit before sending
const messageCount = await RedisService.getMessageCount(fromNumber);
if (messageCount >= RATE_LIMIT) {
  console.log(`Rate limit exceeded for ${fromNumber}`);
  return;
}
```

## 8️⃣ Troubleshooting

### Common Issues and Solutions

#### Redis Connection Failed
- **Symptom**: "getaddrinfo ENOTFOUND" errors
- **Solution**: Verify Upstash credentials are correct
- **Fallback**: System uses database polling (still works)

#### WhatsApp Token Expired
- **Symptom**: "Session has expired" errors
- **Solution**: Generate new token from Meta Developer Console

#### Auto-Responses Not Sending
- **Check**:
  1. Partner has `autoResponseEnabled = true`
  2. WhatsApp token is valid
  3. Redis/Database connectivity
  4. Vercel cron job is running

#### Duplicate Responses
- **Cause**: Multiple webhook calls or processing
- **Solution**: Deduplication logic prevents this (5-min window)

## 9️⃣ Security Best Practices

1. **Secure Job Endpoint**:
   ```bash
   # Set in environment
   AUTO_RESPONSE_JOB_TOKEN=your-secure-token
   
   # Call with authorization
   curl -X POST https://your-api.vercel.app/jobs/whatsapp-autoresponse \
     -H "Authorization: Bearer your-secure-token"
   ```

2. **Webhook Signature Verification**:
   - Implement Meta's webhook signature verification
   - Validate `X-Hub-Signature-256` header

3. **Rate Limiting**:
   - Implement per-number rate limits
   - Add global rate limits for protection

4. **Monitoring**:
   - Set up alerts for failed responses
   - Monitor Redis queue size
   - Track response times

## 📊 Production Readiness Checklist

- [ ] Upstash Redis configured with real credentials
- [ ] WhatsApp access token renewed and updated
- [ ] Environment variables set in Vercel
- [ ] Webhook URL registered with Meta
- [ ] Auto-response enabled for partners
- [ ] Cron job verified in Vercel
- [ ] Monitoring alerts configured
- [ ] Rate limiting implemented
- [ ] Security tokens set
- [ ] Tested end-to-end flow

## 🎉 Launch Steps

1. Complete all configuration items above
2. Deploy to Vercel: `npm run deploy:vercel`
3. Register webhook URL with Meta: `https://your-api.vercel.app/api/whatsapp/webhook`
4. Send test message to WhatsApp number
5. Verify auto-response received
6. Monitor logs for first 24 hours

## 📞 Support

For issues or questions:
- Check Vercel function logs for errors
- Review Redis queue status in Upstash console
- Verify database records for message tracking
- Test with development endpoint first

---

*Last Updated: August 26, 2025*
*Version: 1.0.0*