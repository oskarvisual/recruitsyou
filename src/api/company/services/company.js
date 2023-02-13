'use strict';

/**
 * company service
 */

const { createCoreService } = require('@strapi/strapi').factories;
const api = 'api::company.company';

module.exports = createCoreService(api, ({ strapi }) => ({
    async findOne(entityId, params = {}) {
        const user = await strapi.service('api::user.user').me();
        
        if(user){
            if(entityId != user.company.id){ return null; }
            params.populate = { 
                country: true,
                logo: true,
                navLogo: true,
                favicon: true,
                menu: true,
                socialNetwork: true,
            }

            const result = await super.findOne(entityId, params);
    
            return result;
        }

        const result = await strapi.entityService.findMany(api, {
            fields: [
                'company', 
                'street', 
                'streetNumber', 
                'state', 
                'city', 
                'zip', 
                'searchEngineIndexing', 
                'googleAnalytics', 
                'facebookPixel', 
                'customCss', 
                'customHeader', 
                'customBody', 
                'colorPrimary', 
                'colorSecundary', 
                'colorAccent', 
                'nav', 
                'navWidth', 
                'navBackground', 
                'navColor', 
                'navColorHover', 
                'footerShowBrand', 
                'domain', 
                'subdomain'
            ],
            filters: {
                $and: [
                    {
                        domain: entityId,
                    },
                ],
            },
            populate: { 
                country: true,
                logo: true,
                navLogo: true,
                favicon: true,
                menu: true,
                socialNetwork: true,
            },
        });

        if(result.length == 0){ return null; }

        return result[0];
    },
    async update(entityId, params) {
        const user = await strapi.service('api::user.user').me();
        
        if(entityId != user.company.id){ return null; }
        params.data.plan = user.company.plan.id;
        params.data.demo = user.company.demo;
        params.data.dueDate = user.company.dueDate;
        params.data.createdAt = user.company.createdAt;
        params.data.customerID = user.company.customerID;
        
        if(!user.company.plan.removeBranding){
            params.data.removeBranding = 0;
        }
        const response = await super.update(entityId, params);
    
        return response;
    },
}));
