export default {
  routes: [
    {
      method: 'POST',
      path : "/address",
      handler: "custom.create",  
      config: {auth: false},
    },
    {
        method: 'GET',
        path : "/address",
        handler: "custom.find",
        config: {auth: false},
    },{
        method: 'DELETE',
        path : "/address/:id",
        handler: "custom.delete",
        config: {auth: false},
    }
  ],
};      
