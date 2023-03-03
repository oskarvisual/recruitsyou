'use strict';

/**
 * user service
 */

const { ApplicationError } = require('@strapi/utils').errors;

const { rest } = require('../../../../config/api');

module.exports = {
    async me() {  
        const ctx = strapi.requestContext.get();

        if (!ctx.state.user) { return false; }

        const user = await strapi.db.query('plugin::users-permissions.user').findOne({
            select: [
                'id',
                'username',
                'email',
                'provider',
                'confirmed',
                'blocked',
                'firstName',
                'lastName',
                'phone',
                'administrator',
                'timezone',
                'createdAt',
                'updatedAt',
            ],
            where: { id: ctx.state.user.id },
            populate: { 
                role: true,
                company: {
                    select: [
                        'id',
                        'company',
                        'domain',
                        'subdomain',
                        'dueDate',
                        'customerID',
                        'demo',
                        'createdAt',
                        'publishedAt',
                    ],
                    populate: { 
                        plan: true,
                    }
                },
                photo: true,
            }
        });

        if (!user.company) { 
            throw new ApplicationError('Company does not exist', {});
        }
        
        if(!user.company.publishedAt) {
            throw new ApplicationError('Deactivated company', {});
        }

        if(!user.administrator && user.company.plan.plan == 'Free') {
            throw new ApplicationError('The current plan does not allow you to access the system', {});
        }

        return user;
    },
    async find(params) {  
        const user = await strapi.service('api::user.user').me();

        params.fields = [
            'id',
            'username',
            'email',
            'provider',
            'confirmed',
            'blocked',
            'firstName',
            'lastName',
            'phone',
            'administrator',
            'timezone',
            'createdAt',
            'updatedAt',
        ];

        let filters = {
            $and: [
                {
                    company: user.company.id,
                },
            ],
        }
        if(params.filters?.email){
            filters.$and.push({ email: {
                    $contains: params.filters.email,
                }
            });
        }
        
        params.filters = filters;
        params.populate = { 
            role: true,
            photo: true,
        }

        let page = 1;

        if(params.pagination?.page){ 
            page = parseInt(params.pagination.page); 
        }

        if(params.pagination?.pageSize){
            params.limit = parseInt(params.pagination.pageSize); 
        }
        
        const total = await strapi.db.query('plugin::users-permissions.user').count(params);

        params.start = (page - 1) * rest.defaultLimit;
        params.limit = rest.defaultLimit;

        const result = await strapi.entityService.findMany('plugin::users-permissions.user', params);

        for(let i = 0; i < result.length; i++){
            if(result[i].photo){
                result[i].photo.url = await strapi.service('api::s3.s3').signedUrl(`${result[i].photo.hash}${result[i].photo.ext}`, result[i].photo.mime, 10 * 60);
                delete result[i].photo.hash;
                delete result[i].photo.provider;
                delete result[i].photo.provider_metadata;
                result[i].photo.formats = null;

                let photoId = result[i].photo.id;
                delete result[i].photo.id;
                let attributes = result[i].photo;
                result[i].photo = {
                    id: photoId,
                    attributes: attributes,
                }
            }
    
            if(result[i].role){
                let roleId = result[i].role.id;
                delete result[i].role.id;
                let attributes = result[i].role;
                result[i].role = {
                    id: roleId,
                    attributes: attributes,
                }
            }
    
        }

        return {
            data: result,
            meta: {
                pagination: {
                    page: page,
                    pageSize: params.limit,
                    pageCount: Math.ceil(total / params.limit),
                    total: total,
                },
            }
        };
    },
    async findOne(entityId, params = {}) {
        const user = await strapi.service('api::user.user').me();

        params.fields = [
            'id',
            'username',
            'email',
            'provider',
            'confirmed',
            'blocked',
            'firstName',
            'lastName',
            'phone',
            'administrator',
            'timezone',
            'createdAt',
            'updatedAt',
        ];
        
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
            role: true,
            photo: true,
        }
        
        const result = await strapi.entityService.findMany('plugin::users-permissions.user', params);
        if(result.length == 0){ return null; }

        if(result[0].photo){
            result[0].photo.url = await strapi.service('api::s3.s3').signedUrl(`${result[0].photo.hash}${result[0].photo.ext}`, result[0].photo.mime, 10 * 60);
            delete result[0].photo.hash;
            delete result[0].photo.provider;
            delete result[0].photo.provider_metadata;
            result[0].photo.formats = null;

            let photoId = result[0].photo.id;
            delete result[0].photo.id;
            let attributes = result[0].photo;
            result[0].photo = {
                id: photoId,
                attributes: attributes,
            }
        }

        if(result[0].role){
            let roleId = result[0].role.id;
            delete result[0].role.id;
            let attributes = result[0].role;
            result[0].role = {
                id: roleId,
                attributes: attributes,
            }
        }

        return {
            data: result[0],
            meta: {}
        };
    },
    async findRoles(params) {  
        const user = await strapi.service('api::user.user').me();

        params.filters = {
            id: {
                $gte: 3,
            },
        };

        let page = 1;

        if(params.pagination?.page){ 
            page = parseInt(params.pagination.page); 
        }

        if(params.pagination?.pageSize){
            params.limit = parseInt(params.pagination.pageSize); 
        }
        
        const total = await strapi.db.query('plugin::users-permissions.role').count(params);

        params.start = (page - 1) * rest.defaultLimit;
        params.limit = rest.defaultLimit;

        const result = await strapi.entityService.findMany('plugin::users-permissions.role', params);

        return {
            data: result,
            meta: {
                pagination: {
                    page: page,
                    pageSize: params.limit,
                    pageCount: Math.ceil(total / params.limit),
                    total: total,
                },
            }
        };
    },
    async findOneRole(entityId, params = {}) {
        const user = await strapi.service('api::user.user').me();
        
        params.filters = {}
        params.populate = {}
        
        const result = await strapi.entityService.findOne('plugin::users-permissions.role', entityId, params);

        return {
            data: result,
            meta: {}
        };
    },
};
