'use strict';

/**
 * job-candidate controller
 */

const { createCoreController } = require('@strapi/strapi').factories;
const api = 'api::job-candidate.job-candidate';

module.exports = createCoreController(api, ({ strapi }) => ({
    async find(ctx) {
        const query = ctx.request.query;

        const result = await strapi.service(api).find(query);
      
        return result;
    }
}));
