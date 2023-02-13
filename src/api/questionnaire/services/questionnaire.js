'use strict';

/**
 * questionnaire service
 */

const { createCoreService } = require('@strapi/strapi').factories;
const api = 'api::questionnaire.questionnaire';

module.exports = createCoreService(api, ({ strapi }) => ({
    async find(params) {
        const user = await strapi.service('api::user.user').me();
        params.filters = { company: user.company.id }
        params.populate = {};

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
        params.populate = {};

        const result = await strapi.entityService.findMany(api, params);
        if(result.length == 0){ return null; }
    
        return result[0];
    },
    async create(params) {
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
            }, 403); 
        }
        
        const response = await super.create(params);

        return response;
    },
    async update(entityId, params) {
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
            }, 403); 
        }
        
        const result = await strapi.service(api).findOne(entityId);
        if(result == null){ return null; }

        const response = await super.update(entityId, params);
    
        return response;
    },
    async delete(entityId, params) {
        const user = await strapi.service('api::user.user').me();
        
        const result = await strapi.service(api).findOne(entityId);
        if(result == null){ return null; }

        const questions = await strapi.db.query('api::question.question').findMany({
            filters: {
                questionnaire: entityId,
            },
        });

        if(questions.length > 0){
            const questionsIds = [];
            for(let i = 0; i < questions.length; i++){
                questionsIds.push(questions[i].id);
            }
    
            await strapi.db.query('api::question.question').deleteMany({
                where: {
                    id: {
                        $in: questionsIds,
                    },
                },
            });
            
        }
        
        const response = await super.delete(entityId, params);

        return response;
    }
}));
