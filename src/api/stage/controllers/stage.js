'use strict';

/**
 * stage controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::stage.stage', ({ strapi }) => ({
    async create(ctx) {
        const data = await this.sanitizeInput(ctx.request.body.data);

        if(data.pipeline == undefined){
            ctx.NotFound('pipeline must be defined', { 
                errors: [
                    {
                        path: ['pipeline'],
                        message: 'pipeline must be defined',
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