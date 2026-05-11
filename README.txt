UCFR TELEGRAM RELAY FOR RENDER

1. Create GitHub repository:
   ucfr-telegram-relay

2. Upload these files:
   - package.json
   - server.js

3. Go to Render:
   New + > Web Service

4. Connect your GitHub repo.

5. Settings:
   Runtime: Node
   Build Command: npm install
   Start Command: npm start

6. Add Environment Variables:
   BOT_TOKEN = 8733344200:AAEW-r-XDmpLj4mUEpivP_QZAnyl7xdZaSw
   CHAT_ID = -5171029729

7. Deploy.

8. Test:
   https://YOUR-RENDER-URL.onrender.com/test

If test sends to Telegram, relay is working.
