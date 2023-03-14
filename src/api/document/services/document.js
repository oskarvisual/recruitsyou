'use strict';

/**
 * document service
 */

const { createCoreService } = require('@strapi/strapi').factories;
const api = 'api::document.document';
//TODO: FALTA LOGICA PARA LIMITAR ACCION POR PLAN
//TODO: FALTA POPULATE POR DEFECTO
module.exports = createCoreService(api, ({ strapi }) => ({
    async find(params) {
        const user = await strapi.service('api::user.user').me();
        params.filters = { company: user.company.id }

        params.populate = {
            user: true,
            job: true,
            candidate: true,
        }
        
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
            files: true,
            user: true,
            job: true,
            candidate: true,
            signers: true,
        }

        const result = await strapi.entityService.findMany(api, params);
        if(result.length == 0){ return null; }
    
        return result[0];
    },
    async create(params) {
        const ctx = strapi.requestContext.get();

        const user = await strapi.service('api::user.user').me();
        params.data.company = user.company.id;

        if(!user.company.plan.files){ 
            return ctx.forbidden('Your plan does not allow you to perform this action', {});
        }
        
        const response = await super.create(params);

        return response;
    },
    async update(entityId, params) {
        const ctx = strapi.requestContext.get();

        const user = await strapi.service('api::user.user').me();
        params.data.company = user.company.id;

        if(!user.company.plan.files){ 
            return ctx.forbidden('Your plan does not allow you to perform this action', {});
        }
        
        const result = await strapi.service(api).findOne(entityId);
        if(!result){ return null; }

        const response = await super.update(entityId, params);
    
        return response;
    },
    async delete(entityId, params) {
        const user = await strapi.service('api::user.user').me();
        
        const result = await strapi.service(api).findOne(entityId);
        if(!result){ return null; }

        await strapi.service(api).deleteFiles(result.files);
        
        const response = await super.delete(entityId, params);

        return response;
    },
    async deleteFiles(files){
        if(files){
            for (let i = 0; i < files.length; i++){
                let file = await strapi.db.query('plugin::upload.file').delete({
                    where: { id: files[i].id },
                });
                strapi.plugins.upload.services.upload.remove(file);
            }
        }
    }
}));