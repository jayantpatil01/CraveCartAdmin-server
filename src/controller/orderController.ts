import { Request, Response } from "express";
import { Order } from "../model/orderModel.js";
import { Menu } from "../model/Menumodel.js";

// 1. Create Order
export const createOrder = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = req.params.userId;
    const { items, deliveryAddress, paymentInfo, totalAmount, userName, userEmail } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: "Order items are required" });
    }
    if (!deliveryAddress || Object.keys(deliveryAddress).length === 0) {
      return res.status(400).json({ success: false, message: "Delivery address is required" });
    }
    if (!totalAmount || totalAmount <= 0) {
      return res.status(400).json({ success: false, message: "Total amount is required and must be positive" });
    }

    const detailedItems = [];
    for (const item of items) {
      if (!item.item || !item.quantity) {
        return res.status(400).json({ success: false, message: "Each item must include item id and quantity" });
      }
      const menuItem = await Menu.findById(item.item).lean();
      if (!menuItem) {
        return res.status(400).json({ success: false, message: `Menu item not found: ${item.item}` });
      }
      detailedItems.push({
        item: item.item,
        name: menuItem.name,
        price: menuItem.price,
        quantity: item.quantity,
        totalPrice: menuItem.price * item.quantity,
      });
    }

    const newOrder = new Order({
      user: {
        id: userId,
        name: userName || "Unknown",
        email: userEmail || "",
      },
      items: detailedItems,
      deliveryAddress,
      totalAmount,
      paymentInfo: paymentInfo || { status: "pending" },
      status: "pending",
    });

    await newOrder.save();

    return res.status(201).json({ success: true, message: "Order created successfully", order: newOrder });
  } catch (error) {
    console.error("createOrder error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// 2. Get All Orders
export const getAllOrders = async (req: Request, res: Response): Promise<Response> => {
  try {
    const orders = await Order.find().sort({ placedAt: -1 });
    return res.status(200).json({ success: true, orders });
  } catch (error) {
    console.error("getAllOrders error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// 3. Get User Orders
export const getUserOrders = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = req.params.userId;
    const orders = await Order.find({ "user.id": userId }).sort({ placedAt: -1 });
    if (!orders.length) {
      return res.status(404).json({ success: false, message: "No orders found for this user" });
    }
    return res.status(200).json({ success: true, orders });
  } catch (error) {
    console.error("getUserOrders error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// 4. Update Order Status
export const updateOrderStatus = async (req: Request, res: Response): Promise<Response> => {
  try {
    const orderId = req.params.orderId;
    const { status } = req.body;

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

    return res.status(200).json({ success: true, message: "Order status updated", order });
  } catch (error) {
    console.error("updateOrderStatus error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
