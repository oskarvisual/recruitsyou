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
        ctx.notFound('Not Found', {});
    };
    
    plugin.controllers.user.findOne = async (ctx) => {
        ctx.notFound('Not Found', {});
    };
  
    return plugin
}
