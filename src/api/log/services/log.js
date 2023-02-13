'use strict';

/**
 * log service
 */
const ip = require('ip');

const { createCoreService } = require('@strapi/strapi').factories;
const api = 'api::log.log';

module.exports = createCoreService(api, ({ strapi }) => ({
    async find(params) {
        const user = await strapi.service('api::user.user').me();
        
        params.fields = [
            'log',
            'type',
            'ip',
            'createdAt',
            'updatedAt',
        ]
        params.filters = { company: user.company.id }
        params.populate = { user: true }

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
        params.populate = {
            job: true,
            user: true,
            candidate: true,
        }

        const result = await strapi.entityService.findMany(api, params);
        if(result.length == 0){ return null; }
    
        return result[0];
    },
    async create(params) {
        const user = await strapi.service('api::user.user').me();
        
        if(user){
            params.data.user = user.id;
            params.data.company = user.company.id;
        }
        params.data.ip = ip.address();
        
        const response = await super.create(params);

        return response;
    },
}));
