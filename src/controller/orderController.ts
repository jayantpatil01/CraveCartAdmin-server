import { Request, Response } from "express";
import { Order } from "../model/orderModel.js"; // Adjust path as needed

// 1. Get all orders (e.g., for admin)
export const getAllOrders = async (req: Request, res: Response) => {
  try {
    const orders = await Order.find().sort({ placedAt: -1 });
    res.status(200).json({ success: true, orders });
  } catch (error) {
    console.error("getAllOrders error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// 2. Get all orders by userId
export const getUserOrders = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;
    const orders = await Order.find({ "user.id": userId }).sort({ placedAt: -1 });
    if (!orders.length) {
      return res.status(404).json({ success: false, message: "No orders found for this user" });
    }
    res.status(200).json({ success: true, orders });
  } catch (error) {
    console.error("getUserOrders error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// 3. Update order status by order ID
export const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const orderId = req.params.orderId;
    const { status } = req.body;

    // Validate status
    const validStatuses = [
      "pending",
      "confirmed",
      "preparing",
      "out-for-delivery",
      "delivered",
      "cancelled",
    ];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid or missing status" });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    order.status = status;
    await order.save();

    res.status(200).json({ success: true, message: "Order status updated", order });
  } catch (error) {
    console.error("updateOrderStatus error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
