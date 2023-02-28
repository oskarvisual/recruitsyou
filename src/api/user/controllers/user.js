'use strict';

/**
 * A set of functions called "actions" for `user`
 */

const { nanoid } = require("nanoid");

module.exports = {
    async me(ctx){
        const user = await strapi.service('api::user.user').me();

        let userId = user.id;

        if(user.photo){
            user.photo.url = await strapi.service('api::s3.s3').signedUrl(`${user.photo.hash}${user.photo.ext}`, user.photo.mime, 10 * 60);
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

        if(user.company){
            let companyId = user.company.id;
            delete user.company.id;
            let attributes = user.company;
            user.company = {
                id: companyId,
                attributes: attributes,
            }
        }

        if(user.role){
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
    },
    async updateMe(ctx){
        const user = await strapi.service('api::user.user').me();
        
        const data = ctx.request.body.data;

        let params = {
            data: {}
        }

        if(data){
            params.data = {
                firstName: data.firstName,
                lastName: data.lastName,
                phone: data.phone,
                timezone: data.timezone,
            }
        }
        

        if(ctx.request.files){
            if(ctx.request.files[ 'photo' ]){
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
    },
    async findMany(ctx){
        const query = ctx.request.query;

        const result = await strapi.service('api::user.user').findMany(query);

        const data = [];

        if(result.data){
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
    },
    async findOne(ctx){
        const { id } = ctx.params;
        const query = ctx.request.query;
        
        const result = await strapi.service('api::user.user').findOne(id, query);
        
        if(!result){
            return ctx.notFound('Not Found', {});
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
    },
    async create(ctx){
        const user = await strapi.service('api::user.user').me();

        if(!user.company.plan.unlimitedUsers){
            return ctx.forbidden('Your plan does not allow you to perform this action', {});
        }
        
        const data = ctx.request.body.data;
        const password = nanoid();

        let params = {
            data: {}
        }

        const checkUsername = await strapi.db.query('plugin::users-permissions.user').count({ filters: { username: data.email }});
        if(checkUsername > 0){
            return ctx.badRequest('This attribute must be unique', { 
                errors: [
                    {
                        path: ['username'],
                        message: 'This attribute must be unique',
                        name: 'ValidationError'
                    }
                ]
            });
        }

        if(data){
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
                administrator: 0,
            }
        }

        if(ctx.request.files){
            if(ctx.request.files[ 'photo' ]){
                params.files = {
                    photo: ctx.request.files[ 'photo' ],
                }
            }
        }
        
        const result = await strapi.entityService.create('plugin::users-permissions.user', params);

        if(!result){
            return ctx.badRequest('Error', {});
        }

        await strapi.service('api::email.email').create({
            data:{
                from: process.env.SMTP_FROM,
                replyTo: process.env.SMTP_FROM,
                to: result.email,
                subject: `Invitation to ${process.env.ATS_NAME}`,
                body: `<p>Dear ${result.firstName},</p>

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
                sent: 0,
                sendDate: new Date(),
            }
        });

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
    },
    async update(ctx){
        const user = await strapi.service('api::user.user').me();
        
        const { id } = ctx.params;
        const data = ctx.request.body.data;

        const userData = await strapi.service('api::user.user').findOne(id, ctx);

        if(!userData){
            return ctx.notFound('Not Found', {});
        }

        let params = {
            data: {}
        }

        if(data){
            params.data = {
                role: (userData.administrator) ? userData.role.id : data.role,
                firstName: data.firstName,
                lastName: data.lastName,
                phone: data.phone,
                timezone: data.timezone,
            }
        }

        if(ctx.request.files){
            if(ctx.request.files[ 'photo' ]){
                params.files = {
                    photo: ctx.request.files[ 'photo' ],
                }
            }
        }
        
        const result = await strapi.entityService.update('plugin::users-permissions.user', id, params);

        if(result){
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
    },
    async delete(ctx){
        const { id } = ctx.params;

        const userData = await strapi.service('api::user.user').findOne(id, ctx);
        
        if(!userData){
            return ctx.notFound('Not Found', { 
                details: {}
            });
        }

        if(userData.administrator){
            return ctx.forbidden('Administrator user cannot be removed', {});
        }
        
        const result = await strapi.entityService.delete('plugin::users-permissions.user', id, {
            data: {}
        });

        if(!result){
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
    },
};
