'use strict';

/**
 * A set of functions called "actions" for `ai`
 */

module.exports = {
    async jobDescription(ctx){
        try {
            const user = await strapi.service('api::user.user').me();
            const data = ctx.request.body.data;

            const departament = await strapi.service('api::departament.departament').findOne(data.departament);
            const type = await strapi.service('api::type-job.type-job').findOne(data.type);
            const industry = await strapi.service('api::industry.industry').findOne(data.industry);
            const experience = await strapi.service('api::experience.experience').findOne(data.experience);
            const education = await strapi.service('api::education.education').findOne(data.education);
            const country = await strapi.service('api::country.country').findOne(data.country);
            const salaryCurrency = await strapi.service('api::currency.currency').findOne(data.salaryCurrency);
            
            let tags = "";
            if(data.tags.length > 0){
                for(let i = 0; i < data.tags.length; i++){
                    let tag = await strapi.service('api::tag-job.tag-job').findOne(data.tags[i]);
                    if(tags != ""){ tags = tags.concat(", ") }
                    tags = tags.concat(tag.tag);
                }
            }

            let location = (data.remote) ? "remote" : "onsite";

            const prompt = `Write ${type.type} ${location} job description for this job title '${data.title}', for ${experience.experience} and ${education.education} candidate, for the ${departament.departament} departament in ${country.countryName}, in the ${industry.industry} industry, with this tags '${tags}' and this skills '${data.skills}'`;

            const result = await strapi.service('api::ai.ai').generateText(prompt);

            ctx.body = {
                data: result.choices,
                meta: {}
            };
            
        } catch (err) {
            ctx.send({
                data: null,
                ...err,
            }, 500);
        }
    },
    async jobRequirements(ctx){
        try {
            const user = await strapi.service('api::user.user').me();
            const data = ctx.request.body.data;

            const departament = await strapi.service('api::departament.departament').findOne(data.departament);
            const type = await strapi.service('api::type-job.type-job').findOne(data.type);
            const industry = await strapi.service('api::industry.industry').findOne(data.industry);
            const experience = await strapi.service('api::experience.experience').findOne(data.experience);
            const education = await strapi.service('api::education.education').findOne(data.education);
            const country = await strapi.service('api::country.country').findOne(data.country);
            const salaryCurrency = await strapi.service('api::currency.currency').findOne(data.salaryCurrency);
            
            let tags = "";
            if(data.tags.length > 0){
                for(let i = 0; i < data.tags.length; i++){
                    let tag = await strapi.service('api::tag-job.tag-job').findOne(data.tags[i]);
                    if(tags != ""){ tags = tags.concat(", ") }
                    tags = tags.concat(tag.tag);
                }
            }

            let location = (data.remote) ? "remote" : "onsite";

            const prompt = `Write only the requirements for a job ${type.type} ${location} with this job title '${data.title}', for ${experience.experience} and ${education.education} candidate, for the ${departament.departament} departament in ${country.countryName}, in the ${industry.industry} industry, with this tags '${tags}' and this skills '${data.skills}'`;

            const result = await strapi.service('api::ai.ai').generateText(prompt);

            ctx.body = {
                data: result.choices,
                meta: {}
            };
            
        } catch (err) {
            ctx.send({
                data: null,
                ...err,
            }, 500);
        }
    },
    async jobBenefits(ctx){
        try {
            const user = await strapi.service('api::user.user').me();
            const data = ctx.request.body.data;

            const departament = await strapi.service('api::departament.departament').findOne(data.departament);
            const type = await strapi.service('api::type-job.type-job').findOne(data.type);
            const industry = await strapi.service('api::industry.industry').findOne(data.industry);
            const experience = await strapi.service('api::experience.experience').findOne(data.experience);
            const education = await strapi.service('api::education.education').findOne(data.education);
            const country = await strapi.service('api::country.country').findOne(data.country);
            const salaryCurrency = await strapi.service('api::currency.currency').findOne(data.salaryCurrency);
            
            let tags = "";
            if(data.tags.length > 0){
                for(let i = 0; i < data.tags.length; i++){
                    let tag = await strapi.service('api::tag-job.tag-job').findOne(data.tags[i]);
                    if(tags != ""){ tags = tags.concat(", ") }
                    tags = tags.concat(tag.tag);
                }
            }

            let location = (data.remote) ? "remote" : "onsite";

            const prompt = `Write only the benefits for a job ${type.type} ${location} with this job title '${data.title}', for ${experience.experience} and ${education.education} candidate, for the ${departament.departament} departament in ${country.countryName}, in the ${industry.industry} industry, with this tags '${tags}' and this skills '${data.skills}'`;

            const result = await strapi.service('api::ai.ai').generateText(prompt);

            ctx.body = {
                data: result.choices,
                meta: {}
            };
            
        } catch (err) {
            ctx.send({
                data: null,
                ...err,
            }, 500);
        }
    },
    async jobQuestions(ctx){
        try {
            const user = await strapi.service('api::user.user').me();
            const data = ctx.request.body.data;

            const departament = await strapi.service('api::departament.departament').findOne(data.departament);
            const type = await strapi.service('api::type-job.type-job').findOne(data.type);
            const industry = await strapi.service('api::industry.industry').findOne(data.industry);
            const experience = await strapi.service('api::experience.experience').findOne(data.experience);
            const education = await strapi.service('api::education.education').findOne(data.education);
            const country = await strapi.service('api::country.country').findOne(data.country);
            const salaryCurrency = await strapi.service('api::currency.currency').findOne(data.salaryCurrency);
            
            let tags = "";
            if(data.tags.length > 0){
                for(let i = 0; i < data.tags.length; i++){
                    let tag = await strapi.service('api::tag-job.tag-job').findOne(data.tags[i]);
                    if(tags != ""){ tags = tags.concat(", ") }
                    tags = tags.concat(tag.tag);
                }
            }

            let location = (data.remote) ? "remote" : "onsite";

            const prompt = `Write only 10 or less questions of selection process to a candidate for a job ${type.type} ${location} with this job title '${data.title}', for ${experience.experience} and ${education.education} candidate, for the ${departament.departament} departament in ${country.countryName}, in the ${industry.industry} industry, with this tags '${tags}' and this skills '${data.skills}'`;

            const result = await strapi.service('api::ai.ai').generateText(prompt);

            ctx.body = {
                data: result.choices,
                meta: {}
            };
            
        } catch (err) {
            ctx.send({
                data: null,
                ...err,
            }, 500);
        }
    },
    async email(ctx){
        try {
            const user = await strapi.service('api::user.user').me();
            const data = ctx.request.body.data;

            const prompt = `Write a ${data.type} email as the company ${user.company.company} for this subject ${data.subject} to a candidate in one selection process with this details: '${data.details}', my name is ${user.firstName} ${user.lastName}, the company name is ${user.company.company} and you can use this variables. candidate first name: {candidate.firstName}, candidate last name: {candidate.lastName}, job title: {job.title}`;

            const result = await strapi.service('api::ai.ai').generateText(prompt);

            ctx.body = {
                data: result.choices,
                meta: {}
            };
            
        } catch (err) {
            ctx.send({
                data: null,
                ...err,
            }, 500);
        }
    },
};
