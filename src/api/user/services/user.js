'use strict';

/**
 * user service
 */

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
                'createdAt',
                'updatedAt',
            ],
            where: { id: ctx.state.user.id },
            populate: { 
                role: true,
                company: true,
                timezone: true,
                photo: true,
            }
        });

        if (user == null) { return false; }
        
        user.company = await strapi.db.query('api::company.company').findOne({
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
            where: { id: user.company.id },
            populate: { 
                plan: true,
            },
        });

        if(user.company == null || user.company.publishedAt == null) { return false; }

        return user;
    },
    async findMany(params) {  
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
        if(params.filters !== undefined){
            if(params.filters.email !== undefined){
                filters.$and.push({ email: {
                        $contains: params.filters.email,
                    }
                });
            }
        }
        params.filters = filters;
        params.populate = { 
            role: true,
            timezone: true,
            photo: true,
        }

        let page = 1;

        if(params.pagination !== undefined){ 
            if(params.pagination.page !== undefined){
                page = parseInt(params.pagination.page); 
            }
            if(params.pagination.pageSize !== undefined){
                params.limit = parseInt(params.pagination.pageSize); 
            }
        }
        
        const total = await strapi.db.query('plugin::users-permissions.user').count(params);

        params.start = (page - 1) * rest.defaultLimit;
        params.limit = rest.defaultLimit;

        const result = await strapi.entityService.findMany('plugin::users-permissions.user', params);

        for(let i = 0; i < result.length; i++){
            if(result[i].photo != null){
                result[i].photo.url = await strapi.service('api::s3.s3').SignedUrl(`${result[i].photo.hash}${result[i].photo.ext}`, result[i].photo.mime, 10 * 60);
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
    
            if(result[i].timezone != null){
                let timezoneId = result[i].timezone.id;
                delete result[i].timezone.id;
                let attributes = result[i].timezone;
                result[i].timezone = {
                    id: timezoneId,
                    attributes: attributes,
                }
            }
    
            if(result[i].company != null){
                let companyId = result[i].company.id;
                delete result[i].company.id;
                let attributes = result[i].company;
                result[i].company = {
                    id: companyId,
                    attributes: attributes,
                }
            }
    
            if(result[i].role != null){
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
            timezone: true,
            photo: true,
        }
        
        const result = await strapi.entityService.findMany('plugin::users-permissions.user', params);
        if(result.length == 0){ return null; }

        if(result[0].photo != null){
            result[0].photo.url = await strapi.service('api::s3.s3').SignedUrl(`${result[0].photo.hash}${result[0].photo.ext}`, result[0].photo.mime, 10 * 60);
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

        if(result[0].timezone != null){
            let timezoneId = result[0].timezone.id;
            delete result[0].timezone.id;
            let attributes = result[0].timezone;
            result[0].timezone = {
                id: timezoneId,
                attributes: attributes,
            }
        }

        if(result[0].company != null){
            let companyId = result[0].company.id;
            delete result[0].company.id;
            let attributes = result[0].company;
            result[0].company = {
                id: companyId,
                attributes: attributes,
            }
        }

        if(result[0].role != null){
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
};
