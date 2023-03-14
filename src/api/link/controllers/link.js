'use strict';

/**
 * link controller
 */
const { sanitize } = require('@strapi/utils');

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::link.link', ({ strapi }) => ({
    async findOne(ctx) {
        const { id } = ctx.params;
        const query = ctx.request.query;

        const data = await strapi.service('api::link.link').findOne(id, query);
        
        return { 
            data: data,
            meta: {}
        };
    }
}));
