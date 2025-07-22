import mongoose, { Schema, Document, Types } from "mongoose";

export interface IOrderItem {
  item: Types.ObjectId;            // reference to Menu item
  name: string;                   // store copy of item name at order time
  price: number;                  // price per item at order time
  quantity: number;
  totalPrice: number;             // price * quantity
}

export interface IOrder extends Document {
  user: {
    id: Types.ObjectId;           // ref to User
    name: string;
    email: string;
  };
  items: IOrderItem[];
  deliveryAddress: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  totalAmount: number;            // sum of all items totalPrice, or order price
  paymentInfo?: {
    paymentId?: string;           // Razorpay payment id or equivalent
    method?: string;              // payment method e.g. "razorpay", "cod"
    status: "pending" | "paid" | "failed";
  };
  status: "pending" | "confirmed" | "preparing" | "out-for-delivery" | "delivered" | "cancelled";
  placedAt: Date;
  updatedAt: Date;
}

const orderItemSchema = new Schema<IOrderItem>(
  {
    item: { type: Schema.Types.ObjectId, ref: "Menu", required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    totalPrice: { type: Number, required: true }, // price * quantity saved for history
  },
  { _id: false }
);

const orderSchema = new Schema<IOrder>(
  {
    user: {
      id: { type: Schema.Types.ObjectId, ref: "User", required: true },
      name: { type: String, required: true },
      email: { type: String, required: true },
    },
    items: { type: [orderItemSchema], required: true },
    deliveryAddress: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      zip: { type: String, required: true },
      country: { type: String, required: true },
    },
    totalAmount: { type: Number, required: true },
    paymentInfo: {
      paymentId: { type: String, default: null },
      method: { type: String, default: null },
      status: { type: String, enum: ["pending", "paid", "failed"], default: "pending" },
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "preparing", "out-for-delivery", "delivered", "cancelled"],
      default: "pending",
    },
    placedAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: { createdAt: "placedAt", updatedAt: "updatedAt" },
  }
);

export const Order = mongoose.model<IOrder>("Order", orderSchema);
