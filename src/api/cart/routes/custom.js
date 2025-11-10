export default {
    routes: [
        {
            method: "POST",
            path: "/cart",
            handler: "custom.AddToCart",
            config:{auth:false},
        },
        {
            method: "GET",
            path: "/cart",
            handler: "custom.GetCart",
            config:{auth:false},
        },
        {
            method: "DELETE",
            path: "/cart/:id?",
            handler: "custom.ClearCart",
            config:{auth:false},
        },
        {
            method: "PUT",
            path: "/cart/:id/quantity",
            handler: "custom.UpdateCart",
            config:{auth:false},
        }
    ],
}