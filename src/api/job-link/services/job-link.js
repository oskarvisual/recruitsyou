'use strict';

/**
 * job-link service
 */

const { createCoreService } = require('@strapi/strapi').factories;
const api = 'api::job-link.job-link';
//TODO: POPULATE
//TODO: CUANDO CANDIDATO TERMINA SE ELIMINA
//TODO: VER COMO HACER PARA MOSTRAR LA DATA SEGUN EL TIPO DE LINK COMO ONBOARDING, SCHEDULER, ETC
module.exports = createCoreService(api, ({ strapi }) => ({
    async find(params) {
        const user = await strapi.service('api::user.user').me();
        params.filters = { company: user.company.id }

        const result = await super.find(params);
        
        return result;
    },
    async findOne(entityId, params = {}) {
        const user = await strapi.service('api::user.user').me();

        if(user){
            params.filters= {
                $and: [
                    {
                        company: user.company.id,
                    },
                    {
                        id: entityId,
                    },
                ],
            }

            const result = await strapi.entityService.findMany(api, params);
            if(result.length == 0){ return null; }
        
            return result[0];
        }

        params.filters= {
            $and: [
                {
                    company: params.data.company,
                },
                {
                    code: entityId,
                },
            ],
        }

        const result = await strapi.entityService.findMany(api, params);
        if(result.length == 0){ return null; }
    
        return result;
    },
    async create(params) {
        const user = await strapi.service('api::user.user').me();
        params.data.company = user.company.id;
        
        const response = await super.create(params);

        return response;
    },
    async update(entityId, params) {
        const user = await strapi.service('api::user.user').me();
        params.data.company = user.company.id;
        
        const result = await strapi.service(api).findOne(entityId);
        if(!result){ return null; }

        const response = await super.update(entityId, params);
    
        return response;
    },
    async delete(entityId, params) {
        const user = await strapi.service('api::user.user').me();
        
        const result = await strapi.service(api).findOne(entityId);
        if(!result){ return null; }
        
        const response = await super.delete(entityId, params);

        return response;
    }
}));
