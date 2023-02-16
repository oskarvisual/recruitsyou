'use strict';

/**
 * email-template service
 */
const { createCoreService } = require('@strapi/strapi').factories;
const api = 'api::email-template.email-template';

module.exports = createCoreService(api, ({ strapi }) => ({
    async default(entityId, type) {
        const user = await strapi.service('api::user.user').me();

        await strapi.db.query(api).updateMany({
            filters: {
                $and: [
                    {
                        company: user.company.id,
                    },
                    {
                        type: type,
                    },
                ],
            },
            data: {
                default: 0,
            },
        });

        const response = await super.update(entityId, {
            data: {
                default: 1,
            }
        });

        return response;
    },
    async find(params) {
        const user = await strapi.service('api::user.user').me();

        let filters = {
            $and: [
                {
                    company: user.company.id,
                },
            ],
        }
        if(params.filters !== undefined){
            if(params.filters.type !== undefined){
                filters.$and.push({ type: params.filters.type });
            }
        }
        params.filters = filters;
        params.populate = {}

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
        params.populate = {}

        const result = await strapi.entityService.findMany(api, params);
        if(result.length == 0){ return null; }
    
        return result[0];
    },
    async create(params) {
        const ctx = strapi.requestContext.get();
        const user = await strapi.service('api::user.user').me();
        params.data.company = user.company.id;

        if(!user.company.plan.customize){ 
            ctx.send({
                data: null,
                error: {
                    name: "PlanLimitationError",
                    message: "Your plan does not allow you to perform this action",
                    details: {}
                }
            }, 500); 
        }
        
        const response = await super.create(params);

        return response;
    },
    async update(entityId, params) {
        const ctx = strapi.requestContext.get();
        const user = await strapi.service('api::user.user').me();
        params.data.company = user.company.id;

        if(!user.company.plan.customize){ 
            ctx.send({
                data: null,
                error: {
                    name: "PlanLimitationError",
                    message: "Your plan does not allow you to perform this action",
                    details: {}
                }
            }, 500); 
        }
        
        const result = await strapi.service(api).findOne(entityId);
        if(result == null){ return null; }

        const response = await super.update(entityId, params);
    
        return response;
    },
    async delete(entityId, params) {
        const ctx = strapi.requestContext.get();
        const user = await strapi.service('api::user.user').me();
        
        const result = await strapi.service(api).findOne(entityId);
        if(result == null){ return null; }

        if(result.default == true){ 
            return ctx.send({
                data: null,
                error: {
                    name: "DefaultDeleteError",
                    message: "It is not possible to delete a default element",
                    details: {}
                }
            }, 400); 
        }
        
        const response = await super.delete(entityId, params);

        return response;
    }
}));
