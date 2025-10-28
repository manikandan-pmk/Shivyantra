export default {
  routes: [
    {
      method: "POST",
      path: "/register",
      handler: "custom.register",
      config: { auth: false },
    },
    {
      method: "GET",
      path: "/register",
      handler: "custom.find",
      config: { auth: false },
    },
    {
      method: "DELETE",
      path: "/register/:id?",
      handler: "custom.delete",
      config: { auth: false },
    },
    {
      method: "PUT",
      path: "/register/:id?",
      handler: "custom.update",
      config: { auth: false },
    },
    {
      method : "POST",
      path : "/register/otp-verify",
      handler:"custom.verifyOtp",
      config : {auth : false}
    },
    {
      method : "POST",
      path : "/register/resend-otp",
      handler:"custom.resendOtp",
      config : {auth : false}
    },
    {
        method : "POST",
        path :"/login",
        handler : "custom.login",
        config : {auth : false}
    }

  ],
};
