import { Request, Response } from "express";
import Razorpay from "razorpay";
import Order, { IOrder } from "../model/Order.js";
import { Cart } from "../model/Cart.js";
import mongoose from "mongoose";
import crypto from "crypto";

const { Types } = mongoose;

const razorpay = new Razorpay({
  key_id: process.env.KEY_ID || "",
  key_secret: process.env.KEY_SECRET || "",
});

export const createOrder = async (req: Request, res: Response) => {
  try {
    const {
      userId,
      addressId,
      items,
      paymentMode,
      transactionId,
    }: {
      userId: string;
      addressId: string;
      items: { item: string; quantity: number; price: number }[];
      paymentMode: "COD" | "Online";
      transactionId?: string;
    } = req.body;

    if (!userId || !addressId || !items || items.length === 0 || !paymentMode) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const amount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    // For online payment without transactionId, create Razorpay payment order
    if (paymentMode === "Online" && !transactionId) {
      const razorpayOrder = await razorpay.orders.create({
        amount: amount * 100, // paise
        currency: "INR",
        receipt: `order_rcpt_${Date.now()}`,
      });

      return res.status(200).json({
        success: true,
        payment: "online",
        razorpayOrderId: razorpayOrder.id,
        orderAmount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
      });
    }

    // Construct orderPayload converting string IDs to ObjectId
    const orderPayload: Partial<IOrder> = {
      user: { id: new Types.ObjectId(userId) },
      address: new Types.ObjectId(addressId),
      items: items.map((item) => ({
        item: new Types.ObjectId(item.item), // Reference to Menu model
        quantity: item.quantity,
        price: item.price,
      })),
      paymentMode,
      transactionId: transactionId || undefined,
      status: "pending",
      amount,
    };

    const order = await Order.create(orderPayload);

    // Clear user cart
    await Cart.findOneAndUpdate({ "user.id": new Types.ObjectId(userId) }, { items: [] });

    return res.status(201).json({ success: true, order });
  } catch (error: any) {
    console.error("createOrder error:", error);
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

export const verifyPayment = async (req: Request, res: Response) => {
  try {
    const {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      orderId,
    }: {
      razorpayOrderId: string;
      razorpayPaymentId: string;
      razorpaySignature: string;
      orderId: string;
    } = req.body;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature || !orderId) {
      return res.status(400).json({ success: false, message: "Missing payment verification data" });
    }

    const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "");
    hmac.update(`${razorpayOrderId}|${razorpayPaymentId}`);
    const generatedSignature = hmac.digest("hex");

    if (generatedSignature !== razorpaySignature) {
      return res.status(400).json({ success: false, message: "Invalid payment signature" });
    }

    await Order.findByIdAndUpdate(orderId, {
      transactionId: razorpayPaymentId,
      status: "pending", // or "ordered" per your business logic
    });

    return res.json({ success: true, message: "Payment verified and order updated" });
  } catch (error: any) {
    console.error("verifyPayment error:", error);
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

export const getOrdersByUser = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;
    if (!userId) return res.status(400).json({ success: false, message: "UserId required" });

    const orders = await Order.find({ "user.id": new Types.ObjectId(userId) })
      .populate("items.item", "name price") // populate Menu name & price
      .populate("address")
      .sort({ createdAt: -1 });

    return res.json({ success: true, orders });
  } catch (error: any) {
    console.error("getOrdersByUser error:", error);
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

export const getAllOrders = async (req: Request, res: Response) => {
  try {
    const orders = await Order.find()
      // No user population if no User model
      .populate("address")
      .populate("items.item", "name price")
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, orders });
  } catch (error: any) {
    console.error("getAllOrders error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch all orders",
      error: error.message,
    });
  }
};
