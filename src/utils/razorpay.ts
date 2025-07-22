// utils/razorpay.ts

import Razorpay from "razorpay";
import crypto from "crypto";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID as string,
  key_secret: process.env.RAZORPAY_KEY_SECRET as string,
});

export const createRazorpayOrder = async (
  amount: number,
  currency: string = "INR"
) => {
  // amount is in paise
  const options = {
    amount,
    currency,
    receipt: `rcpt_${Date.now()}`,
  };
  const order = await razorpay.orders.create(options);
  return order;
};

export const verifyRazorpaySignature = (
  orderId: string,
  paymentId: string,
  razorpaySignature: string
): boolean => {
  const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET as string);
  hmac.update(`${orderId}|${paymentId}`);
  const digest = hmac.digest("hex");
  return digest === razorpaySignature;
};

export default razorpay;
