import bcrypt from "bcryptjs";
import { Resend } from "resend";
import jwt from "jsonwebtoken";
import crypto from "crypto";


const resend = new Resend(process.env.RESEND_API_KEY);

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
        await resend.emails.send({
          from: "Shivyantra <onboarding@resend.dev>",
          to: Email,
          subject: "Your OTP for Shivyantra Verification",
          html: `
            <div style="font-family:sans-serif; padding:10px">
              <h2>Hi ${Name},</h2>
              <p>Your OTP for verification is:</p>
              <h1 style="color:#4CAF50;">${generateOTP}</h1>
              <p>This OTP will expire in 5 minutes.</p>
              <p>Thank you,<br/>Shivyantra Team</p>
            </div>
          `,
        });
      } catch (emailError) {
        console.error("Error sending OTP email:", emailError);
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
          isLoginned: false,
        },
      });
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
      // @ts-ignore
      // @ts-ignore
      const { Email, Otp, OtpExpiryAt } = ctx.request.body;
      if (!Otp) {
        return ctx.badRequest("Field is Required");
      }
      const user = await strapi.db.query("api::register.register").findOne({
        where: { Email },
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
      const { Email } = ctx.request.body;

      if (!Email) {
        return ctx.badRequest("Mobile Number is Required");
      }

      const user = await strapi.db.query("api::register.register").findOne({
        where: { Email },
      });

      if (user.userVerify === "verified") {
        return ctx.badRequest("User Already Verified");
      }

      const generateOTP = Math.floor(10000 + Math.random() * 90000).toString();
      const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

      try {
        await resend.emails.send({
          from: "Shivyantra <onboarding@resend.dev>",
          to: Email,
          subject: "Your OTP for Shivyantra Verification",
          html: `
            <div style="font-family:sans-serif; padding:10px">
              <h2>Hi ${user.Name},</h2>
              <p>Your OTP for verification is:</p>
              <h1 style="color:#4CAF50;">${generateOTP}</h1>
              <p>This Re-OTP will expire in 5 minutes.</p>
              <p>Thank you,<br/>Shivyantra Team</p>
            </div>
          `,
        });
      } catch (emailError) {
        console.error("Error sending OTP email:", emailError);
      }

      const updateUser = await strapi.db
        .query("api::register.register")
        .update({
          where: { id: user.id },
          data: {
            Otp: generateOTP,
            OtpExpiryAt: otpExpiry,
          },
        });

      return ctx.send({
        sucess: true,
        message: "New OTP sent successfully",
        data: {
          id: updateUser.id,
          Email: updateUser.Email,
          otpExpiryAt: otpExpiry,
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
      const {
        Name,
        Email,
        MobileNumber,
        Password,
        isLoginned,
        refresh_token,
        lastLoginAt,
        forgotPasswordUrl,
        // @ts-ignore
        lastLogoutIn,
        forgotPasswordUrlExpiryAt,
      } = ctx.request.body;

      if (!id) {
        return ctx.badRequest("User ID is required");
      }

      const existingUser = await strapi.db
        .query("api::register.register")
        .findOne({ where: { id } });

      if (!existingUser) {
        return ctx.badRequest("User Not Found");
      }

      let hashPassword = existingUser.Password;
      if (Password) {
        hashPassword = await bcrypt.hash(Password, 10);
      }

      // Build dynamic update data
      const updateData = {
        ...(Name && { Name }),
        ...(Email && { Email }),
        ...(MobileNumber && { MobileNumber }),
        Password: hashPassword,
      };

      // ✅ Update boolean correctly (even false)
      if (typeof isLoginned === "boolean") {
        // @ts-ignore
        updateData.isLoginned = isLoginned;
      }

      // ✅ Handle refresh_token, including null
      if (refresh_token !== undefined) {
        // @ts-ignore
        updateData.refresh_token = refresh_token;
      }

      // ✅ Optional lastLoginAt update
      if (lastLoginAt) {
        // @ts-ignore
        updateData.lastLoginAt = lastLoginAt;
      }
      // @ts-ignore
      if (lastLogoutIn) updateData.lastLogoutIn = lastLogoutIn;

      if (forgotPasswordUrl !== undefined)
        // @ts-ignore
        updateData.forgotPasswordUrl = forgotPasswordUrl;
      if (forgotPasswordUrlExpiryAt !== undefined)
        // @ts-ignore
        updateData.forgotPasswordUrlExpiryAt = forgotPasswordUrlExpiryAt;

      const updatedUser = await strapi.db
        .query("api::register.register")
        .update({
          where: { id },
          data: updateData,
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
  async login(ctx) {
    try {
      const { Email, Password } = ctx.request.body;

      // 1️⃣ Basic validation
      if (!Email || !Password) {
        return ctx.badRequest("All fields are required");
      }

      // 2️⃣ Find user
      const user = await strapi.db.query("api::register.register").findOne({
        where: { Email },
      });

      if (!user) {
        return ctx.badRequest("User not found. Please register first.");
      }

      // 3️⃣ Check verification
      if (user.userVerify !== "verified") {
        return ctx.badRequest("User not verified. Please verify your email.");
      }

      // 4️⃣ Prevent duplicate login
      if (user.isLoginned === true || user.refresh_token !== null) {
        return ctx.badRequest("User already logged in.");
      }

      // 5️⃣ Verify password
      const isPasswordValid = await bcrypt.compare(Password, user.Password);
      if (!isPasswordValid) {
        return ctx.badRequest("Invalid credentials.");
      }

      // 6️⃣ Create JWT token
      const token = jwt.sign(
        {
          id: user.id,
          email: user.Email,
          name: user.Name,
        },
        process.env.JWT_SECRET,
        { expiresIn: "7d" } // valid for 7 days
      );

      // 7️⃣ Update user with token + login info
      await strapi.db.query("api::register.register").update({
        where: { id: user.id },
        data: {
          lastLoginAt: new Date(Date.now()),
          refresh_token: token,
          isLoginned: true,
        },
      });

      // 8️⃣ Fetch updated user
      const updatedUser = await strapi.db
        .query("api::register.register")
        .findOne({
          where: { id: user.id },
        });

      // 9️⃣ Remove password before returning
      const { Password: _, ...safeUser } = updatedUser;

      return ctx.send({
        success: true,
        message: "Login successful",
        user: safeUser,
      });
    } catch (err) {
      console.error("Login Error:", err);
      return ctx.internalServerError(err.message || "Something went wrong.");
    }
  },

  async logout(ctx) {
    try {
      // @ts-ignore
      const { id } = ctx.params;
      const { refresh_token } = ctx.request.body;

      const userSession = await strapi.db
        .query("api::register.register")
        .findOne({
          where: { refresh_token },
        });

      if (!userSession) {
        return ctx.badRequest("Token not found, please login again");
      }

      const date = new Date(Date.now());

      const updateSession = await strapi.db
        .query("api::register.register")
        .update({
          where: { id: userSession.id },
          data: {
            refresh_token: null,
            isLoginned: false,
            lastLogoutIn: date,
          },
        });

      return ctx.send({
        success: true,
        message: `Logout successful for ${userSession.Email}`,
        data: updateSession,
      });
    } catch (err) {
      return ctx.internalServerError(err.message || err);
    }
  },
  async forgotPassword(ctx) {
    try {
      // @ts-ignore
      const { id } = ctx.params;

      const { Email } = ctx.request.body;

      const user = await strapi.db.query("api::register.register").findOne({
        where: { Email },
      });

      if (!user) {
        return ctx.badRequest("User Not Found");
      }

      if (user.isLoginned && user.refresh_token) {
        return ctx.badRequest(
          "Cannot Sent link while logged in. Please log out first."
        );
      }

      if (user.userVerify !== "verified") {
        return ctx.badRequest("User not Verified , Please Verify Email");
      }

      const token = crypto.randomBytes(32).toString("hex");
      const ExpiryAt = new Date(Date.now() + 5 * 60 * 1000);

      const Url = `http://localhost:5173/reset-password?email=${encodeURIComponent(Email)}&code=${token}`;

      if (user.forgotPasswordUrl !== null) {
        return ctx.badRequest(
          "Reset Link ALready Sent , Please Try Again Later"
        );
      }

      try {
        await resend.emails.send({
          from: "Shivyantra <onboarding@resend.dev>",
          to: user.Email,
          subject: "Your Link for Reset-Password",
          html: `
           <div style="font-family:sans-serif; padding:10px">
            <h2>Hi ${user.Name},</h2>
            <p>Click below to reset your password (link valid for 5 minutes):</p>
            <a href="${Url}" style="color:#4CAF50;">${Url}</a>
            <p>Thank you,<br/>Shivyantra Team</p>
          </div>
          `,
        });
      } catch (err) {
        return ctx.badRequest(err.message || err);
      }
      const updateUser = await strapi.db
        .query("api::register.register")
        .update({
          where: { id: user.id },
          data: {
            forgotPasswordUrl: Url,
            forgotPasswordUrlExpiryAt: ExpiryAt,
          },
        });

      return ctx.send({
        success: true,
        message: `Link Sent To Your ${user.Email}`,
        data: updateUser,
      });
    } catch (err) {
      return ctx.internalServerError(err.message || err);
    }
  },
  async resetPassword(ctx) {
    try {
      const { Email, code, newPassword } = ctx.request.body;

      if (!Email || !code || !newPassword) {
        return ctx.badRequest("Email,Code,newPassword is Required");
      }
      const user = await strapi.db.query("api::register.register").findOne({
        where: { Email },
      });

      if (!user) {
        return ctx.badRequest("User Not Found");
      }

      if (user.isLoginned && user.refresh_token) {
        return ctx.badRequest(
          "Cannot reset password while logged in. Please log out first."
        );
      }

      if (!user.forgotPasswordUrl || !user.forgotPasswordUrlExpiryAt) {
        return ctx.badRequest("Reset token not found or expired.");
      }

      const expiry = new Date(user.forgotPasswordUrlExpiryAt);
      const now = new Date();

      if (now > expiry) {
        return ctx.badRequest("Reset link has expired. Please request again.");
      }

      const storedUrl = user.forgotPasswordUrl;
      const storedCode = new URL(storedUrl).searchParams.get("code");

      if (storedCode !== code) {
        return ctx.badRequest("invalid reset code");
      }

      const comparePassword = await bcrypt.compare(newPassword, user.Password);

      if (comparePassword) {
        return ctx.badRequest(
          "You are Entering Same Password, Please try different Password"
        );
      }

      const updatedpassword = await bcrypt.hash(newPassword, 10);

      const updatedUser = await strapi.db
        .query("api::register.register")
        .update({
          where: { id: user.id },
          data: {
            Password: updatedpassword,
            forgotPasswordUrl: null,
            forgotPasswordUrlExpiryAt: null,
          },
        });

      return ctx.send({
        success: true,
        message: "Password has been reset successfully.",
        data: {
          id: updatedUser.id,
          Email: updatedUser.Email,
          updatedUser,
        },
      });
    } catch (err) {
      return ctx.badRequest(err.message || err);
    }
  }, 

};
