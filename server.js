const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fetch = require("node-fetch");
const FormData = require("form-data");
const webpush = require("web-push");

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));

const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:ucfr@example.com";

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

function escapeHtml(text = "") {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

app.get("/", (req, res) => {
  res.send("✅ UCFR Telegram + Push Relay is running.");
});

app.get("/test", async (req, res) => {
  try {
    const text = "✅ UCFR Telegram Relay Test\nTime: " + new Date().toLocaleString("en-PH", { timeZone: "Asia/Manila" });
    const result = await sendMessage(text);
    res.json({ ok: true, telegram: result });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

app.get("/vapid-public-key", (req, res) => {
  if (!VAPID_PUBLIC_KEY) {
    return res.status(500).json({ ok: false, error: "Missing VAPID_PUBLIC_KEY in Render environment variables." });
  }
  res.json({ ok: true, publicKey: VAPID_PUBLIC_KEY });
});

app.get("/generate-vapid", (req, res) => {
  const keys = webpush.generateVAPIDKeys();
  res.json({
    ok: true,
    note: "Copy these to Render Environment Variables as VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY, then redeploy.",
    keys
  });
});

app.post("/send", upload.single("photo"), async (req, res) => {
  try {
    const body = req.body || {};

    const text =
`🚨 <b>NEW SOS EMERGENCY ALERT</b>

<b>Case ID:</b> ${escapeHtml(body.case_id || "N/A")}
<b>Name:</b> ${escapeHtml(body.name || "N/A")}
<b>Barangay:</b> ${escapeHtml(body.barangay || "N/A")}
<b>Contact:</b> ${escapeHtml(body.contact || "N/A")}
<b>Emergency:</b> ${escapeHtml(body.emergency_type || "Emergency")}
<b>Victim Status:</b> ${escapeHtml(body.victim_status || "UNKNOWN")}
<b>Case Status:</b> PENDING
<b>Description:</b> ${escapeHtml(body.description || "No description")}
<b>Location:</b> ${escapeHtml(body.location || "Location not available")}
<b>Time:</b> ${new Date().toLocaleString("en-PH", { timeZone: "Asia/Manila" })}`;

    let result;

    if (req.file) {
      result = await sendPhoto(req.file.buffer, req.file.originalname || "sos.jpg", text);
    } else {
      result = await sendMessage(text);
    }

    res.json({ ok: true, telegram: result });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

app.post("/push-broadcast", async (req, res) => {
  try {
    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      return res.status(500).json({ ok: false, error: "Missing VAPID keys in Render environment variables." });
    }

    const { title, message, url, subscriptions } = req.body || {};

    if (!Array.isArray(subscriptions) || subscriptions.length === 0) {
      return res.status(400).json({ ok: false, error: "No subscriptions received." });
    }

    const payload = JSON.stringify({
      title: title || "🚨 UCFR Earthquake Alert",
      message: message || "DUCK, COVER, AND HOLD. Stay alert.",
      url: url || "./index.php"
    });

    const results = await Promise.allSettled(
      subscriptions.map(sub => webpush.sendNotification(sub, payload))
    );

    const sent = results.filter(r => r.status === "fulfilled").length;
    const failed = results.length - sent;

    res.json({ ok: true, sent, failed, total: results.length });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

async function sendMessage(text) {
  if (!BOT_TOKEN || !CHAT_ID) {
    throw new Error("Missing BOT_TOKEN or CHAT_ID environment variable.");
  }

  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
  const params = new URLSearchParams();
  params.append("chat_id", CHAT_ID);
  params.append("text", text);
  params.append("parse_mode", "HTML");
  params.append("disable_web_page_preview", "false");

  const response = await fetch(url, { method: "POST", body: params });
  const data = await response.json();

  if (!data.ok) throw new Error(JSON.stringify(data));
  return data;
}

async function sendPhoto(buffer, filename, caption) {
  if (!BOT_TOKEN || !CHAT_ID) {
    throw new Error("Missing BOT_TOKEN or CHAT_ID environment variable.");
  }

  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`;
  const form = new FormData();
  form.append("chat_id", CHAT_ID);
  form.append("caption", caption);
  form.append("parse_mode", "HTML");
  form.append("photo", buffer, filename);

  const response = await fetch(url, { method: "POST", body: form });
  const data = await response.json();

  if (!data.ok) throw new Error(JSON.stringify(data));
  return data;
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`UCFR Telegram + Push Relay running on port ${PORT}`);
});
