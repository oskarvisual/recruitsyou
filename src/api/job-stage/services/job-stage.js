'use strict';

/**
 * job-stage service
 */

const { createCoreService } = require('@strapi/strapi').factories;
const api = 'api::job-stage.job-stage';
//TODO: AGREGAR LOGICA PARA ORDENAR (CON DRAG&DROP) Y QUE NO SE PUEDA MOVER SOURCE Y APPLY Y QUE ACTUALICE IGUAL QUE CANDIDATOS
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

        if(params.filters?.job){
            filters.$and.push({ job: params.filters.job })
        }
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
            automated: true,
        }

        const result = await strapi.entityService.findMany(api, params);
        if(result.length == 0){ return null; }
    
        return result[0];
    },
    async getJobStageOrder(jobId, stageId) {
        const user = await strapi.service('api::user.user').me();

        const job = await strapi.service('api::job.job').findOne(jobId);
        
        let order = -1;

        if(!job){ return false }

        let filters = {
            $and: [
                {
                    company: user.company.id,
                },
                {
                    job: job.id,
                },
            ],
        }

        if(typeof(stageId) == 'number'){
            filters.$and.push({
                id: stageId,
            });
        }else{
            filters.$and.push({
                type: stageId,
            });
        }

        const stage = await strapi.entityService.findMany('api::job-stage.job-stage', {
            filters: filters,
        });

        if(stage.length == 0){ return false }

        const stageCandidates = await strapi.entityService.findMany('api::job-candidate.job-candidate', {
            filters: {
                $and: [
                    {
                        company: user.company.id,
                    },
                    {
                        job: job.id,
                    },
                    {
                        stage: stage[0].id,
                    },
                ],
            },
            start: 0,
            limit: 1,
            sort: { order: 'desc' },
        });
        
        if(stageCandidates.length > 0){
            order = stageCandidates[0].order + 1;
        }

        return {
            jobId: job.id,
            stageId: stage[0].id,
            order: (order < 0) ? 0 : order,
        }
    },
    async create(params) {
        const ctx = strapi.requestContext.get();

        const user = await strapi.service('api::user.user').me();
        params.data.company = user.company.id;

        if(!params.data?.job){ 
            return ctx.badRequest('You must select a job', {});
        }
                
        const job = await strapi.service('api::job.job').findOne(params.data.pipeline);
        if(!job){ 
            return ctx.badRequest('These attributes were not found', { 
                errors: [
                    {
                        path: ['job'],
                        message: 'These attributes were not found',
                        name: 'ValidationError'
                    }
                ]
            });
        }    

        const countStages = await strapi.db.query(api).count({ 
            filters: { 
                $and: [
                    {
                        company: user.company.id,
                    },
                    {
                        job: job.id,
                    },
                ]
            }
        });

        if(countStages >= 15){
            return ctx.badRequest('Exceeds the maximum stages limit (15)', {});
        }

        const names = [];
        const types = [];
        let stages = await strapi.db.query(api).findMany({
            filters: {
                $and: [
                    {
                        company: user.company.id,
                    },
                    {
                        job: job.id,
                    },
                ],
            },
            sort: { order: 'desc' },
        });
        
        let order = -1;
        
        if(stages.length > 0){
            order = stages[0].order + 1;
            
            for(let i = 0; i < stages.length; i++){
                if(stages[i].type && !types.includes(stages[i].type)){
                    types.push(stages[i].type);
                }
                if(!names.includes(stages[i].stage)){
                    names.push(stages[i].stage);
                }
            }
        }

        if(params.data.type && types.includes(params.data.type)){
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

        params.data.order = (order < 0) ? 0 : order;
        
        const response = await super.create(params);

        return response;
    },
    async update(entityId, params) {
        const user = await strapi.service('api::user.user').me();
        params.data.company = user.company.id;
        
        const result = await strapi.service(api).findOne(entityId);
        if(!result){ return null; }

        if(params.data.job){
            delete params.data.job;
        }

        if(params.data.type){
            delete params.data.type;
        }

        const response = await super.update(entityId, params);
    
        return response;
    },
    async delete(entityId, params) {
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
