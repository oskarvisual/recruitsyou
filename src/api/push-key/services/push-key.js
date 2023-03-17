'use strict';

/**
 * token-push service
 */

const { createCoreService } = require('@strapi/strapi').factories;
const api = 'api::push-key.push-key';

module.exports = createCoreService(api, ({ strapi }) => ({
    async create(params) {
        const user = await strapi.service('api::user.user').me();
        
        params.data.user = user.id;
        
        const response = await super.create(params);

        return response;
    },
    async register(params) {

        return true;
    },
}));