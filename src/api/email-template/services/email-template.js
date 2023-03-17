'use strict';

/**
 * email-template service
 */

const { createCoreService } = require('@strapi/strapi').factories;
const api = 'api::email-template.email-template';

module.exports = createCoreService(api, ({ strapi }) => ({
    async default(entityId, type) {
        const user = await strapi.service('api::user.user').me();

        if(!user){ return false; }

        const templates = await strapi.db.query(api).findMany({
            fields: ['id'],
            filters: {
                $and: [
                    {
                        company: user.company.id,
                    },
                    {
                        type: type,
                    },
                    {
                        id: {
                            $ne: entityId,
                        },
                    }
                ],
            },
        });
        
        if(templates.length > 0){
            const templatesIds = templates.map(s => s.id);
            
            const response = await strapi.db.query(api).updateMany({
                where: {
                    id: {
                        $in: templatesIds,
                    },
                },
                data: {
                    default: 0,
                },
            });
        }

        return true;
    },
    async find(params) {
        const user = await strapi.service('api::user.user').me();

        let filters = {
            $and: [
                {
                    company: user.company.id,
                },
            ],
        }
        if(params.filters?.type){
            filters.$and.push({ type: params.filters.type });
        }
        params.filters = filters;
        params.populate = {}

        const result = await super.find(params);
        
        return result;
    },
    async findOne(entityId, params = {}) {
        const user = await strapi.service('api::user.user').me();

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
        params.populate = {}

        const result = await strapi.entityService.findMany(api, params);
        if(result.length == 0){ return null; }
    
        return result[0];
    },
    async getTemplate(type, data) {
        let filters = {
            $and: [
                {
                    company: data.company.id,
                },
            ],
        }

        if(typeof(type) == 'number'){
            filters.$and.push({
                id: type,
            });
        }else{
            filters.$and.push({
                type: type,
            });

            filters.$and.push({
                default: 1,
            });
        }

        const result = await strapi.entityService.findMany(api, {
            filters: filters
        });
        if(result.length == 0){ return false; }
        let template = result[0];
        
        const expireDaysLinks = (data.company?.expireDaysLinks) ? data.company.expireDaysLinks : 5;
        
        if(template.subject.indexOf("{company.company}") >= 0 || template.body.indexOf("{company.company}") >= 0){
            template.subject = template.subject.replaceAll('{company.company}', data.company.company);
            template.body = template.body.replaceAll('{company.company}', data.company.company);
        }

        if(template.subject.indexOf("{company.url}") >= 0 || template.body.indexOf("{company.url}") >= 0){      
            let companyUrl = await strapi.service('api::link.link').getUrl(data.company.domain, data.company.subdomain, null, 'company');      
            template.subject = template.subject.replaceAll('{company.url}', companyUrl);
            template.body = template.body.replaceAll('{company.url}', companyUrl);
        }

        if(template.subject.indexOf("{company.gpdrPrivacyUrl}") >= 0 || template.body.indexOf("{company.gpdrPrivacyUrl}") >= 0){      
            template.subject = template.subject.replaceAll('{company.gpdrPrivacyUrl}', data.company.gpdrPrivacyUrl);
            template.body = template.body.replaceAll('{company.gpdrPrivacyUrl}', data.company.gpdrPrivacyUrl);
        }

        if(template.subject.indexOf("{company.website}") >= 0 || template.body.indexOf("{company.website}") >= 0){      
            template.subject = template.subject.replaceAll('{company.website}', data.company.website);
            template.body = template.body.replaceAll('{company.website}', data.company.website);
        }
        
        if(data.candidate){
            if(template.subject.indexOf("{candidate.email}") >= 0 || template.body.indexOf("{candidate.email}") >= 0){
                template.subject = template.subject.replaceAll('{candidate.email}', data.candidate.email);
                template.body = template.body.replaceAll('{candidate.email}', data.candidate.email);
            }
    
            if(template.subject.indexOf("{candidate.firstName}") >= 0 || template.body.indexOf("{candidate.firstName}") >= 0){
                template.subject = template.subject.replaceAll('{candidate.firstName}', data.candidate.firstName);
                template.body = template.body.replaceAll('{candidate.firstName}', data.candidate.firstName);
            }
    
            if(template.subject.indexOf("{candidate.lastName}") >= 0 || template.body.indexOf("{candidate.lastName}") >= 0){
                template.subject = template.subject.replaceAll('{candidate.lastName}', data.candidate.lastName);
                template.body = template.body.replaceAll('{candidate.lastName}', data.candidate.lastName);
            }        

            if(template.subject.indexOf("{gpdr.url}") >= 0 || template.body.indexOf("{gpdr.url}") >= 0){
                let link = await strapi.service('api::link.link').generate({
                    data: {
                        company: data.company,
                        expireDaysLinks: expireDaysLinks,
                        email: data.email,
                        type: 'gpdr',
                    }
                });
                
                template.subject = template.subject.replaceAll('{gpdr.url}', link.url);
                template.body = template.body.replaceAll('{gpdr.url}', link.url);
            }
        }
    
        if(template.subject.indexOf("{candidates.url}") >= 0 || template.body.indexOf("{candidates.url}") >= 0){
            let link = await strapi.service('api::link.link').generate({
                data: {
                    company: data.company,
                    expireDaysLinks: expireDaysLinks,
                    candidates: data.candidates,
                    email: data.email,
                    type: 'candidates',
                }
            });
            
            template.subject = template.subject.replaceAll('{candidates.url}', link.url);
            template.body = template.body.replaceAll('{candidates.url}', link.url);
        }

        if(data.document){
            if(template.subject.indexOf("{document.url}") >= 0 || template.body.indexOf("{document.url}") >= 0){
                let link = await strapi.service('api::link.link').generate({
                    data: {
                        company: data.company,
                        expireDaysLinks: expireDaysLinks,
                        document: data.document.id,
                        email: data.email,
                        type: 'document',
                    }
                });
                
                template.subject = template.subject.replaceAll('{document.url}', link.url);
                template.body = template.body.replaceAll('{document.url}', link.url);
            }
    
            if(template.subject.indexOf("{document.title}") >= 0 || template.body.indexOf("{document.title}") >= 0){
                template.subject = template.subject.replaceAll('{document.title}', data.document.title);
                template.body = template.body.replaceAll('{document.title}', data.document.title);
            }
    
            if(template.subject.indexOf("{document.email}") >= 0 || template.body.indexOf("{document.email}") >= 0){
                template.subject = template.subject.replaceAll('{document.email}', data.document.email);
                template.body = template.body.replaceAll('{document.email}', data.document.email);
            }
    
            if(template.subject.indexOf("{document.type}") >= 0 || template.body.indexOf("{document.lastName}") >= 0){
                let typeDocument = 'sign';

                if(data.document.type = 'file'){
                    typeDocument = 'download';
                }

                if(data.document.type = 'file-request'){
                    typeDocument = 'upload';
                }
                
                template.subject = template.subject.replaceAll('{document.type}', typeDocument);
                template.body = template.body.replaceAll('{document.type}', typeDocument);
            }
        }

        if(data.job){
            if(template.subject.indexOf("{job.title}") >= 0 || template.body.indexOf("{job.title}") >= 0){
                template.subject = template.subject.replaceAll('{job.title}', data.job.title);
                template.body = template.body.replaceAll('{job.title}', data.job.title);
            }

            if(template.subject.indexOf("{job.url}") >= 0 || template.body.indexOf("{job.url}") >= 0){
                let jobUrl = await strapi.service('api::link.link').getUrl(data.company.domain, data.company.subdomain, job.code, 'job');
                template.subject = template.subject.replaceAll('{job.url}', jobUrl);
                template.body = template.body.replaceAll('{job.url}', jobUrl);
            }

            if(template.subject.indexOf("{job.url.scheduler}") >= 0 || template.body.indexOf("{job.url.scheduler}") >= 0){
                let link = await strapi.service('api::link.link').generate({
                    data: {
                        company: data.company,
                        expireDaysLinks: expireDaysLinks,
                        job: data.job.id,
                        email: data.email,
                        type: 'scheduler',
                    }
                });
                
                template.subject = template.subject.replaceAll('{job.url.scheduler}', link.url);
                template.body = template.body.replaceAll('{job.url.scheduler}', link.url);
            }

            if(template.subject.indexOf("{job.url.assessment}") >= 0 || template.body.indexOf("{job.url.assessment}") >= 0){
                let link = await strapi.service('api::link.link').generate({
                    data: {
                        company: data.company,
                        expireDaysLinks: expireDaysLinks,
                        job: data.job.id,
                        email: data.email,
                        type: 'assessment',
                    }
                });
                
                template.subject = template.subject.replaceAll('{job.url.assessment}', link.url);
                template.body = template.body.replaceAll('{job.url.assessment}', link.url);
            }

            if(template.subject.indexOf("{job.url.questionnaire}") >= 0 || template.body.indexOf("{job.url.questionnaire}") >= 0){
                let link = await strapi.service('api::link.link').generate({
                    data: {
                        company: data.company,
                        expireDaysLinks: expireDaysLinks,
                        job: data.job.id,
                        email: data.email,
                        type: 'questionnaire',
                    }
                });
                
                template.subject = template.subject.replaceAll('{job.url.questionnaire}', link.url);
                template.body = template.body.replaceAll('{job.url.questionnaire}', link.url);
            }

            if(template.subject.indexOf("{job.url.nps}") || template.body.indexOf("{job.url.nps}")){
                let link = await strapi.service('api::link.link').generate({
                    data: {
                        company: data.company,
                        expireDaysLinks: expireDaysLinks,
                        job: data.job.id,
                        email: data.email,
                        type: 'nps',
                    }
                });
                
                template.subject = template.subject.replaceAll('{job.url.nps}', link.url);
                template.body = template.body.replaceAll('{job.url.nps}', link.url);
            }
        }
    
        return template;
    },
    async sendTemplate(type, data){
        const template = await strapi.service(api).getTemplate(type, data);
        const emails = (Array.isArray(data.to)) ? data.to : [data.to];

        if(!template){ return false; }

        const result = await strapi.service('api::n8n.n8n').webhook(process.env.N8N_EMAIL_URL, {
            data: {
                company: data.company.id,
                replyTo: template.replyTo,
                to: emails,
                subject: template.subject,
                body: template.body,
                hours: 0,
            }
        });

        return result;
    },
    async create(params) {
        const ctx = strapi.requestContext.get();

        const user = await strapi.service('api::user.user').me();
        params.data.company = user.company.id;

        if(!user.company.plan.customize){ 
            return ctx.forbidden('Your plan does not allow you to perform this action', {});
        }
        
        const response = await super.create(params);

        return response;
    },
    async update(entityId, params) {
        const ctx = strapi.requestContext.get();

        const user = await strapi.service('api::user.user').me();
        params.data.company = user.company.id;

        if(!user.company.plan.customize){ 
            return ctx.forbidden('Your plan does not allow you to perform this action', {});
        }
        
        const result = await strapi.service(api).findOne(entityId);
        if(!result){ return null; }

        const response = await super.update(entityId, params);
    
        return response;
    },
    async delete(entityId, params) {
        const ctx = strapi.requestContext.get();

        const user = await strapi.service('api::user.user').me();
        
        const result = await strapi.service(api).findOne(entityId);
        if(!result){ return null; }

        if(result.default){ 
            return ctx.badRequest('It is not possible to delete a default element', {});
        }
        
        const response = await super.delete(entityId, params);

        return response;
    }
}));
