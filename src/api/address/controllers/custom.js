import jwt from "jsonwebtoken";

export default {
  async create(ctx) {
    try {
      const {
        Name,
        MobileNumber,
        Email,
        Country,
        Address_line_1,
        Address_line_2,
        City,
        State,
        Postal_code,
        type,
      } = ctx.request.body;

      if (
        !Name ||
        !MobileNumber ||
        !Email ||
        !Country ||
        !Address_line_1 ||
        !Address_line_2 ||
        !City ||
        !State ||
        !Postal_code ||
        !type
      ) {
        return ctx.badRequest("All required fields must be provided.");
      }
      const authHeader = ctx.request.headers.authorization;
      if (!authHeader) {
        return ctx.unauthorized("Authorization header missing");
      }

      const token = authHeader.split(" ")[1];
      if (!token) {
        return ctx.unauthorized("No token provided");
      }
      let userId;
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // @ts-ignore
        userId = decoded.id;
      } catch (err) {
        return ctx.unauthorized("Invalid or expired token");
      }

      const NewAddress = await strapi.db.query("api::address.address").create({
        data: {
          Name,
          MobileNumber,
          Email,
          Country,
          Address_line_1,
          Address_line_2,
          City,
          State,
          Postal_code,
          type,
          register: userId,
        },
      });
      return ctx.send({
        message: "Address created successfully",
        address: NewAddress,
      });
    } catch (err) {
      console.error("Error creating address:", err);
      return ctx.internalServerError(err.message);
    }
  },
  async find(ctx) {
    try{
    const authHeader = ctx.request.headers.authorization;
    if (!authHeader) {
      return ctx.unauthorized("Authorization header missing");      
    }
    const token = authHeader.split(" ")[1];
    if (!token) {
      return ctx.unauthorized("No token provided"); 
    }
    let userId;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      // @ts-ignore
      userId = decoded.id;
    } catch (err) {
      return ctx.unauthorized("Invalid or expired token");
    }
     const userAddresses = await strapi.db.query("api::address.address").findMany({
       where: { register: userId },
     });
     return ctx.send({ addresses: userAddresses });
    }catch(err){
        console.error("Error fetching addresses:", err);
        return ctx.internalServerError(err.message);
    }

  },
  async delete(ctx) {
    try{
    const { id } = ctx.request.params;
    if (!id) {
      return ctx.badRequest("Address ID must be provided.");
    }

    const authHeader = ctx.request.headers.authorization;
    if (!authHeader) {
      return ctx.unauthorized("Authorization header missing");  
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return ctx.unauthorized("No token provided");
    }
    let userId; 
    try {         
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      // @ts-ignore
      userId = decoded.id;  
    } catch (err) {
      return ctx.unauthorized("Invalid or expired token");
    }

    const address = await strapi.db.query("api::address.address").delete({
      where: { id: id, register: userId },
    });
    return ctx.send({ message: "Address deleted successfully", address });

    }catch(err){
        console.error("Error deleting address:", err);
        return ctx.internalServerError(err.message);
    }
  }
};
