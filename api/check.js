module.exports = async function (req, res) {
    const { order_id, amount } = req.body;

    try {
        const url = `https://app.pakasir.com/api/transactiondetail?project=${process.env.PROJECT}&amount=${amount}&order_id=${order_id}&api_key=${process.env.API_KEY}`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.transaction?.status === "completed") {

            await fetch(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    chat_id: process.env.CHAT_ID,
                    parse_mode: "HTML",
                    text:
`🔔 <b>PAYMENT BERHASIL</b>
━━━━━━━━━━━━━━━━━━
🆔 <code>${order_id}</code>
💰 Rp ${(Number(amount) || 0).toLocaleString("id-ID")}
⏰ ${new Date().toLocaleString("id-ID")}
━━━━━━━━━━━━━━━━━━`
                })
            });

            return res.json({ status: "completed" });
        }

        res.json({ status: "pending" });

    } catch {
        res.status(500).json({ error: true });
    }
};
