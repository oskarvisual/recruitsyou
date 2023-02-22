'use strict';

/**
 * question service
 */

const { createCoreService } = require('@strapi/strapi').factories;
const api = 'api::question.question';
//TODO: FALTA METODO PARA ORDERNAR CON LO DE ARRASTAR Y SOLTAR
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

        if(params.filters != undefined){
            if(params.filters.questionnaire != undefined){
                filters.$and.push({ questionnaire: params.filters.questionnaire })
            }
        }

        params.filters = filters;
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
        params.populate = { 
            questionnaire: true,
            alternatives: true
        };

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

        const countQuestions = await strapi.db.query('api::question.question').count({ 
            filters: { 
                $and: [
                    {
                        company: user.company.id,
                    },
                    {
                        questionnaire: params.data.questionnaire,
                    },
                ]
            }
        });

        if(countQuestions >= 100){
            if(!user.company.plan.customize){ 
                return ctx.forbidden('Exceeds the maximum question limit (100)', {});
            }
        }

        let questions = await strapi.db.query('api::question.question').findMany({
            filters: {
                $and: [
                    {
                        company: user.company.id,
                    },
                    {
                        questionnaire: params.data.questionnaire,
                    },
                ],
            },
            orderBy: { order: 'DESC' },
            offset: 0, 
            limit: 1,
        });
        
        let order = 0;
        
        if(questions.length > 0){
            order = questions[0].order;
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
        if(result == null){ return null; }

        if(params.data.order != undefined){
            delete params.data.order;
        }

        if(params.data.questionnaire != undefined){
            delete params.data.questionnaire;
        }

        const response = await super.update(entityId, params);
    
        return response;
    },
    async delete(entityId, params) {
        const user = await strapi.service('api::user.user').me();
        
        const result = await strapi.service(api).findOne(entityId);
        if(result == null){ return null; }
        
        const response = await super.delete(entityId, params);

        return response;
    }
}));
