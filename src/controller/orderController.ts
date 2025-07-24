import { Request, Response } from "express";
import Razorpay from "razorpay";
import Order, { IOrder } from "../model/Order.js";
import { Cart } from "../model/Cart.js";
import mongoose from "mongoose";
import crypto from "crypto";

const { Types } = mongoose;

const razorpay = new Razorpay({
  key_id: process.env.key_id || "",
  key_secret: process.env.key_secret || "",
});

// Log Razorpay initialization status
console.log("Razorpay initialized:", !!razorpay);

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

    // Validate required fields
    if (!userId || !addressId || !items || items.length === 0 || !paymentMode) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    // Validate item data
    if (items.some((item) => !item.item || !item.quantity || !item.price)) {
      return res.status(400).json({ success: false, message: "Invalid item data" });
    }

    const amount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    // Online payment - create Razorpay order and save order doc BEFORE payment
    if (paymentMode === "Online" && !transactionId) {
      try {
        const razorpayOrder = await razorpay.orders.create({
          amount: amount * 100, // Convert to paise
          currency: "INR",
          receipt: `order_rcpt_${Date.now()}`,
        });

        console.log("Razorpay Order:", razorpayOrder);

        if (!razorpayOrder.id) {
          return res.status(500).json({ success: false, message: "Failed to create Razorpay order" });
        }

        const order = await Order.create({
          user: { id: new Types.ObjectId(userId) },
          address: new Types.ObjectId(addressId),
          items: items.map((item) => ({
            item: new Types.ObjectId(item.item),
            quantity: item.quantity,
            price: item.price,
          })),
          paymentMode,
          status: "pending",
          amount,
          razorpayOrderId: razorpayOrder.id,
        });

        return res.status(200).json({
          success: true,
          payment: "online",
          razorpayOrderId: razorpayOrder.id,
          orderAmount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
          orderId: order._id,
        });
      } catch (razorpayError: any) {
        console.error("Razorpay order creation error:", razorpayError);
        return res.status(500).json({
          success: false,
          message: "Failed to create Razorpay order",
          error: razorpayError.message,
        });
      }
    }

    // Create order directly (COD or online payment after verification)
    const orderPayload: Partial<IOrder> = {
      user: { id: new Types.ObjectId(userId) },
      address: new Types.ObjectId(addressId),
      items: items.map((item) => ({
        item: new Types.ObjectId(item.item),
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

    const hmac = crypto.createHmac("sha256", process.env.key_secret || "");
    hmac.update(`${razorpayOrderId}|${razorpayPaymentId}`);
    const generatedSignature = hmac.digest("hex");

    if (generatedSignature !== razorpaySignature) {
      return res.status(400).json({ success: false, message: "Invalid payment signature" });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    await Order.findByIdAndUpdate(orderId, {
      transactionId: razorpayPaymentId,
      status: "ordered", // Reflect successful payment
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
      .populate("items.item", "name price")
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