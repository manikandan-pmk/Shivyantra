import bcrypt from "bcryptjs";
import twilio from "twilio";

const client = twilio(process.env.TWILIO_ACCOUNT, process.env.TWILIO_TOKEN);

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

      const generateOTP = Math.floor(10000 + Math.random() * 90000).toString();

      const OtpExpiry = new Date(Date.now() + 5 * 60 * 1000);

      try {
        await client.messages.create({
          from: "+15188401283",
          to: MobileNumber,
          subject: "Registeration Verification Code",
          body: `Hello ${Name} , Your Code Is ${generateOTP} and Expire in 5 Mins,
        `,
        });
      } catch (err) {
        return ctx.badRequest(err.message);
      }

      const user = await strapi.db.query("api::register.register").create({
        data: {
          Name,
          Email,
          MobileNumber,
          Password: hashpassword,
          Otp: generateOTP,
          userVerify: "notVerified",
          OtpExpiryAt: OtpExpiry,
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
  async verifyOtp(ctx) {
    try {
      const { MobileNumber, Otp, OtpExpiryAt } = ctx.request.body;
      if (!Otp) {
        return ctx.badRequest("Field is Required");
      }
      const user = await strapi.db.query("api::register.register").findOne({
        where: { MobileNumber },
      });

      if (!user) {
        return ctx.badRequest("User Not Found");
      }

      if (user.userVerify === "verified") {
        return ctx.badRequest("User Already verified");
      }

      if (user.Otp !== Otp) {
        return ctx.badRequest("Otp is Invalid");
      }

      if (new Date() > new Date(user.OtpExpiryAt)) {
        return ctx.badRequest("Otp is Expired");
      }
      const verifiedUser = await strapi.db
        .query("api::register.register")
        .update({
          where: { id: user.id },
          data: {
            userVerify: "verified",
            Otp: null,
            OtpExpiryAt: null,
          },
        });
      return ctx.send({
        success: true,
        message: "Mobile number Verified SuccessFully",
        data: verifiedUser,
      });
    } catch (err) {
      return ctx.internalServerError(err.message);
    }
  },
  async resendOtp(ctx) {
    try {
      const { MobileNumber } = ctx.request.body;

      if (!MobileNumber) {
        return ctx.badRequest("Mobile Number is Required");
      }

      const user = await strapi.db.query("api::register.register").findOne({
        where: { MobileNumber },
      });

      if (user.userVerify === "verified") {
        return ctx.badRequest("User Already Verified");
      }

      const generateOTP = Math.floor(10000 + Math.random() * 90000).toString();
      const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

      await client.messages.create({
        from: "+15188401283",
        to: MobileNumber,
        subject: "Registeration Verification Code",
        body: `Hello ${user.Name} , Your Re-Code Is ${generateOTP} and Expire in 5 Mins,
        `,
      });

      const updateUser = await strapi.db
        .query("api::register.register")
        .update({
          where: { id: user.id },
          data: {
            Otp: generateOTP,
            otpExpiryAt: otpExpiry,
          },
        });

      return ctx.send({
        sucess: true,
        message: "New OTP sent successfully",
        data: {
          id: updateUser.id,
          MobileNumber: updateUser.MobileNumber,
        },
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
