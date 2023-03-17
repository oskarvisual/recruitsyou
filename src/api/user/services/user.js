'use strict';

/**
 * user service
 */

const { ApplicationError } = require('@strapi/utils').errors;

const { rest } = require('../../../../config/api');
const { nanoid } = require("nanoid");

module.exports = {
    //TODO: AGREGAR NOTIFICACIONES A USUARIO Y SOLO SE MUESTRA EN MI (pushCandidates, emailCandidates, pushJob, emailJob, etc...)
    async me() {  
        const ctx = strapi.requestContext.get();
        const headers = ctx.request?.headers;

        if (!ctx?.state?.user) { return false; }

        let filters = {
            $and: [
                {
                    id: ctx.state.user.id,
                },
            ],
        };

        if(headers?.company){
            filters.$and.push({
                companies: {
                    id: {
                        $in: [headers.company],
                    }
                }
            });
        }
        const result = await strapi.entityService.findMany('plugin::users-permissions.user', {
            fields: [
                'id',
                'username',
                'email',
                'provider',
                'confirmed',
                'blocked',
                'firstName',
                'lastName',
                'phone',
                'timezone',
                'createdAt',
                'updatedAt',
            ],
            filters: filters,
            populate: { 
                role: true,
                companies: {
                    fields: [
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
                    ],
                    populate: { 
                        plan: true,
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
                        }
                    }
                },
                photo: {
                    fields: [
                        'id',
                        'name',
                        'hash',
                        'alternativeText',
                        'width',
                        'height',
                        'ext',
                        'mime',
                        'size',
                        'folderPath',
                        'createdAt',
                        'updatedAt',
                    ],
                },
                integrations: true,
            }
        });

        if (!result) { return false; }

        const user = result[0];

        if (!user?.companies) { 
            return false;
        }

        if(headers?.company){
            let companies = user.companies.filter(company => company.id == headers.company);
            user.company = companies[0];
        }else{
            user.company = user.companies[0];
        }

        if (!user?.companies) { 
            throw new ApplicationError('Company does not exist', {});
        }
        
        if(!user?.company.publishedAt) {
            throw new ApplicationError('Deactivated company', {});
        }

        if(user?.role?.id != process.env.ATS_SUPERADMINISTRATOR_ROLE && user?.company.plan.id == process.env.ATS_FREE_PLAN) {
            throw new ApplicationError('The current plan does not allow you to access the system', {});
        }

        if(user.photo){
            user.photo.url = await strapi.service('api::s3.s3').signedUrl(`${user.photo.hash}${user.photo.ext}`, user.photo.mime, 10 * 60);
            delete user.photo.hash;
        }

        return user;
    },
    async find(params) {  
        const ctx = strapi.requestContext.get();
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
            'timezone',
            'createdAt',
            'updatedAt',
        ];

        let filters = {
            $and: [
                {
                    companies: {
                        id: {
                            $in: [user.company.id],
                        }
                    },
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
            photo: {
                fields: [
                    'id',
                    'name',
                    'hash',
                    'alternativeText',
                    'width',
                    'height',
                    'ext',
                    'mime',
                    'size',
                    'folderPath',
                    'createdAt',
                    'updatedAt',
                ],
            },
        }

        let page = 1;

        if(params.pagination?.page){ 
            page = parseInt(params.pagination.page); 
        }

        if(params.pagination?.limit){
            params.limit = parseInt(params.pagination.limit); 
        }
        
        const total = await strapi.db.query('plugin::users-permissions.user').count(params);

        params.start = (page - 1) * rest.defaultLimit;
        params.limit = rest.defaultLimit;

        const result = await strapi.entityService.findMany('plugin::users-permissions.user', params);

        if(result.length > 0){
            for(let i = 0; i < result.length; i++){
                if(result[i].photo){
                    result[i].photo.url = await strapi.service('api::s3.s3').signedUrl(`${result[i].photo.hash}${result[i].photo.ext}`, result[i].photo.mime, 10 * 60);
                    delete result[i].photo.hash;
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
        const ctx = strapi.requestContext.get();
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
            'timezone',
            'createdAt',
            'updatedAt',
        ];
        
        params.filters = {
            $and: [
                {
                    companies: {
                        id: {
                            $in: [user.company.id],
                        }
                    },
                },
                {
                    id: entityId,
                },
            ],
        }
        params.populate = { 
            role: true,
            photo: {
                fields: [
                    'id',
                    'name',
                    'hash',
                    'alternativeText',
                    'width',
                    'height',
                    'ext',
                    'mime',
                    'size',
                    'folderPath',
                    'createdAt',
                    'updatedAt',
                ],
            },
        }
        
        const result = await strapi.entityService.findMany('plugin::users-permissions.user', params);
        if(result.length == 0){ return null; }

        if(result[0].photo){
            result[0].photo.url = await strapi.service('api::s3.s3').signedUrl(`${result[0].photo.hash}${result[0].photo.ext}`, result[0].photo.mime, 10 * 60);
            delete result[0].photo.hash;
        }

        return result[0];
    },
    async create(params) {  
        const ctx = strapi.requestContext.get();
        const user = await strapi.service('api::user.user').me();

        if(!user.company.plan.unlimitedUsers){
            return ctx.forbidden('Your plan does not allow you to perform this action', {});
        }

        const companiesIds = user.companies.map(s => s.id);

        const users = await strapi.entityService.findMany('plugin::users-permissions.user', {
            fields: [
                'id',
                'email',
                'firstName',
                'lastName',
            ],
            filters: {
                $and: [
                    {
                        companies: {
                            id: {
                                $in: companiesIds,
                            }
                        },
                    },
                    {
                        email: params.data.email,
                    },
                ],
            },
            populate: { 
                companies: {
                    fields: [
                        'id',
                    ],
                },
            }
        });

        if(users.length > 0){
            const userCompaniesIds = users[0].companies.map(s => s.id);
            
            if(!userCompaniesIds.find(e => e == user.company.id)){
                userCompaniesIds.push(user.company.id);

                await strapi.entityService.update('plugin::users-permissions.user', users[0].id, {
                    data: {
                        companies: {
                            connect: [
                                { 
                                    id: user.company.id 
                                },
                            ]
                        },
                    },
                });

                await strapi.service('api::log.log').create({
                    data:{
                        log: `Added user`,
                        type: "add-user",
                        result: users[0],
                        params: ctx.request.body,
                    }
                });

                await strapi.service('api::n8n.n8n').webhook(process.env.N8N_USER_URL, {
                    data: {
                        company: user.company,
                        user: {
                            ...users[0],
                            new: false
                        }
                    }
                });
            }

            return await strapi.service('api::user.user').findOne(users[0].id);
        }

        params.data.companies = user.company.id;

        const password = nanoid();

        params.data.password = password;

        const checkUser = await strapi.db.query('plugin::users-permissions.user').count({ 
            filters: {
                $or: [
                    { username: params.data.email },
                    { email: params.data.email },
                ]
            }
        });
        if(checkUser > 0){
            return ctx.badRequest('The email or username is already registered in the system', {});
        }
        
        const result = await strapi.entityService.create('plugin::users-permissions.user', params);

        if(!result){
            return ctx.badRequest('Error', {});
        }

        await strapi.service('api::log.log').create({
            data:{
                log: `Registered user`,
                type: "register-user",
                result: result,
                params: ctx.request.body,
            }
        });

        await strapi.service('api::n8n.n8n').webhook(process.env.N8N_USER_URL, {
            data: {
                company: user.company,
                user: {
                    ...result,
                    new: true,
                    password: password
                }
            }
        });
        
        return await strapi.service('api::user.user').findOne(result.id);
    },
    async update(entityId, params = {}) {
        const ctx = strapi.requestContext.get();
        const user = await strapi.service('api::user.user').me();

        const userData = await strapi.service('api::user.user').findOne(entityId);

        if(!userData){
            return ctx.notFound('Not Found', {});
        }

        if(userData.id != user.id && user.role.name != "Administrator"){ 
            return ctx.forbidden("You don't have permissions to perform that action", {});
        }

        if(params.data.role && (userData.role.id == process.env.ATS_SUPERADMINISTRATOR_ROLE || userData.id == user.id || params.data.role == process.env.ATS_SUPERADMINISTRATOR_ROLE)){
            delete params.data.role;
        }
        
        const result = await strapi.entityService.update('plugin::users-permissions.user', entityId, params);

        if(!result){
            return ctx.badRequest('Error', {});
        }

        if(userData.id != user.id){ 
            await strapi.service('api::log.log').create({
                data:{
                    log: `Updated user`,
                    type: "update-user",
                    result: result,
                    params: ctx.request.body,
                }
            });
        }

        return await strapi.service('api::user.user').findOne(entityId);
    },
    async destroy(entityId, params = {}) {
        const ctx = strapi.requestContext.get();
        const user = await strapi.service('api::user.user').me();

        const userData = await strapi.service('api::user.user').findOne(entityId);
        
        if(!userData){
            return ctx.notFound('Not Found', { 
                details: {}
            });
        }

        if(userData.id == user.id){
            return ctx.badRequest('Error', {});
        }

        if(userData.role.id == process.env.ATS_SUPERADMINISTRATOR_ROLE){
            return ctx.forbidden('Administrator user cannot be removed', {});
        }
        
        const result = await strapi.entityService.delete('plugin::users-permissions.user', entityId, {
            data: {}
        });

        if(!result){
            return ctx.badRequest('Error', {});
        }

        delete result.password;
        delete result.resetPasswordToken;
        delete result.confirmationToken;

        await strapi.service('api::log.log').create({
            data:{
                log: `Deleted user`,
                type: "delete-user",
                result: result,
                params: ctx.request.body,
            }
        });

        return userData;
    }
};
