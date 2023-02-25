'use strict';

/**
 * task service
 */

const { createCoreService } = require('@strapi/strapi').factories;
const api = 'api::task.task';

module.exports = createCoreService(api, ({ strapi }) => ({
    async find(params) {
        const user = await strapi.service('api::user.user').me();
        
        params.filters = {
            $and: [
                {
                    company: user.company.id,
                },
                {
                    user: user.id,
                },
            ],
        }
        params.populate = { 
            candidate: true,
            job: true,
        };
        
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
                    user: user.id,
                },
                {
                    id: entityId,
                },
            ],
        }
        params.populate = { 
            candidate: true,
            job: true,
        };

        const result = await strapi.entityService.findMany(api, params);
        if(result.length == 0){ return null; }
    
        return result[0];
    },
    async create(params) {
        const user = await strapi.service('api::user.user').me();
        
        params.data.company = user.company.id;
        params.data.user = user.id;
        
        const response = await super.create(params);

        return response;
    },
    async update(entityId, params) {
        const user = await strapi.service('api::user.user').me();
        
        params.data.company = user.company.id;
        params.data.user = user.id;
        
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
