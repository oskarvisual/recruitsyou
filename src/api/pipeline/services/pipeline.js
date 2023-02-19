'use strict';

/**
 * pipeline service
 */

const { createCoreService } = require('@strapi/strapi').factories;
const api = 'api::pipeline.pipeline';

module.exports = createCoreService(api, ({ strapi }) => ({
    async default(entityId) {
        const user = await strapi.service('api::user.user').me();

        await strapi.db.query(api).updateMany({
            filters: {
                company: user.company.id,
            },
            data: {
                default: 0,
            },
        });

        const response = await super.update(entityId, {
            data: {
                default: 1,
            }
        });

        return response;
    },
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

        const result = await strapi.entityService.findMany(api, params);
        if(result.length == 0){ return null; }
    
        return result[0];
    },
    async create(params) {
        const ctx = strapi.requestContext.get();
        const user = await strapi.service('api::user.user').me();
        params.data.company = user.company.id;

        if(!user.company.plan.customize){ 
            ctx.send({
                data: null,
                error: {
                    name: "PlanLimitationError",
                    message: "Your plan does not allow you to perform this action",
                    details: {}
                }
            }, 500); 
        }
        
        const response = await super.create(params);

        await strapi.entityService.create('api::stage.stage',{
            data: {
                company: user.company.id,
                pipeline: response.id,
                stage: 'Sourced',
                type: 'sourced',
                order: 0,
            }
        });

        await strapi.entityService.create('api::stage.stage',{
            data: {
                company: user.company.id,
                pipeline: response.id,
                stage: 'Apply',
                type: 'apply',
                order: 1,
            }
        });

        await strapi.entityService.create('api::stage.stage',{
            data: {
                company: user.company.id,
                pipeline: response.id,
                stage: 'Interview',
                type: 'interview',
                order: 2,
            }
        });

        await strapi.entityService.create('api::stage.stage',{
            data: {
                company: user.company.id,
                pipeline: response.id,
                stage: 'Assessment',
                type: 'assessment',
                order: 3,
            }
        });

        await strapi.entityService.create('api::stage.stage',{
            data: {
                company: user.company.id,
                pipeline: response.id,
                stage: 'Offer',
                type: 'offer',
                order: 4,
            }
        });

        await strapi.entityService.create('api::stage.stage',{
            data: {
                company: user.company.id,
                pipeline: response.id,
                stage: 'Hired',
                type: 'hired',
                order: 5,
            }
        });

        await strapi.entityService.create('api::stage.stage',{
            data: {
                company: user.company.id,
                pipeline: response.id,
                stage: 'Onboarding',
                type: 'onboarding',
                order: 6,
            }
        });

        return response;
    },
    async update(entityId, params) {
        const ctx = strapi.requestContext.get();
        const user = await strapi.service('api::user.user').me();
        params.data.company = user.company.id;

        if(!user.company.plan.customize){ 
            ctx.send({
                data: null,
                error: {
                    name: "PlanLimitationError",
                    message: "Your plan does not allow you to perform this action",
                    details: {}
                }
            }, 500); 
        }
        
        const result = await strapi.service(api).findOne(entityId);
        if(result == null){ return null; }

        if(result.default){
            params.data.default = 1;
        }

        const response = await super.update(entityId, params);
    
        return response;
    },
    async delete(entityId, params) {
        const ctx = strapi.requestContext.get();
        const user = await strapi.service('api::user.user').me();
        
        const result = await strapi.service(api).findOne(entityId);
        if(result == null){ return null; }

        if(result.default == true){ 
            return ctx.send({
                data: null,
                error: {
                    name: "DefaultDeleteError",
                    message: "It is not possible to delete a default element",
                    details: {}
                }
            }, 400); 
        }

        const stages = await strapi.db.query('api::stage.stage').findMany({
            filters: {
                pipeline: entityId,
            },
        });

        if(stages.length > 0){
            const stagesIds = [];
            for(let i = 0; i < stages.length; i++){
                stagesIds.push(stages[i].id);
            }
    
            await strapi.db.query('api::stage.stage').deleteMany({
                where: {
                    id: {
                        $in: stagesIds,
                    },
                },
            });
            
        }
        
        const response = await super.delete(entityId, params);

        return response;
    }
}));
