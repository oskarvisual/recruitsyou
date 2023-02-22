'use strict';

/**
 * question controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::question.question', ({ strapi }) => ({
    async create(ctx) {
        const data = await this.sanitizeInput(ctx.request.body.data);

        if(data.questionnaire == undefined){
            return ctx.NotFound('questionnaire must be defined', { 
                errors: [
                    {
                        path: ['questionnaire'],
                        message: 'questionnaire must be defined',
                        name: 'ValidationError'
                    }
                ]
            });
        }

        const response = await super.create(ctx);
        // some more logic
      
        return response;
      }
}));
