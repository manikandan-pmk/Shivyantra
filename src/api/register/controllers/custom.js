import bcrypt from "bcryptjs";

export default {
  async register(ctx) {
    try {
      const { Name, MobileNumber, Email, Password } = ctx.request.body;

      if (!Name || !MobileNumber || !Email || !Password) {
        return ctx.badRequest("Require All Fields");
      }

      const checkUser = await strapi.db
        .query("api::register.register")
        .findOne({
          where: { Email },
        });

      if (checkUser) {
        return ctx.badRequest("User Already Registered");
      }

      const hashpassword = await bcrypt.hash(Password, 10);

      const user = await strapi.db.query("api::register.register").create({
        data: {
          Name,
          Email,
          MobileNumber,
          Password: hashpassword,
        },
      });
      console.log(user);
      return ctx.send({
        success: true,
        data: user,
      });
    } catch (err) {
      return ctx.internalServerError(err.message);
    }
  },
  async find(ctx) {
    try {
      const users = await strapi.db
        .query("api::register.register")
        .findMany({});
      return ctx.send(users);
    } catch (err) {
      return ctx.internalServerError(err.message);
    }
  },
  async delete(ctx) {
    try {
      const { id } = ctx.params;

      if (id) {
        const idUser = await strapi.db.query("api::register.register").delete({
          where: { id },
        });
        if (!idUser) {
          return ctx.badRequest("User Not Found");
        }
        return ctx.send({
          success: true,
          data: idUser,
        });
      } else {
        const deleteAll = await strapi.db
          .query("api::register.register")
          .deleteMany({});

        if (!deleteAll) {
          return ctx.badRequest("No User Found");
        }
        return ctx.send({
          success: true,
          data: deleteAll,
        });
      }
    } catch (err) {
      return ctx.internalServerError(err.message);
    }
  },
  async update(ctx) {
    try {
      const { id } = ctx.params;
      const { Name, Email, MobileNumber, Password } = ctx.request.body;

      if (!id) {
        return ctx.badRequest("User ID is required");
      }

      // check if user exists
      const existingUser = await strapi.db
        .query("api::register.register")
        .findOne({ where: { id } });

      if (!existingUser) {
        return ctx.badRequest("User Not Found");
      }

      // hash password if provided
      let hashPassword = existingUser.Password;
      if (Password) {
        hashPassword = await bcrypt.hash(Password, 10);
      }

      // update user
      const updatedUser = await strapi.db
        .query("api::register.register")
        .update({
          where: { id },
          data: {
            ...(Name && { Name }),
            ...(Email && { Email }),
            ...(MobileNumber && { MobileNumber }),
            Password: hashPassword,
          },
        });

      return ctx.send({
        success: true,
        message: "User updated successfully",
        data: updatedUser,
      });
    } catch (err) {
      console.error("Update error:", err);
      return ctx.internalServerError(err.message);
    }
  },
};
