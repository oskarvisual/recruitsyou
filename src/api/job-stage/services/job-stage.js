'use strict';

/**
 * job-stage service
 */

const { createCoreService } = require('@strapi/strapi').factories;
const api = 'api::job-stage.job-stage';
//TODO: AGREGAR LIMITE DE 15 STAGES
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
            automated: true,
        }

        const result = await strapi.entityService.findMany(api, params);
        if(result.length == 0){ return null; }
    
        return result[0];
    },
    async getJobStageOrder(jobId, type) {
        const user = await strapi.service('api::user.user').me();

        const job = await strapi.service('api::job.job').findOne(jobId);
        
        let order = -1;

        if(!job){ return false }

        const stage = await strapi.entityService.findMany('api::job-stage.job-stage', {
            filters: {
                $and: [
                    {
                        company: user.company.id,
                    },
                    {
                        job: job.id,
                    },
                    {
                        type: type,
                    },
                ],
            },
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
