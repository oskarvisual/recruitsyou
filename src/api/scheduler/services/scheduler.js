'use strict';

/**
 * scheduler service
 */

const { createCoreService } = require('@strapi/strapi').factories;
const api = 'api::scheduler.scheduler';

module.exports = createCoreService(api, ({ strapi }) => ({
    async find(params) {
        const user = await strapi.service('api::user.user').me();

        params.filters = {
            $and: [
                {
                    company: user.company.id,
                },
            ],
        }

        if(user.role.name != 'Administrator'){
            params.filters.$and.push({ user: user.id })
        }
        params.populate = { user: true };
        
        const result = await super.find(params);
        
        return result;
    },
    async findOne(entityId, params = {}) {
        const user = await strapi.service('api::user.user').me();

        params.filters = {
            $and: [
                {
                    company: user.company.id,
                },
                {
                    id: entityId,
                },
            ],
        }

        if(user.role.name != 'Administrator'){
            params.filters.$and.push({ user: user.id })
        }
        params.populate = { user: true };

        const result = await strapi.entityService.findMany(api, params);
        if(result.length == 0){ return null; }
    
        return result[0];
    },
    async create(params) {
        const ctx = strapi.requestContext.get();

        const user = await strapi.service('api::user.user').me();

        params.data.company = user.company.id;

        if(user.role.name != 'Administrator' || params.data.user == undefined){
            params.data.user = user.id;
        }else{
            const userData = await strapi.service('api::user.user').findOne(params.data.user, {
                populate: {}
            });
            if(userData == null){
                return ctx.notFound('user Not Found', {});
            }
        }
        
        if(!user.company.plan.customize){ 
            return ctx.forbidden('Your plan does not allow you to perform this action', {});
        }
        
        const response = await super.create(params);

        return response;
    },
    async update(entityId, params) {
        const ctx = strapi.requestContext.get();

        const user = await strapi.service('api::user.user').me();
        
        params.data.company = user.company.id;

        if(user.role.name != 'Administrator' || params.data.user == undefined){
            params.data.user = user.id;
        }else{
            const dataUser = await strapi.service('api::user.user').findOne(params.data.user);
        
            if(dataUser == null){
                return ctx.notFound('user Not Found', {});
            }
        }
        
        if(!user.company.plan.customize){ 
            return ctx.forbidden('Your plan does not allow you to perform this action', {});
        }

        const result = await strapi.service(api).findOne(entityId);
        if(result == null){ return null; }

        const response = await super.update(entityId, params);

        return response;
    },
    async delete(entityId, params) {
        const user = await strapi.service('api::user.user').me();

        const result = await strapi.service(api).findOne(entityId);
        if(result == null){ return null; }
        
        const response = await super.delete(entityId, params);

        return response;
    }
}));
