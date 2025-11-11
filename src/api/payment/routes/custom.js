export default {
    routes: [{
        method: "POST",
        path: "/payment",
        handler: "custom.create",
        config: {auth:false},
    },{
        method: "GET",
        path: "/payment/:id?",
        handler: "custom.find",
        config: {auth:false},
    },{
        method: "POST",
        path: "/payment/verify",
        handler: "custom.verifyPayment",
        config: {auth:false},
    }]
}