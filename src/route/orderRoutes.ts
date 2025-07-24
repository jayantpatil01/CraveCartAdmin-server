import express from "express";
import * as orderController from "../controller/orderController.js";

const router = express.Router();
router.post("/orders", orderController.createOrder);
router.post("/orders/verify", orderController.verifyPayment);
router.get("/orders/:userId", orderController.getOrdersByUser);
router.get("/orders", orderController.getAllOrders);

export default router;
