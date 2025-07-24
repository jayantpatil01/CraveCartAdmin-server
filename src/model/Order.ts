import mongoose, { Document, Schema, Types, Model } from "mongoose";

export interface IOrderItem {
  item: Types.ObjectId; // Reference to Menu item
  quantity: number;
  price: number;
}

export interface IOrder extends Document {
  user: {
    id: Types.ObjectId;
    name?: string;  // optional, you can add if needed
  };
  address: Types.ObjectId; // Reference to an Address document
  items: IOrderItem[];
  paymentMode: "COD" | "Online";
  transactionId?: string; // Razorpay payment ID if Online
  status:
    | "pending"
    | "preparing"
    | "ordered"
    | "out for delivery"
    | "delivered";
  amount: number; // total order amount
  createdAt?: Date;
  updatedAt?: Date;
}

const orderItemSchema = new Schema<IOrderItem>(
  {
    item: { type: Schema.Types.ObjectId, ref: "Menu", required: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true },
  },
  { _id: false }
);

const orderSchema = new Schema<IOrder>(
  {
    user: {
      id: { type: Schema.Types.ObjectId, ref: "User", required: true },
      name: { type: String }, 
    },
    address: {
      type: Schema.Types.ObjectId,
      ref: "Address",
      required: true,
    },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: [(val: IOrderItem[]) => val.length > 0, "Order must have at least one item"],
    },
    paymentMode: {
      type: String,
      enum: ["COD", "Online"],
      required: true,
    },
    transactionId: {
      type: String,
      required: function () {
        return this.paymentMode === "Online";
      },
    },
    status: {
      type: String,
      enum: ["pending", "preparing", "ordered", "out for delivery", "delivered"],
      default: "pending",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { timestamps: true }
);

const Order: Model<IOrder> = mongoose.model<IOrder>("Order", orderSchema);

export default Order;
