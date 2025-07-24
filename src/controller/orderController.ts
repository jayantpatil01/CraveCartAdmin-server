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
console.log("Backend: Razorpay initialized:", !!razorpay);
console.log("Backend: Razorpay key_id:", !!process.env.key_id);
console.log("Backend: Razorpay key_secret:", !!process.env.key_secret);

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

    console.log("Backend: Received order payload:", req.body);

    // Validate required fields
    if (!userId || !addressId || !items || !Array.isArray(items) || items.length === 0 || !paymentMode) {
      return res.status(400).json({ success: false, message: "Missing required fields: userId, addressId, items, or paymentMode" });
    }

    // Validate ObjectIds
    if (!Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: `Invalid userId: ${userId}` });
    }
    if (!Types.ObjectId.isValid(addressId)) {
      return res.status(400).json({ success: false, message: `Invalid addressId: ${addressId}` });
    }
    for (const item of items) {
      if (!Types.ObjectId.isValid(item.item)) {
        return res.status(400).json({ success: false, message: `Invalid item ID: ${item.item}` });
      }
      if (typeof item.quantity !== "number" || item.quantity <= 0) {
        return res.status(400).json({ success: false, message: `Invalid quantity for item ${item.item}: ${item.quantity}` });
      }
      if (typeof item.price !== "number" || item.price <= 0) {
        return res.status(400).json({ success: false, message: `Invalid price for item ${item.item}: ${item.price}` });
      }
    }

    // Calculate amount
    const amount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    if (amount <= 0) {
      return res.status(400).json({ success: false, message: "Order amount must be greater than zero" });
    }

    // Online payment - create Razorpay order
    if (paymentMode === "Online" && !transactionId) {
      try {
        if (!process.env.key_id || !process.env.key_secret) {
          return res.status(500).json({ success: false, message: "Razorpay credentials are missing" });
        }

        const razorpayOrder = await razorpay.orders.create({
          amount: Math.round(amount * 100), // Convert to paise, ensure integer
          currency: "INR",
          receipt: `order_rcpt_${Date.now()}`,
        });

        console.log("Backend: Razorpay order created:", razorpayOrder);

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
          transactionId: null, // Explicitly set to null for online orders
        });

        console.log("Backend: MongoDB order created:", order);

        return res.status(200).json({
          success: true,
          payment: "online",
          razorpayOrderId: razorpayOrder.id,
          orderAmount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
          orderId: order._id,
        });
      } catch (razorpayError: any) {
        console.error("Backend: Razorpay order creation error:", razorpayError);
        return res.status(500).json({
          success: false,
          message: "Failed to create Razorpay order",
          error: razorpayError.message || "Unknown Razorpay error",
        });
      }
    }

    // COD or post-verification online order
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
    console.log("Backend: COD order created:", order);

    // Clear user cart
    await Cart.findOneAndUpdate({ "user.id": new Types.ObjectId(userId) }, { items: [] });

    return res.status(201).json({ success: true, order });
  } catch (error: any) {
    console.error("Backend: createOrder error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error in createOrder",
      error: error.message || "Unknown server error",
    });
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

    console.log("Backend: Verify payment payload:", req.body);

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature || !orderId) {
      return res.status(400).json({ success: false, message: "Missing payment verification data" });
    }

    if (!process.env.key_secret) {
      return res.status(500).json({ success: false, message: "Razorpay secret is missing" });
    }

    const hmac = crypto.createHmac("sha256", process.env.key_secret);
    hmac.update(`${razorpayOrderId}|${razorpayPaymentId}`);
    const generatedSignature = hmac.digest("hex");

    if (generatedSignature !== razorpaySignature) {
      return res.status(400).json({ success: false, message: "Invalid payment signature" });
    }

    if (!Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ success: false, message: `Invalid orderId: ${orderId}` });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    await Order.findByIdAndUpdate(orderId, {
      transactionId: razorpayPaymentId,
      status: "ordered",
    });

    console.log("Backend: Payment verified, order updated:", orderId);

    return res.json({ success: true, message: "Payment verified and order updated" });
  } catch (error: any) {
    console.error("Backend: verifyPayment error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error in verifyPayment",
      error: error.message || "Unknown server error",
    });
  }
};

export const getOrdersByUser = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;
    if (!userId || !Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: `Invalid userId: ${userId}` });
    }

    const orders = await Order.find({ "user.id": new Types.ObjectId(userId) })
      .populate("items.item", "name price")
      .populate("address")
      .sort({ createdAt: -1 });

    console.log("Backend: Orders fetched for user:", userId, orders.length);

    return res.json({ success: true, orders });
  } catch (error: any) {
    console.error("Backend: getOrdersByUser error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error in getOrdersByUser",
      error: error.message || "Unknown server error",
    });
  }
};

export const getAllOrders = async (req: Request, res: Response) => {
  try {
    const orders = await Order.find()
      .populate("address")
      .populate("items.item", "name price")
      .sort({ createdAt: -1 });

    console.log("Backend: All orders fetched:", orders.length);

    return res.status(200).json({ success: true, orders });
  } catch (error: any) {
    console.error("Backend: getAllOrders error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error in getAllOrders",
      error: error.message || "Unknown server error",
    });
  }
};