module.exports = async function (req, res) {
    const { amount } = req.body;
    const orderId = "RC-" + Date.now();

    try {
        const response = await fetch("https://app.pakasir.com/api/transactioncreate/qris", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                project: process.env.PROJECT,
                order_id: orderId,
                amount: amount,
                api_key: process.env.API_KEY
            })
        });

        const data = await response.json();

        res.json({
            ...data,
            order_id: orderId
        });

    } catch {
        res.status(500).json({ error: true });
    }
};
