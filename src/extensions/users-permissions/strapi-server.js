module.exports = (plugin) => {
    plugin.controllers.auth.refreshToken = async (ctx) => {
        const newJwt = strapi.plugins['users-permissions'].services.jwt.issue({
            id: ctx.state.user.id
        })
        return { jwt: newJwt }
    }
  
    plugin.routes['content-api'].routes.push({
        method: 'POST',
        path: '/auth/refresh-token',
        handler: 'auth.refreshToken',
        config: {
            prefix: ''
        }
    });
    
    plugin.controllers.user.find = async (ctx) => {
        ctx.send({
            data: null,
            error: {
                status: 404,
                name: 'NotFoundError',
                message: 'Not Found'
            }
        }, 404);
    };
    
    plugin.controllers.user.findOne = async (ctx) => {
        ctx.send({
            data: null,
            error: {
                status: 404,
                name: 'NotFoundError',
                message: 'Not Found'
            }
        }, 404);
    };
  
    return plugin
}
