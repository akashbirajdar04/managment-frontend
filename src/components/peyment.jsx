// PayButton.jsx
import React from "react";

function loadRazorpayScript(src) {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = src;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function PayButton({ amount, user }) {
  const handlePay = async () => {
    // 1) Load Razorpay script
    const loaded = await loadRazorpayScript(
      "https://checkout.razorpay.com/v1/checkout.js"
    );
    if (!loaded) {
      alert("Razorpay SDK failed to load. Are you online?");
      return;
    }

    // 2) Create order on backend
    const res = await fetch("http://localhost:4000/api/payment/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount, currency: "INR" }),
    });

    const data = await res.json();

    if (!data.success) {
      alert("Unable to create order. Please try again.");
      return;
    }

    const { orderId, amount: orderAmount, currency } = data;

    // 3) Open Razorpay checkout
    const options = {
      key: process.env.REACT_APP_RAZORPAY_KEY_ID || "your_test_key_here",
      amount: orderAmount,
      currency,
      name: "My App",
      description: "Test Transaction",
      order_id: orderId,
      prefill: {
        name: user?.name || "Test User",
        email: user?.email || "test@example.com",
        contact: user?.phone || "9999999999",
      },
      notes: {
        userId: user?._id || "guest",
      },
      theme: {
        color: "#3399cc",
      },
      handler: function (response) {
        // This fires on payment success on frontend
        // But REAL confirmation should be via webhook
        console.log("Razorpay Response:", response);
        alert("Payment successful! We’ll confirm shortly.");
      },
      modal: {
        ondismiss: function () {
          console.log("Checkout form closed");
        },
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  return <button onClick={handlePay}>Pay ₹{amount}</button>;
}
