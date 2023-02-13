'use strict';

/**
 * pipeline controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::pipeline.pipeline', ({ strapi }) => ({
    async create(ctx) {
        try{
            const response = await super.create(ctx);

            if(response.data.attributes.default == true){
                await strapi.service('api::pipeline.pipeline').default(response.data.id, response.data.attributes.type);
            }
            
            return response;
        } catch(err){
            ctx.send({
                data: null,
                ...err
            }, 500);
        }
    },
    async update(ctx) {
        try{
            const response = await super.update(ctx);
            
            if(response.data.attributes.default == true){
                await strapi.service('api::pipeline.pipeline').default(response.data.id, response.data.attributes.type);
            }
        
            return response;
        } catch(err){
            ctx.send({
                data: null,
                ...err
            }, 500);
        }
    },
}));