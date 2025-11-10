import jwt from "jsonwebtoken";

export default {
  async AddToCart(ctx) {
    try {
      const { ProductName, ProductImage, Quantity, Price } = ctx.request.body;

      // 🔐 Validate Authorization header
      const authHeader = ctx.request.header.authorization;
      if (!authHeader) return ctx.unauthorized("Authorization header missing");

      const token = authHeader.split(" ")[1];
      if (!token) return ctx.unauthorized("No token provided");

      // 🔍 Decode token
      let userId;
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // @ts-ignore
        userId = decoded.id;
      } catch (err) {
        return ctx.unauthorized("Invalid or expired token");
      }

      // 🧠 Ensure that user exists in register collection
      const userExists = await strapi.db.query("api::register.register").findOne({
        where: { id: userId },
      });
      if (!userExists) {
        return ctx.badRequest("No register record found for this user");
      }

      // 🛒 Create cart item and link with register
      const newCartItem = await strapi.db.query("api::cart.cart").create({
        data: {
          ProductName,
          ProductImage,
          Quantity,
          Price,
          register: { connect: [{ id: userId }] },
        },
      });

      return ctx.send({
        message: "Product added to cart",
        cartItem: newCartItem,
      });
    } catch (error) {
      console.error("AddToCart error:", error);
      return ctx.internalServerError(error.message);
    }
  },

  async GetCart(ctx) {
    try {
      const authHeader = ctx.request.header.authorization;
      if (!authHeader) return ctx.unauthorized("Authorization header missing");

      const token = authHeader.split(" ")[1];
      if (!token) return ctx.unauthorized("No token provided");

      let userId;
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // @ts-ignore
        userId = decoded.id;
      } catch (err) {
        return ctx.unauthorized("Invalid or expired token");
      }

      // ✅ Fetch all cart items for this register
      const cartItems = await strapi.db.query("api::cart.cart").findMany({
        where: { register: userId },
      });

      return ctx.send({
        message: "Cart fetched successfully",
        cartItems,
      });
    } catch (error) {
      console.error("GetCart error:", error);
      return ctx.internalServerError(error.message);
    }
  },

  async ClearCart(ctx) {
    try {
      const { id } = ctx.params;
      const authHeader = ctx.request.header.authorization;
      if (!authHeader) return ctx.unauthorized("Authorization header missing");

      const token = authHeader.split(" ")[1];
      if (!token) return ctx.unauthorized("No token provided");

      let userId;
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // @ts-ignore
        userId = decoded.id;
      } catch (err) {
        return ctx.unauthorized("Invalid or expired token");
      }

      // ✅ Only delete if it belongs to that user
      const cartItem = await strapi.db.query("api::cart.cart").findOne({
        where: { id, register: userId },
      });
      if (!cartItem) return ctx.notFound("Cart item not found for this user");

      await strapi.db.query("api::cart.cart").delete({
        where: { id },
      });

      return ctx.send({ message: "Cart item deleted successfully" });
    } catch (error) {
      console.error("ClearCart error:", error);
      return ctx.internalServerError(error.message);
    }
  },

  async UpdateCart(ctx) {
    try {
      const { id } = ctx.params;
      const { Quantity } = ctx.request.body;
      if (Quantity === undefined) return ctx.badRequest("Quantity is required");

      const token = ctx.request.header.authorization?.split(" ")[1];
      if (!token) return ctx.unauthorized("No token provided");

      let userId;
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // @ts-ignore
        userId = decoded.id;
      } catch (err) {
        return ctx.unauthorized("Invalid token");
      }

      // ✅ Validate user existence
      const userExists = await strapi.db.query("api::register.register").findOne({
        where: { id: userId },
      });
      if (!userExists) return ctx.badRequest("Invalid user");

      // ✅ Find and update cart item
      const cartItem = await strapi.db.query("api::cart.cart").findOne({
        where: { id, register: userId },
      });
      if (!cartItem) return ctx.notFound("Cart item not found");

      const pricePerItem = parseFloat(cartItem.Price) / cartItem.Quantity;
      const newPrice = pricePerItem * Quantity;

      const updatedItem = await strapi.db.query("api::cart.cart").update({
        where: { id },
        data: { Quantity, Price: newPrice },
      });

      return ctx.send({ message: "Cart updated successfully", cartItem: updatedItem });
    } catch (err) {
      console.error("UpdateCart error:", err);
      return ctx.internalServerError(err.message);
    }
  },
};
