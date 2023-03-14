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
    
    plugin.controllers.user.me = async (ctx) => {
        const user = await strapi.service('api::user.user').me();

        return {
            data: user,
            meta: {}
        };
    };
    
    plugin.controllers.user.find = async (ctx) => {
        const query = ctx.request.query;

        const result = await strapi.service('api::user.user').find(query);

        return result;
    };
    
    plugin.controllers.user.findOne = async (ctx) => {
        const { id } = ctx.params;
        const params = ctx.request.query;
        
        const result = await strapi.service('api::user.user').findOne(id, params);
        
        if(!result){
            return ctx.notFound('Not Found', {});
        }

        return {
            data: result,
            meta: {}
        };
    };
  
    
    plugin.controllers.user.create = async (ctx) => {        
        const data = ctx.request.body.data;
        const files = ctx.request.files;
        
        const result = await strapi.service('api::user.user').create({
            data: {
                username: data.email,
                email: data.email,
                provider: 'local',
                role: (!data?.role || data.role == process.env.ATS_SUPERADMINISTRATOR_ROLE) ? process.env.ATS_LIMITED_ROLE : data.role,
                firstName: data.firstName,
                lastName: data.lastName,
                phone: data.phone,
                timezone: data.timezone,
                confirmed: 1,
            },
            files: {
                ...files
            }
        });

        return {
            data: result,
            meta: {}
        };
    };
  
    
    plugin.controllers.user.update = async (ctx) => {
        const { id } = ctx.params;
        const data = ctx.request.body.data;
        const files = ctx.request.files;

        const result = await strapi.service('api::user.user').update(id, {
            data: {
                role: data.role,
                firstName: data.firstName,
                lastName: data.lastName,
                phone: data.phone,
                timezone: data.timezone,
                emailSignature: data.emailSignature,
            },
            files: {
                ...files
            }
        });

        return {
            data: result,
            meta: {}
        };
    };
  
    
    plugin.controllers.user.destroy = async (ctx) => {
        const { id } = ctx.params;

        const result = await strapi.service('api::user.user').destroy(id);

        return {
            data: result,
            meta: {}
        };
    }
  
    return plugin
}
