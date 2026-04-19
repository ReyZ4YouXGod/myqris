const CONFIG = {
    project: "reyclouddev", 
    api_key: "9AwCqt0h99ArK0Jy7R5PYpP1FmdQ0SWN",
    bot_token: "7148854426:AAGm74zljPqAPEMJELGiTGaHi5U_InIJpT4",
    chat_id: "2027479396" 
};

async function generateQRIS() {
    const amount = document.getElementById('amount').value;
    const loader = document.getElementById('loader');
    const btn = document.getElementById('btn-generate');
    
    if (!amount || amount < 1000) return alert('Minimal nominal Rp 1.000');

    loader.style.display = 'block';
    btn.disabled = true;

    const orderId = "RC-WEB-" + Date.now();

    try {
        const response = await axios.post('https://app.pakasir.com/api/transactioncreate/qris', {
            project: CONFIG.project,
            order_id: orderId,
            amount: amount,
            api_key: CONFIG.api_key
        });

        const qrString = response.data.payment.payment_number;
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(qrString)}`;

        document.getElementById('qr-img').src = qrUrl;
        document.getElementById('id-order').innerText = orderId;
        document.getElementById('qr-result').classList.remove('hidden');
        document.getElementById('payment-form').classList.add('hidden');

        startMonitoring(orderId, amount);
    } catch (err) {
        alert('Gagal Request ke API Pakasir.');
        btn.disabled = false;
    } finally {
        loader.style.display = 'none';
    }
}

function startMonitoring(orderId, amount) {
    const statusText = document.getElementById('status-text');
    const interval = setInterval(async () => {
        try {
            const res = await axios.get('https://app.pakasir.com/api/transactiondetail', {
                params: {
                    project: CONFIG.project,
                    amount: amount,
                    order_id: orderId,
                    api_key: CONFIG.api_key
                }
            });

            if (res.data.transaction.status === 'completed') {
                clearInterval(interval);
                statusText.innerText = 'PEMBAYARAN SUKSES!';
                statusText.style.background = '#00ff88';
                statusText.style.color = '#000';
                sendTelegramNotif(orderId, amount);
            }
        } catch (e) {}
    }, 5000);
    setTimeout(() => clearInterval(interval), 600000);
}

async function sendTelegramNotif(orderId, amount) {
    const message = `🔔 <b>CUAN MASUK: REYCLOUDDEV</b>\n━━━━━━━━━━━━━━━━━━━━━━\n✅ <b>Status:</b> Berhasil Dibayar\n💰 <b>Nominal:</b> Rp ${parseInt(amount).toLocaleString()}\n📝 <b>ID Order:</b> <code>${orderId}</code>\n━━━━━━━━━━━━━━━━━━━━━━`;
    try {
        await axios.post(`https://api.telegram.org/bot${CONFIG.bot_token}/sendMessage`, {
            chat_id: CONFIG.chat_id,
            text: message,
            parse_mode: 'HTML'
        });
    } catch (err) { console.error('Notif failed', err); }
}
