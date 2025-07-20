import express from "express";
import { addToCart, getCartByUser } from "../controller/cartController.js";
const router = express.Router();

router.post("/cart/add", addToCart);
router.get("/cart/:userId", getCartByUser);


export default router;
