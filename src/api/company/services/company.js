'use strict';

/**
 * company service
 */

const utils = require('@strapi/utils');

const { createCoreService } = require('@strapi/strapi').factories;
const api = 'api::company.company';

module.exports = createCoreService(api, ({ strapi }) => ({
    async find(params) {
        const user = await strapi.service('api::user.user').me();

        const companiesIds = user.companies.map(s => s.id);
        
        params.fields = [
            'id',
            'company',
            'domain',
            'subdomain',
            'gpdrPrivacyUrl',
            'website',
            'dueDate',
            'customerID',
            'gpdr',
            'gpdrRetentionDays',
            'gpdrDeleteExpiredCandidates',
            'expireDaysLinks',
            'demo',
            'createdAt',
            'publishedAt',
        ];
        params.filters = {
            id: {
                $in: companiesIds,
            }
        }
        params.populate = { 
            logo: {
                fields: [
                    'id',
                    'name',
                    'alternativeText',
                    'width',
                    'height',
                    'ext',
                    'mime',
                    'size',
                    'url',
                    'folderPath',
                    'createdAt',
                    'updatedAt',
                ],
            },
            plan: {
                fields: [
                    'id',
                    'plan'
                ]
            },
        }

        const result = await super.find(params);
        
        return result;
    },
    async findOne(entityId, params = {}) {
        const user = await strapi.service('api::user.user').me();
        
        if(user){
            if(entityId != user.company.id){ return null; }
            
            params.filters = {
                id: entityId,
            }
            params.populate = { 
                logo: {
                    fields: [
                        'id',
                        'name',
                        'alternativeText',
                        'width',
                        'height',
                        'ext',
                        'mime',
                        'size',
                        'url',
                        'folderPath',
                        'createdAt',
                        'updatedAt',
                    ],
                },
                navLogo: {
                    fields: [
                        'id',
                        'name',
                        'alternativeText',
                        'width',
                        'height',
                        'ext',
                        'mime',
                        'size',
                        'url',
                        'folderPath',
                        'createdAt',
                        'updatedAt',
                    ],
                },
                favicon: {
                    fields: [
                        'id',
                        'name',
                        'alternativeText',
                        'width',
                        'height',
                        'ext',
                        'mime',
                        'size',
                        'url',
                        'folderPath',
                        'createdAt',
                        'updatedAt',
                    ],
                },
                menu: true,
                socialNetwork: true,
                plan: true,
            }
        }else{
            params.filters = {
                domain: entityId,
            }
            params.fields = [
                'company', 
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
            ];
            params.populate = { 
                menu: true,
                socialNetwork: true,
                logo: {
                    fields: [
                        'id',
                        'name',
                        'alternativeText',
                        'width',
                        'height',
                        'ext',
                        'mime',
                        'size',
                        'url',
                        'folderPath',
                        'createdAt',
                        'updatedAt',
                    ],
                },
                navLogo: {
                    fields: [
                        'id',
                        'name',
                        'alternativeText',
                        'width',
                        'height',
                        'ext',
                        'mime',
                        'size',
                        'url',
                        'folderPath',
                        'createdAt',
                        'updatedAt',
                    ],
                },
                favicon: {
                    fields: [
                        'id',
                        'name',
                        'alternativeText',
                        'width',
                        'height',
                        'ext',
                        'mime',
                        'size',
                        'url',
                        'folderPath',
                        'createdAt',
                        'updatedAt',
                    ],
                },
            }
        }

        const result = await strapi.entityService.findMany(api, params);

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
        params.data.publishedAt = user.company.publishedAt;
        params.data.customerID = user.company.customerID;
        
        if(!params.data.subdomain && params.data.domain){
            params.data.domain = params.data.domain.replace('http://', '');
            params.data.domain = params.data.domain.replace('https://', '');

            const url = new URL(`https://${params.data.domain}`);

            if(!url){
                return ctx.badRequest('Invalid domain', {});
            }
            params.data.domain = url.hostname;
        }
        
        if(params.data.subdomain && params.data.domain){
            params.data.domain = params.data.domain.toString()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .trim()
            .replace(/\s+/g, '-')
            .replace(/[^\w-]+/g, '')
            .replace(/--+/g, '-');
        }
        
        if(!user.company.plan.removeBranding){
            params.data.removeBranding = 0;
        }
        const response = await super.update(entityId, params);

        await strapi.service('api::log.log').create({
            data:{
                log: `Updated company settings`,
                type: "update-company",
                result: response,
                params: params,
            }
        });
    
        return response;
    },
}));
