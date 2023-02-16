'use strict';

/**
 * A set of functions called "actions" for `user`
 */

const { nanoid } = require("nanoid");

module.exports = {
    async me(ctx){
        try {
            const user = await strapi.service('api::user.user').me();

            let userId = user.id;

            if(user.photo != null){
                user.photo.url = await strapi.service('api::s3.s3').SignedUrl(`${user.photo.hash}${user.photo.ext}`, user.photo.mime, 10 * 60);
                delete user.photo.hash;
                delete user.photo.provider;
                delete user.photo.provider_metadata;
                user.photo.formats = null;
    
                let photoId = user.photo.id;
                delete user.photo.id;
                let attributes = user.photo;
                user.photo = {
                    id: photoId,
                    attributes: attributes,
                }
            }
    
            if(user.timezone != null){
                let timezoneId = user.timezone.id;
                delete user.timezone.id;
                let attributes = user.timezone;
                user.timezone = {
                    id: timezoneId,
                    attributes: attributes,
                }
            }
    
            if(user.company != null){
                let companyId = user.company.id;
                delete user.company.id;
                let attributes = user.company;
                user.company = {
                    id: companyId,
                    attributes: attributes,
                }
            }
    
            if(user.role != null){
                let roleId = user.role.id;
                delete user.role.id;
                let attributes = user.role;
                user.role = {
                    id: roleId,
                    attributes: attributes,
                }
            }

            delete user.id;
            let attributes = user;

            ctx.body = {
                data: {
                    id: userId,
                    attributes: attributes,
                },
                meta: {}
            };
            
        } catch (err) {
            ctx.send({
                data: null,
                ...err,
            }, 500);
        }
    },
    async updateMe(ctx){
        try { 
            const user = await strapi.service('api::user.user').me();
            
            const data = ctx.request.body.data;

            let params = {
                data: {}
            }

            if(data != undefined){
                params.data = {
                    firstName: data.firstName,
                    lastName: data.lastName,
                    phone: data.phone,
                    timezone: data.timezone,
                }
            }
            

            if(ctx.request.files != undefined){
                if(ctx.request.files[ 'photo' ] != undefined){
                    params.files = {
                        photo: ctx.request.files[ 'photo' ],
                    }
                }
            }

            const result = await strapi.entityService.update('plugin::users-permissions.user', user.id, params);

            delete result.password;
            delete result.resetPasswordToken;
            delete result.confirmationToken;

            await strapi.service('api::log.log').create({
                data:{
                    log: `Updated profile`,
                    type: "update-profile",
                    result: result,
                    params: ctx.request.body,
                }
            });

            let userId = result.id;
            delete result.id;
            let attributes = result;

            return {
                data: {
                    id: userId,
                    attributes: attributes,
                },
                meta: {}
            };
        } catch(err){
            ctx.send({
                data: null,
                ...err,
            }, 500);
        }
    },
    async findMany(ctx){
        try { 
            const query = ctx.request.query;

            const result = await strapi.service('api::user.user').findMany(query);

            const data = [];

            if(result.data != null){
                for (let i = 0; i < result.data.length; i++) {
                    let id = result.data[i].id;
                    delete result.data[i].id;
                    let attributes = result.data[i];

                    let element = {
                        id: id,
                        attributes: attributes,
                    }
                    data.push(element);
                }

            }

            ctx.body = {
                data: data,
                meta: result.meta
            };

        } catch(err){
            ctx.send({
                data: null,
                ...err,
            }, 500);
        }
    },
    async findOne(ctx){
        try { 
            const { id } = ctx.params;
            const query = ctx.request.query;
            
            const result = await strapi.service('api::user.user').findOne(id, query);
            
            if(result == null){
                return ctx.send({
                    data: null,
                    error: {
                        name: "NotFoundError",
                        message: "Not Found",
                        details: {}
                    }
                }, 404);
            }

            let userId = result.data.id;
            delete result.data.id;
            let attributes = result.data;
            let element = {
                id: userId,
                attributes: attributes,
            }
            const data = element;

            ctx.body = {
                data: data,
                meta: result.meta
            };
        } catch(err){
            ctx.send({
                data: null,
                ...err,
            }, 500);
        }
    },
    async create(ctx){
        try { 
            const user = await strapi.service('api::user.user').me();

            if(!user.company.plan.unlimitedUsers){
                return ctx.send({
                    data: null,
                    error: {
                        name: "PlanLimitationError",
                        message: "Your plan does not allow you to perform this action",
                        details: {}
                    }
                }, 500);
            }
            
            const data = ctx.request.body.data;
            const password = nanoid();

            let params = {
                data: {}
            }

            const checkUsername = await strapi.db.query('plugin::users-permissions.user').count({ filters: { username: data.email }});
            if(checkUsername > 0){
                return ctx.send({
                    data: null,
                    error: {
                        name: 'ValidationError',
                        message: 'This attribute must be unique.',
                        details: {
                            errors: [
                                {
                                    path: ['username'],
                                    message: 'This attribute must be unique.',
                                    name: 'ValidationError'
                                }
                            ]
                        }
                    }
                }, 400);
            }

            if(data != undefined){
                params.data = {
                    company: user.company.id,
                    username: data.email,
                    email: data.email,
                    provider: 'local',
                    password: password,
                    role: data.role,
                    firstName: data.firstName,
                    lastName: data.lastName,
                    phone: data.phone,
                    timezone: data.timezone,
                    confirmed: 1,
                }
            }

            if(ctx.request.files != undefined){
                if(ctx.request.files[ 'photo' ] != undefined){
                    params.files = {
                        photo: ctx.request.files[ 'photo' ],
                    }
                }
            }
            
            const result = await strapi.entityService.create('plugin::users-permissions.user', params);

            if(result == null){
                return ctx.send({
                    data: null,
                    error: {
                        name: "Error",
                        message: "Error",
                        details: {}
                    }
                }, 404);
            }

            if(process.env.SMTP_SEND == "true"){
                await strapi.plugins['email'].services.email.send({
                    from: process.env.SMTP_FROM,
                    to: result.email,
                    subject: `Invitation to ${process.env.ATS_NAME}`,
                    html: `
                    <p>Dear ${result.firstName},</p>

                    <p>${user.company.company} uses ${process.env.ATS_NAME} for its personnel selection.</p>

                    <p>A colleague has invited you to join.</p>

                    <h3>Your login credentials are as follows:</h3>

                    <ul>
                        <li>URL: ${process.env.ATS_URL}</li>
                        <li>Email:  ${result.email}</li>
                        <li>Password: ${password}</li>
                    </ul>

                    <p>Please keep this information safe and do not share it with anyone. If you need to reset your password at any time, you can do so by clicking the "Forgot Password" link on the login page.</p>

                    <p>Best Regards,<br />${process.env.ATS_NAME} Team</p>
                    `,
                });
            }else{
                console.log({
                    URL: process.env.ATS_URL,
                    Email: result.email,
                    Password: password
                });
            }

            delete result.password;
            delete result.resetPasswordToken;
            delete result.confirmationToken;

            await strapi.service('api::log.log').create({
                data:{
                    log: `Registered user`,
                    type: "register-user",
                    result: result,
                    params: ctx.request.body,
                }
            });

            let userId = result.id;
            delete result.id;
            let attributes = result;

            await strapi.service('api::mailing.mailing').addContact(result.firstName, result.email, process.env.MJ_CONTACT_USERS_LIST);

            return {
                data: {
                    id: userId,
                    attributes: attributes,
                },
                meta: {}
            };
        } catch(err){
            ctx.send({
                data: null,
                ...err,
            }, 500);
        }
    },
    async update(ctx){
        try { 
            const user = await strapi.service('api::user.user').me();
            
            const { id } = ctx.params;
            const data = ctx.request.body.data;

            const userData = await strapi.service('api::user.user').findOne(id, ctx);

            if(userData == null){
                ctx.send({
                    data: null,
                    error: {
                        name: "NotFoundError",
                        message: "Not Found",
                        details: {}
                    }
                }, 404);
            }

            let params = {
                data: {}
            }

            if(data != undefined){
                params.data = {
                    role: data.role,
                    firstName: data.firstName,
                    lastName: data.lastName,
                    phone: data.phone,
                    timezone: data.timezone,
                }
            }

            if(ctx.request.files != undefined){
                if(ctx.request.files[ 'photo' ] != undefined){
                    params.files = {
                        photo: ctx.request.files[ 'photo' ],
                    }
                }
            }
            
            const result = await strapi.entityService.update('plugin::users-permissions.user', id, params);

            if(result != null){
                delete result.password;
                delete result.resetPasswordToken;
                delete result.confirmationToken;

                await strapi.service('api::log.log').create({
                    data:{
                        log: `Updated user`,
                        type: "update-user",
                        result: result,
                        params: ctx.request.body,
                    }
                });

                let userId = result.id;
                delete result.id;
                let attributes = result;

                return {
                    data: {
                        id: userId,
                        attributes: attributes,
                    },
                    meta: {}
                };
            }

            return {
                data: null,
                meta: {}
            };
        } catch(err){
            ctx.send({
                data: null,
                ...err,
            }, 500);
        }
    },
    async delete(ctx){
        try { 
            const { id } = ctx.params;

            const userData = await strapi.service('api::user.user').findOne(id, ctx);
            
            if(userData == null){
                ctx.send({
                    data: null,
                    error: {
                        name: "NotFoundError",
                        message: "Not Found",
                        details: {}
                    }
                }, 404);
            }
            
            const result = await strapi.entityService.delete('plugin::users-permissions.user', id, {
                data: {}
            });

            if(result == null){
                return {
                    data: null,
                    meta: {}
                };
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

            let userId = result.id;
            delete result.id;
            let attributes = result;

            return {
                data: {
                    id: userId,
                    attributes: attributes,
                },
                meta: {}
            };
        } catch(err){
            ctx.send({
                data: null,
                ...err,
            }, 500);
        }
    },
};
