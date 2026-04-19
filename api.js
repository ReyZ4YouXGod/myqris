const CONFIG = {
    project: "reyclouddev", 
    api_key: "9AwCqt0h99ArK0Jy7R5PYpP1FmdQ0SWN",
    bot_token: "7148854426:AAGm74zljPqAPEMJELGiTGaHi5U_InIJpT4",
    chat_id: "2027479396" 
};

// Jembatan Proxy Bypass CORS Vercel
const PROXY = "https://api.allorigins.win/raw?url=";

async function generateQRIS() {
    const amount = document.getElementById('amount').value;
    const loader = document.getElementById('loader');
    const btn = document.getElementById('btn-generate');
    
    if (!amount || amount < 1000) {
        alert('Minimal nominal Rp 1.000');
        return;
    }

    loader.style.display = 'block';
    btn.disabled = true;

    const orderId = "RC-WEB-" + Date.now();
    const apiUrl = `https://app.pakasir.com/api/transactioncreate/qris`;

    try {
        const response = await axios.post(PROXY + encodeURIComponent(apiUrl), {
            project: CONFIG.project,
            order_id: orderId,
            amount: amount,
            api_key: CONFIG.api_key
        });

        if (response.data && response.data.payment) {
            const qrString = response.data.payment.payment_number;
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(qrString)}`;

            document.getElementById('qr-img').src = qrUrl;
            document.getElementById('id-order').innerText = orderId;
            document.getElementById('qr-result').classList.remove('hidden');
            document.getElementById('payment-form').classList.add('hidden');

            startMonitoring(orderId, amount);
        } else {
            alert('Gagal generate QRIS. Cek API Key!');
            btn.disabled = false;
        }

    } catch (err) {
        alert('Gangguan Jaringan! Coba lagi nanti.');
        btn.disabled = false;
    } finally {
        loader.style.display = 'none';
    }
}

function startMonitoring(orderId, amount) {
    const statusText = document.getElementById('status-text');
    const detailUrl = `https://app.pakasir.com/api/transactiondetail`;
    
    const interval = setInterval(async () => {
        try {
            const checkUrl = `${detailUrl}?project=${CONFIG.project}&amount=${amount}&order_id=${orderId}&api_key=${CONFIG.api_key}`;
            const res = await axios.get(PROXY + encodeURIComponent(checkUrl));

            if (res.data && res.data.transaction && res.data.transaction.status === 'completed') {
                clearInterval(interval);
                
                statusText.innerText = 'PAYMENT SUCCESS!';
                statusText.style.background = '#00ff88';
                statusText.style.color = '#000';
                statusText.style.borderColor = '#00ff88';

                sendTelegramNotif(orderId, amount);
                alert('Terima kasih! Pembayaran Berhasil.');
            }
        } catch (e) {
            // Silently check
        }
    }, 5000);

    setTimeout(() => clearInterval(interval), 600000);
}

async function sendTelegramNotif(orderId, amount) {
    const message = `🔔 <b>CUAN WEB: REYCLOUDDEV</b>\n━━━━━━━━━━━━━━━━━━━━━━\n✅ <b>STATUS:</b> BERHASIL\n💰 <b>NOMINAL:</b> Rp ${parseInt(amount).toLocaleString('id-ID')}\n📝 <b>ID:</b> <code>${orderId}</code>\n━━━━━━━━━━━━━━━━━━━━━━`;

    try {
        await axios.post(`https://api.telegram.org/bot${CONFIG.bot_token}/sendMessage`, {
            chat_id: CONFIG.chat_id,
            text: message,
            parse_mode: 'HTML'
        });
    } catch (err) {
        // Fail silently
    }
}
