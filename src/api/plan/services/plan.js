'use strict';

/**
 * plan service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::plan.plan', ({ strapi }) => ({
    async find(params) {
        params.filters = {};
        params.populate = {};

        const { results, pagination } = await super.find(params);
        
        return { results, pagination };
    },
    async findOne(entityId, params = {}) {
        params.filters = {};
        params.populate = {};

        const result = await super.findOne(entityId, params);

        result.priceMonth = null;
        result.priceYear = null;

        if(result.PriceAPIMonth != '' && result.PriceAPIMonth != null){
            result.priceMonth = await strapi.service('api::stripe.stripe').findOnePrice(result.PriceAPIMonth);
        }

        if(result.PriceAPIYear != '' && result.PriceAPIYear != null){
            result.priceYear = await strapi.service('api::stripe.stripe').findOnePrice(result.PriceAPIYear);
        }
        
        return result;
    },
}));
