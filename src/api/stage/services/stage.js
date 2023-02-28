'use strict';

/**
 * stage service
 */

const { createCoreService } = require('@strapi/strapi').factories;
const api = 'api::stage.stage';
//TODO: AGREGAR LOGICA PARA ORDENAR (CON DRAG&DROP)
module.exports = createCoreService(api, ({ strapi }) => ({
    async find(params) {
        const user = await strapi.service('api::user.user').me();
        
        let filters = {
            $and: [
                {
                    company: user.company.id,
                },
            ],
        }

        if(params.filters?.pipeline){
            filters.$and.push({ pipeline: params.filters.pipeline })
        }

        const result = await super.find(params);
        params.populate = {};
        
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
            automated: true,
        }

        const result = await strapi.entityService.findMany(api, params);
        if(result.length == 0){ return null; }
    
        return result[0];
    },
    async create(params) {
        const ctx = strapi.requestContext.get();

        const user = await strapi.service('api::user.user').me();
        params.data.company = user.company.id;

        if(!user.company.plan.customize){ 
            return ctx.forbidden('Your plan does not allow you to perform this action', {});
        }

        if(!params.data?.pipeline){ 
            return ctx.badRequest('You must select a pipeline', {});
        }
                
        const pipeline = await strapi.service('api::pipeline.pipeline').findOne(params.data.pipeline);
        if(!pipeline){ 
            return ctx.notFound('These attributes were not found', { 
                errors: [
                    {
                        path: ['pipeline'],
                        message: 'These attributes were not found',
                        name: 'ValidationError'
                    }
                ]
            });
        }    

        const countStages = await strapi.db.query('api::stage.stage').count({ 
            filters: { 
                $and: [
                    {
                        company: user.company.id,
                    },
                    {
                        pipeline: pipeline.id,
                    },
                ]
            }
        });

        if(countStages >= 15){
            return ctx.badRequest('Exceeds the maximum question limit (15)', {});
        }

        const names = [];
        const types = [];
        let stages = await strapi.db.query('api::stage.stage').findMany({
            filters: {
                $and: [
                    {
                        company: user.company.id,
                    },
                    {
                        pipeline: pipeline.id,
                    },
                ],
            },
            start: 0, 
            limit: 1,
            sort: { order: 'desc' },
        });
        
        let order = 0;
        
        if(stages.length > 0){
            order = stages[0].order;
            
            for(let i = 0; i < stages.length; i++){
                if(!types.includes(stages[i].type) && stages[i].type){
                    types.push(stages[i].type);
                }
                if(!names.includes(stages[i].stage)){
                    names.push(stages[i].stage);
                }
            }
        }

        if(types.includes(params.data.type)){
            return ctx.badRequest('This attribute must be unique', {
                errors: [
                    {
                        path: ['type'],
                        message: 'This attribute must be unique',
                        name: 'ValidationError'
                    }
                ]
            });
        }

        if(names.includes(params.data.stage)){
            return ctx.badRequest('This attribute must be unique', {
                errors: [
                    {
                        path: ['stage'],
                        message: 'This attribute must be unique',
                        name: 'ValidationError'
                    }
                ]
            });
        }

        params.data.order = order + 1;
        
        const response = await super.create(params);

        return response;
    },
    async update(entityId, params) {
        const ctx = strapi.requestContext.get();

        const user = await strapi.service('api::user.user').me();
        params.data.company = user.company.id;

        if(!user.company.plan.customize){ 
            return ctx.forbidden('Your plan does not allow you to perform this action', {});
        }
        
        const result = await strapi.service(api).findOne(entityId);
        if(!result){ return null; }

        if(params.data.order){
            delete params.data.order;
        }

        if(params.data.pipeline){
            delete params.data.pipeline;
        }

        if(params.data.type){
            delete params.data.type;
        }

        const response = await super.update(entityId, params);
    
        return response;
    },
    async delete(entityId, params) {
        const ctx = strapi.requestContext.get();

        const user = await strapi.service('api::user.user').me();

        const result = await strapi.service(api).findOne(entityId);
        if(!result){ return null; }

        if(result.type == 'sourced' || result.type == 'apply'){
            return ctx.badRequest('It is not possible to delete that element', {
                errors: [
                    {
                        path: ['type'],
                        message: `It is not possible to delete an element of type ${result.type}`,
                        name: 'ValidationError'
                    }
                ]
            });
        }

        const response = await super.delete(entityId, params);

        return response;
    }
}));
