import express from "express";
import {
  getAllOrders,
  getUserOrders,
  updateOrderStatus,
  createOrder,
} from "../controller/orderController.js";

const router = express.Router();

// Create order using custom path "/Createorder/user/:userId"
router.post("/Createorder/user/:userId", createOrder);

// Get all orders
router.get("/orders", getAllOrders);

// Get orders by userId
router.get("/orders/user/:userId", getUserOrders);

// Update order status
router.post("/orders/:orderId/status", updateOrderStatus);

export default router;
