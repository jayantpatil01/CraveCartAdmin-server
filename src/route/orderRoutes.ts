import express from "express";
import {
  getAllOrders,
  getUserOrders,
  updateOrderStatus,
} from "../controller/orderController.js";

const router = express.Router();

router.get("/orders", getAllOrders);              
router.get("/orders/user/:userId", getUserOrders); 
router.post("/orders/:orderId/status", updateOrderStatus); 

export default router;
