import jwt from "jsonwebtoken";
import Razorpay from "razorpay";
import crypto from "crypto";

export default {
  async create(ctx) {
    try {
      const authHeader = ctx.request.headers.authorization;
      if (!authHeader) return ctx.unauthorized("Authorization header missing");

      const token = authHeader.split(" ")[1];
      if (!token) return ctx.unauthorized("No token provided");

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      // @ts-ignore
      const userId = decoded?.id;
      if (!userId) return ctx.unauthorized("Invalid token payload");

      // 🛒 Fetch all cart items for this user
      const cartItems = await strapi.db.query("api::cart.cart").findMany({
        where: { register: { id: userId } },
        populate: true,
      });

      if (!cartItems || !cartItems.length)
        return ctx.badRequest("Cart is empty");

      // 💰 Calculate total
      const totalAmount = cartItems.reduce(
        (sum, item) =>
          sum + Number(item.Price || 0) * Number(item.Quantity || 1),
        0
      );

      if (totalAmount < 1) {
        return ctx.badRequest("Order amount must be at least ₹1");
      }

      // 🔑 Razorpay config
      const razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      });

      // 🧾 Create order
      const order = await razorpay.orders.create({
        amount: totalAmount * 100, // in paise
        currency: "INR",
        receipt: `receipt_${Date.now()}`,
        notes: { userId },
      });

      // 🔗 Create payment link
      const paymentLink = await razorpay.paymentLink.create({
        amount: totalAmount * 100,
        currency: "INR",
        accept_partial: false,
        reference_id: order.id,
        description: `Payment for cart items by user ${userId}`,
        notify: { sms: true, email: true },
        reminder_enable: true,
        callback_url: "http://localhost:5173/payment/success",
        callback_method: "get",
      });

      // 💾 Save payment in Strapi
      const payment = await strapi.db.query("api::payment.payment").create({
        data: {
          Amount: totalAmount,
          order_id: order.id,
          Condition: "Created", // ✅ match schema enum
          register: userId,
          payment_id: paymentLink.id,
        },
      });

      return ctx.send({
        success: true,
        message: "Payment link created successfully",
        totalAmount,
        razorpay_order_id: order.id,
        paymentLink: paymentLink.short_url,
        payment,
      });
    } catch (err) {
      console.error("Payment creation failed:", err);
      return ctx.internalServerError(err.message || "Something went wrong");
    }
  },
  async verifyPayment(ctx) {
    try {

      const authHeader = ctx.request.headers.authorization;
      if (!authHeader) return ctx.unauthorized("Authorization header missing");
      const token = authHeader.split(" ")[1];
      if (!token) return ctx.unauthorized("No token provided");
      let userId;
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // @ts-ignore 
        userId = decoded.id;    
        if (!userId) return ctx.unauthorized("Invalid token payload");
      } catch (err) {   
        return ctx.unauthorized("Invalid token"); 
      } 

      const {
        razorpay_payment_id,
        razorpay_order_id,
        razorpay_signature,
        razorpay_payment_link_status,
      } = ctx.request.body;

      // 🧩 Basic validation
      if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
        return ctx.badRequest("Missing payment verification parameters");
      }

      // 🔒 Verify signature
      const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
      hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
      const generatedSignature = hmac.digest("hex");

      if (generatedSignature !== razorpay_signature) {
        return ctx.badRequest("Invalid payment signature");
      }

      // ✅ Signature valid — update payment record
      const payment = await strapi.db
        .query("api::payment.payment")
        .findOne({ where: { order_id: razorpay_order_id } });

      if (!payment)
        return ctx.notFound("Payment record not found for given order_id");

      await strapi.db.query("api::payment.payment").update({
        where: { id: payment.id },
        data: {
          Condition:
            razorpay_payment_link_status === "paid" ? "Paid" : "Failed",
          payment_id: razorpay_payment_id,
        },
      });

      // 🧹 Optionally clear user cart after successful payment
      if (razorpay_payment_link_status === "paid") {
        await strapi.db.query("api::cart.cart").deleteMany({
          where: { register: { id: payment.register } },
        });
      }

      return ctx.send({
        success: true,
        message: "Payment verified successfully",
        status: razorpay_payment_link_status,
      });
    } catch (err) {
      console.error("Payment verification failed:", err.message);
      return ctx.internalServerError(err.message || "Something went wrong");
    }
  },
  async find(ctx) {
    try {
      const authHeader = ctx.request.headers.authorization;
      if (!authHeader) return ctx.unauthorized("Authorization header missing");
      const token = authHeader.split(" ")[1];
      if (!token) return ctx.unauthorized("No token provided");
      let userId;
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // @ts-ignore
        userId = decoded.id;
        if (!userId) return ctx.unauthorized("Invalid token payload");
      } catch (err) {
        return ctx.unauthorized("Invalid token");
      }
      const payment = await strapi.db.query("api::payment.payment").findMany({
        where : {register :userId}
      })
      return ctx.send({
        success: true,
        payment,
      });
    } catch (err) {
      console.error("Payment fetch failed:", err.message);
      return ctx.internalServerError(err.message || "Something went wrong");
    }
  },
};
