'use strict';

/**
 * notification service
 */
//TODO: AGREGAR EN USUARIO OPCIONES PARA ACTIVAR O DESACTIVAR NOTIFICACIONES (EN ME MODIFICAR)
//TODO: CONFIGURAR WEB PUSH
//const webpush = require('web-push');

const { createCoreService } = require('@strapi/strapi').factories;
const api = 'api::notification.notification';

module.exports = createCoreService(api, ({ strapi }) => ({
    async find(params) {
        const user = await strapi.service('api::user.user').me();
        params.filters = { user: user.id }
        params.populate = {}
        
        const result = await super.find(params);
        
        return result;
    },
    async findOne(entityId, params = {}) {
        const user = await strapi.service('api::user.user').me();

        params.filters = {
            $and: [
                {
                    user: user.id,
                },
                {
                    id: entityId,
                },
            ],
        }
        params.populate = {}

        const result = await strapi.entityService.findMany(api, params);
        if(result.length == 0){ return null; }

        await strapi.entityService.update(api, entityId, {
            data: {
                viewed: 1
            }
        });
    
        return result[0];
    },
    //TODO: CONFIGURAR ENVIO DE WEB PUSH
    //TODO:: ENVIO POR USUARIO Y POR JOB
    async create(params) {
        const result = await super.create(params);

        return result;
    },
    async delete(entityId, params) {
        const user = await strapi.service('api::user.user').me();
        
        const result = await strapi.service(api).findOne(entityId);
        if(result == null){ return null; }
        
        const response = await super.delete(entityId, params);

        return response;
    }
}));
