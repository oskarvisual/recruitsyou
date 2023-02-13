'use strict';

/**
 * candidate-link service
 */

const { createCoreService } = require('@strapi/strapi').factories;
const api = 'api::candidate-link.candidate-link';
//TODO: LOGICA PARA REMPLAZAR LOGICA DE EMAIL Y CANDIDATE LINK

//TODO: LOGICA PARA AGREGAR A LA COLA, VALIDAR CORREOS
module.exports = createCoreService(api, ({ strapi }) => ({
    async findOne(entityId, params = {}) {
        params.filters = { code: entityId }
        params.populate = { candidates: true }

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
}));
