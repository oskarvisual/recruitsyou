'use strict';

/**
 * job-question service
 */
//TODO: AGREGAR LOGICA PARA FILTAR POR PREGUNTAS DE TRABAJO PARA CANDIDATOS
//TODO: LOGICA PARA CANDIDATO
//TODO: SI EL PLAN NO TIENE FILES NO PERMITIR HACER RESPUESTA DE VIDEO O ARCHIVO
const { createCoreService } = require('@strapi/strapi').factories;
const api = 'api::job-question.job-question';

module.exports = createCoreService(api, ({ strapi }) => ({
    async find(params) {
        const user = await strapi.service('api::user.user').me();
        params.filters = { company: user.company.id }
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
        params.populate = {
            alternatives: true,
        }

        const result = await strapi.entityService.findMany(api, params);
        if(result.length == 0){ return null; }
    
        return result[0];
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
        
        const result = await strapi.entityService.findMany(api, {
            filters: {
                $and: [
                    {
                        company: user.company.id,
                    },
                    {
                        id: entityId,
                    },
                ],
            },
        });
        if(result.length == 0){ return null; }

        const response = await super.update(entityId, params);
    
        return response;
    },
    async delete(entityId, params) {
        const user = await strapi.service('api::user.user').me();
        
        const result = await strapi.entityService.findMany(api, {
            filters: {
                $and: [
                    {
                        company: user.company.id,
                    },
                    {
                        id: entityId,
                    },
                ],
            },
        });
        if(result.length == 0){ return null; }
        
        const response = await super.delete(entityId, params);

        return response;
    }
}));
