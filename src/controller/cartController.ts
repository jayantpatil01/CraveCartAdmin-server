import { Request, Response } from "express";
import { Cart, ICart } from "../model/Cart.js"; 
import mongoose from "mongoose";

export const addToCart = async (req: Request, res: Response) => {
  try {
    const { userId, userName, itemId, quantity } = req.body;

    if (!userId || !userName || !itemId) {
      return res.status(400).json({ message: "Missing fields" });
    }

    // Ensure types
    const qty = Math.max(Number(quantity) || 1, 1);

    // Find existing cart or create new
    let cart = await Cart.findOne({ "user.id": userId });

    if (!cart) {
      cart = new Cart({
        user: { id: new mongoose.Types.ObjectId(userId), name: userName },
        items: [],
        updatedAt: new Date(),
      });
    }

    // Find if item already in cart
    const idx = cart.items.findIndex(i => i.item.toString() === itemId);

    if (idx > -1) {
      cart.items[idx].quantity += qty;
    } else {
      cart.items.push({ item: new mongoose.Types.ObjectId(itemId), quantity: qty });
    }

    cart.updatedAt = new Date();
    await cart.save();

    res.status(200).json({ message: "Item added to cart", cart });
  } catch (err: any) {
    res.status(500).json({ message: "Server error", error: err?.message });
  }
};

export const getCartByUser = async (req: Request, res: Response) => {
  const userId = req.params.userId;
  if (!userId) {
    return res.status(400).json({ message: "User ID is required" });
  }

  try {
    // Populate items.item with Menu's name, image, and price
    const cart = await Cart.findOne({ "user.id": userId })
      .populate({
        path: "items.item",
        model: "Menu",
        select: "name image price"
      });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    // Format the result
    const items = cart.items.map(cartItem => {
      const menu = cartItem.item as any;
      return {
        itemId: typeof menu._id === "object" ? menu._id.toString() : menu._id,
        name: menu.name,
        image: menu.image,
        price: menu.price,
        quantity: cartItem.quantity
      }
    });

    res.json({
      user: cart.user,
      items
    });
  } catch (err) {
    res.status(500).json({
      message: "Server error",
      error: (err as Error).message
    });
  }
};
