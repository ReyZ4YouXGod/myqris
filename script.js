const CONFIG = {
    project: "reyclouddev", 
    api_key: "9AwCqt0h99ArK0Jy7R5PYpP1FmdQ0SWN",
    // --- BOT TELEGRAM REYCLOUDDEV ---
    bot_token: "7148854426:AAGm74zljPqAPEMJELGiTGaHi5U_InIJpT4",
    chat_id: "2027479396" 
};

// Jembatan Proxy agar tidak Error CORS di Vercel/Browser
const PROXY = "https://api.allorigins.win/raw?url=";

async function generateQRIS() {
    const amount = document.getElementById('amount').value;
    const loader = document.getElementById('loader');
    const btn = document.getElementById('btn-generate');
    
    if (!amount || amount < 1000) return alert('Minimal nominal Rp 1.000');

    loader.style.display = 'block';
    btn.disabled = true;
    btn.style.opacity = "0.5";

    const orderId = "RC-WEB-" + Date.now();
    const apiUrl = `https://app.pakasir.com/api/transactioncreate/qris`;

    try {
        // Menggunakan Axios dengan Proxy untuk bypass CORS
        const response = await axios.post(PROXY + encodeURIComponent(apiUrl), {
            project: CONFIG.project,
            order_id: orderId,
            amount: amount,
            api_key: CONFIG.api_key
        });

        if (response.data && response.data.payment) {
            const qrString = response.data.payment.payment_number;
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(qrString)}`;

            // Update Tampilan Dashboard
            document.getElementById('qr-img').src = qrUrl;
            document.getElementById('id-order').innerText = orderId;
            document.getElementById('qr-result').classList.remove('hidden');
            document.getElementById('payment-form').classList.add('hidden');

            console.log(`[SUCCESS] Order Created: ${orderId}`);
            
            // Mulai Monitoring Pembayaran
            startMonitoring(orderId, amount);
        } else {
            throw new Error("Invalid Response dari Pakasir");
        }

    } catch (err) {
        console.error(err);
        alert('Gagal Request API! Pastikan Project Slug & API Key benar.');
        btn.disabled = false;
        btn.style.opacity = "1";
    } finally {
        loader.style.display = 'none';
    }
}

function startMonitoring(orderId, amount) {
    const statusText = document.getElementById('status-text');
    const detailUrl = `https://app.pakasir.com/api/transactiondetail`;
    
    const interval = setInterval(async () => {
        try {
            const res = await axios.get(PROXY + encodeURIComponent(`${detailUrl}?project=${CONFIG.project}&amount=${amount}&order_id=${orderId}&api_key=${CONFIG.api_key}`));

            if (res.data && res.data.transaction && res.data.transaction.status === 'completed') {
                clearInterval(interval);
                
                // Efek Sukses di Web
                statusText.innerText = 'PEMBAYARAN SUKSES!';
                statusText.style.background = '#00ff88';
                statusText.style.color = '#000';
                statusText.style.borderColor = '#00ff88';

                // Kirim Laporan ke Telegram Bos Rey
                sendTelegramNotif(orderId, amount);
                
                alert('Success! Pembayaran diterima oleh ReyCloudDev.');
            }
        } catch (e) {
            console.log("Checking status...");
        }
    }, 5000); // Cek tiap 5 detik

    // Berhenti cek setelah 10 menit (biar nggak boros resource)
    setTimeout(() => clearInterval(interval), 600000);
}

// --- ENGINE NOTIFIKASI TELEGRAM ---
async function sendTelegramNotif(orderId, amount) {
    const message = `
🔔 <b>CUAN MASUK: REYCLOUDDEV</b>
━━━━━━━━━━━━━━━━━━━━━━
✅ <b>Status:</b> Berhasil Dibayar
💰 <b>Nominal:</b> Rp ${parseInt(amount).toLocaleString('id-ID')}
📝 <b>ID Order:</b> <code>${orderId}</code>
🌐 <b>Source:</b> Web Dashboard Vercel
━━━━━━━━━━━━━━━━━━━━━━
<i>Dana otomatis masuk ke saldo Pakasir!</i>`;

    try {
        await axios.post(`https://api.telegram.org/bot${CONFIG.bot_token}/sendMessage`, {
            chat_id: CONFIG.chat_id,
            text: message,
            parse_mode: 'HTML'
        });
        console.log('[TELEGRAM] Laporan cuan terkirim!');
    } catch (err) {
        console.error('[TELEGRAM] Gagal kirim notif:', err.message);
    }
}
