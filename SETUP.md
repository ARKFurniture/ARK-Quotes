# ARK Furniture Quote System — Setup Guide

## What you're deploying

A Node.js backend on Fly.io that:
- Receives emails from Zapier
- Calls the Claude AI to analyze photos + messages
- Builds branded HTML quotes using your pricing
- Holds quotes for your approval via a dashboard
- Sends approved quotes from info@arkfurniture.ca

---

## Step 1 — Microsoft 365 App Password

Microsoft 365 blocks basic SMTP by default. You need an App Password.

1. Go to https://account.microsoft.com/security
2. Click "Advanced security options"
3. Under "App passwords", click "Create a new app password"
4. Name it "ARK Quotes"
5. Copy the generated password — you'll need it below

> If you don't see App Passwords, your Microsoft 365 admin needs to enable
> "Allow users to create app passwords" in the M365 admin center.

---

## Step 2 — Get your Anthropic API key

1. Go to https://console.anthropic.com
2. Click "API Keys" → "Create Key"
3. Copy the key

---

## Step 3 — Set up the project locally

```bash
# Clone from GitHub (after you push)
git clone https://github.com/YOUR_USERNAME/ark-quotes.git
cd ark-quotes

# Install dependencies
npm install

# Create your .env file
cp .env.example .env
```

Edit `.env` and fill in:
- `ANTHROPIC_API_KEY` — from Step 2
- `OUTLOOK_EMAIL` — info@arkfurniture.ca
- `OUTLOOK_PASSWORD` — App password from Step 1
- `DASHBOARD_API_KEY` — generate a strong random string (e.g. go to randomkeygen.com → Fort Knox Passwords)
- `DASHBOARD_URL` — https://ark-quotes.fly.dev (or whatever you name your Fly app)

---

## Step 4 — Test locally

```bash
npm run dev
```

Visit http://localhost:3000 — you should see the dashboard login.
Enter your `DASHBOARD_API_KEY` to log in.

Test the endpoint manually:
```bash
curl -X POST http://localhost:3000/process-email \
  -H "Content-Type: application/json" \
  -d '{
    "customer_name": "Test Customer",
    "customer_email": "test@example.com",
    "message": "I have a dresser I want painted white",
    "image_base64": "BASE64_IMAGE_HERE",
    "image_media_type": "image/jpeg"
  }'
```

---

## Step 5 — Push to GitHub

```bash
git init
git add .
git commit -m "Initial ARK Furniture quote system"
git remote add origin https://github.com/YOUR_USERNAME/ark-quotes.git
git push -u origin main
```

---

## Step 6 — Deploy to Fly.io

```bash
# Install Fly CLI if you haven't already
# https://fly.io/docs/hands-on/install-flyctl/

# Login
fly auth login

# Create the app (run once)
fly apps create ark-quotes

# Create persistent volume for SQLite (run once)
fly volumes create ark_data --region yyz --size 1

# Set your secrets (environment variables)
fly secrets set ANTHROPIC_API_KEY="your_key_here"
fly secrets set OUTLOOK_EMAIL="info@arkfurniture.ca"
fly secrets set OUTLOOK_PASSWORD="your_app_password"
fly secrets set DASHBOARD_API_KEY="your_random_key"
fly secrets set DASHBOARD_URL="https://ark-quotes.fly.dev"

# Deploy
fly deploy
```

Your app will be live at https://ark-quotes.fly.dev

Set `DB_PATH` to use the mounted volume:
```bash
fly secrets set DB_PATH="/data/ark.db"
```

---

## Step 7 — Set up Zapier

Create a new Zap with these two steps:

### Trigger: Microsoft Outlook — New Email

- Connect your info@arkfurniture.ca Outlook account
- Trigger event: "New Email"
- Folder: Inbox (or a dedicated "Customer Quotes" folder if you want)
- Optional filter: Only trigger when email has attachments = True

### Action: Webhooks by Zapier — POST

- URL: `https://ark-quotes.fly.dev/process-email`
- Payload type: `multipart`
- Data fields:
  | Key | Value |
  |-----|-------|
  | customer_name | `{{from_name}}` (from Trigger) |
  | customer_email | `{{from_email}}` (from Trigger) |
  | message | `{{body_plain}}` (from Trigger) |
  | image | `{{attachments}}` (from Trigger — Zapier will send the file) |

That's it. Turn the Zap on.

---

## Step 8 — Test the full pipeline

1. Send a test email to info@arkfurniture.ca from another account
   - Attach a photo of any furniture
   - Write something like "I'd love to get this dresser painted white"

2. The Zap should fire within ~2 minutes

3. Check your dashboard at https://ark-quotes.fly.dev
   - Log in with your `DASHBOARD_API_KEY`
   - The quote should appear under "Pending Approval"

4. You'll also receive a notification email at info@arkfurniture.ca

5. Click "Preview" to review the quote, then "Approve & Send" to deliver it

---

## Dashboard usage

**Setting the pickup date:**
Use the date picker in the sidebar. Click "Save Date" — all new quotes generated
after that point will show the updated pickup date.

**Approving a quote:**
Click "Preview" to see the full email, then "Approve & Send".
The quote goes directly to the customer from info@arkfurniture.ca.

**Auto-refresh:**
The dashboard checks for new quotes every 30 seconds automatically.

---

## Re-deploying after changes

```bash
git add .
git commit -m "Your change description"
git push
fly deploy
```

---

## Troubleshooting

**Zapier isn't triggering:**
- Make sure the Zap is turned on
- Check that emails have attachments (Zapier may not trigger on text-only emails)
- Test the Zap manually from the Zapier dashboard

**Email not sending:**
- Double-check your App Password (re-generate if needed)
- Make sure "SMTP AUTH" is enabled for info@arkfurniture.ca in Microsoft 365 admin
  (Admin center → Users → Active users → [user] → Mail → Manage email apps → enable SMTP)

**AI returning wrong piece type:**
- The AI is making its best guess from the photo
- You can always discard the quote and it won't be sent

**View live logs on Fly.io:**
```bash
fly logs
```
