const express = require("express");
const fetch = require("node-fetch");

const app = express();
app.use(express.json());

const BOT_TOKEN = "8680228410:AAGolp9iE0p747QWsgoGsY7brTwLve4pwec";
const CHAT_ID = "-1003626235775";
const SECRET = "JRMSU_SECRET_2026";

app.post("/send", async (req, res) => {
    if (req.body.secret !== SECRET) {
        return res.status(403).send("Unauthorized");
    }

    const message = req.body.message;

    try {
        const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                chat_id: CHAT_ID,
                text: message
            })
        });

        const data = await response.json();
        res.json(data);
    } catch (err) {
        res.status(500).send("Error sending message");
    }
});

app.get("/", (req, res) => {
    res.send("Telegram Relay Running");
});

app.listen(10000, () => console.log("Server running"));
