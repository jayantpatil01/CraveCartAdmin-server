import express from "express";
import { addToCart, getCartByUser, removeCartItem } from "../controller/cartController.js";
const router = express.Router();

router.post("/cart/add", addToCart);
router.get("/cart/:userId", getCartByUser);
router.delete("/cart/:userId/:itemId", removeCartItem);



export default router;
