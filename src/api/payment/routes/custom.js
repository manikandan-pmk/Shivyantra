export default {
    routes: [{
        method: "POST",
        path: "/payment",
        handler: "custom.create",
        config: {auth:false},
    }]
}