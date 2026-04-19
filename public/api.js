async function generateQRIS() {
    const amount = document.getElementById("amount").value;

    if (!amount || amount < 1000) {
        alert("Minimal 1000");
        return;
    }

    const res = await axios.post("/api/qris", { amount });
    const data = res.data;

    if (!data.payment) {
        alert("Gagal");
        return;
    }

    const qr = data.payment.payment_number;

    document.getElementById("qr").src =
        "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=" +
        encodeURIComponent(qr);

    document.getElementById("order").innerText = data.order_id;

    document.getElementById("form").classList.add("hidden");
    document.getElementById("result").classList.remove("hidden");

    checkStatus(data.order_id, amount);
}

function checkStatus(order_id, amount) {
    const interval = setInterval(async () => {
        const res = await axios.post("/api/check", {
            order_id,
            amount
        });

        if (res.data.status === "completed") {
            clearInterval(interval);
            document.getElementById("status").innerText = "SUCCESS";
            alert("Pembayaran berhasil");
        }
    }, 5000);
}
