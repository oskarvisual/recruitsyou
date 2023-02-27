'use strict';

/**
 * A set of functions called "actions" for `ai`
 */

const ct = require('countries-and-timezones');

module.exports = {
    async jobDescription(ctx){
        const user = await strapi.service('api::user.user').me();
        const data = ctx.request.body.data;

        const attributes = [];

        const departament = await strapi.service('api::departament.departament').findOne(data.departament); 
        if(departament == null){ attributes.push('departament'); }         

        const type = await strapi.service('api::type-job.type-job').findOne(data.type);
        if(type == null){ attributes.push('type'); }      

        const industry = await strapi.service('api::industry.industry').findOne(data.industry);
        if(industry == null){ attributes.push('industry'); }      
        
        
        const experience = await strapi.service('api::experience.experience').findOne(data.experience);
        if(experience == null){ attributes.push('experience'); }      
        
        
        const education = await strapi.service('api::education.education').findOne(data.education);
        if(education == null){ attributes.push('education'); }      
        
        const country = ct.getCountry(data.country);           
        
        const salaryCurrency = data.salaryCurrency;  
        
        let tags = "";
        if(data.tags.length > 0){
            for(let i = 0; i < data.tags.length; i++){
                let tag = await strapi.service('api::tag-job.tag-job').findOne(data.tags[i]);
                if(tag == null){
                    if(tag == null && !attributes.includes('tags')){ attributes.push('tags'); }     
                }else{
                    if(tags != ""){ tags = tags.concat(", ") }
                    tags = tags.concat(tag.tag);
                }
            }
        }  
        
        if(attributes.length > 0){
            return ctx.notFound('These attributes were not found', { 
                errors: [
                    {
                        path: attributes,
                        message: "These attributes were not found",
                        name: "ValidationError"
                    }
                ]
            });
        }

        let location = (data.remote) ? "remote" : "onsite";

        const prompt = `Write ${type.type} ${location} job description for this job title '${data.title}', for ${experience.experience} and ${education.education} candidate, for the ${departament.departament} departament in ${country.name}, in the ${industry.industry} industry, with this tags '${tags}' and this skills '${data.skills}'`;

        const response = await strapi.service('api::ai.ai').generateText(prompt);

        return response;
    },
    async jobRequirements(ctx){
        const user = await strapi.service('api::user.user').me();
        const data = ctx.request.body.data;

        const attributes = [];

        const departament = await strapi.service('api::departament.departament').findOne(data.departament); 
        if(departament == null){ attributes.push('departament'); }         

        const type = await strapi.service('api::type-job.type-job').findOne(data.type);
        if(type == null){ attributes.push('type'); }      

        const industry = await strapi.service('api::industry.industry').findOne(data.industry);
        if(industry == null){ attributes.push('industry'); }      
        
        
        const experience = await strapi.service('api::experience.experience').findOne(data.experience);
        if(experience == null){ attributes.push('experience'); }      
        
        
        const education = await strapi.service('api::education.education').findOne(data.education);
        if(education == null){ attributes.push('education'); }    
        
        const country = ct.getCountry(data.country);    

        const salaryCurrency = data.salaryCurrency;  
        
        let tags = "";
        if(data.tags.length > 0){
            for(let i = 0; i < data.tags.length; i++){
                let tag = await strapi.service('api::tag-job.tag-job').findOne(data.tags[i]);
                if(tag == null){
                    if(tag == null && !attributes.includes('tags')){ attributes.push('tags'); }   
                }else{
                    if(tags != ""){ tags = tags.concat(", ") }
                    tags = tags.concat(tag.tag);
                }
            }
        }  
        
        if(attributes.length > 0){
            return ctx.notFound('These attributes were not found', { 
                errors: [
                    {
                        path: attributes,
                        message: "These attributes were not found",
                        name: "ValidationError"
                    }
                ]
            });
        }

        let location = (data.remote) ? "remote" : "onsite";

        const prompt = `Write only the requirements for a job ${type.type} ${location} with this job title '${data.title}', for ${experience.experience} and ${education.education} candidate, for the ${departament.departament} departament in ${country.name}, in the ${industry.industry} industry, with this tags '${tags}' and this skills '${data.skills}'`;

        const response = await strapi.service('api::ai.ai').generateText(prompt);

        return response;
    },
    async jobBenefits(ctx){
        const user = await strapi.service('api::user.user').me();
        const data = ctx.request.body.data;

        const attributes = [];

        const departament = await strapi.service('api::departament.departament').findOne(data.departament); 
        if(departament == null){ attributes.push('departament'); }         

        const type = await strapi.service('api::type-job.type-job').findOne(data.type);
        if(type == null){ attributes.push('type'); }      

        const industry = await strapi.service('api::industry.industry').findOne(data.industry);
        if(industry == null){ attributes.push('industry'); }      
        
        
        const experience = await strapi.service('api::experience.experience').findOne(data.experience);
        if(experience == null){ attributes.push('experience'); }      
        
        
        const education = await strapi.service('api::education.education').findOne(data.education);
        if(education == null){ attributes.push('education'); }   
        
        const country = ct.getCountry(data.country);                    
        
        const salaryCurrency = data.salaryCurrency;    
        
        let tags = "";
        if(data.tags.length > 0){
            for(let i = 0; i < data.tags.length; i++){
                let tag = await strapi.service('api::tag-job.tag-job').findOne(data.tags[i]);
                if(tag == null){
                    if(tag == null && !attributes.includes('tags')){ attributes.push('tags'); }    
                }else{
                    if(tags != ""){ tags = tags.concat(", ") }
                    tags = tags.concat(tag.tag);
                }
            }
        }   
        
        if(attributes.length > 0){
            return ctx.notFound('These attributes were not found', { 
                errors: [
                    {
                        path: attributes,
                        message: "These attributes were not found",
                        name: "ValidationError"
                    }
                ]
            });
        }

        let location = (data.remote) ? "remote" : "onsite";

        const prompt = `Write only the benefits for a job ${type.type} ${location} with this job title '${data.title}', for ${experience.experience} and ${education.education} candidate, for the ${departament.departament} departament in ${country.name}, in the ${industry.industry} industry, with this tags '${tags}' and this skills '${data.skills}'`;

        const response = await strapi.service('api::ai.ai').generateText(prompt);

        return response;
    },
    async jobQuestions(ctx){
        const user = await strapi.service('api::user.user').me();
        const data = ctx.request.body.data;

        const attributes = [];

        const departament = await strapi.service('api::departament.departament').findOne(data.departament); 
        if(departament == null){ attributes.push('departament'); }         

        const type = await strapi.service('api::type-job.type-job').findOne(data.type);
        if(type == null){ attributes.push('type'); }      

        const industry = await strapi.service('api::industry.industry').findOne(data.industry);
        if(industry == null){ attributes.push('industry'); }      
        
        
        const experience = await strapi.service('api::experience.experience').findOne(data.experience);
        if(experience == null){ attributes.push('experience'); }      
        
        
        const education = await strapi.service('api::education.education').findOne(data.education);
        if(education == null){ attributes.push('education'); }    
        
        const country = ct.getCountry(data.country);                   
        
        const salaryCurrency = data.salaryCurrency;  
        
        let tags = "";
        if(data.tags.length > 0){
            for(let i = 0; i < data.tags.length; i++){
                let tag = await strapi.service('api::tag-job.tag-job').findOne(data.tags[i]);
                if(tag == null){
                    if(tag == null && !attributes.includes('tags')){ attributes.push('tags'); }   
                }else{
                    if(tags != ""){ tags = tags.concat(", ") }
                    tags = tags.concat(tag.tag);
                }
            }
        }   
        
        if(attributes.length > 0){
            return ctx.notFound('These attributes were not found', { 
                errors: [
                    {
                        path: attributes,
                        message: "These attributes were not found",
                        name: "ValidationError"
                    }
                ]
            });
        }

        let location = (data.remote) ? "remote" : "onsite";

        const prompt = `Write only 10 or less questions of selection process to a candidate for a job ${type.type} ${location} with this job title '${data.title}', for ${experience.experience} and ${education.education} candidate, for the ${departament.departament} departament in ${country.name}, in the ${industry.industry} industry, with this tags '${tags}' and this skills '${data.skills}'`;

        const response = await strapi.service('api::ai.ai').generateText(prompt);

        return response;
    },
    async email(ctx){
        const user = await strapi.service('api::user.user').me();
        const data = ctx.request.body.data;

        const prompt = `Write a ${data.type} email as the company ${user.company.company} for this subject ${data.subject} to a candidate in one selection process with this details: '${data.details}', my name is ${user.firstName} ${user.lastName}, the company name is ${user.company.company} and you can use this variables. candidate first name: {candidate.firstName}, candidate last name: {candidate.lastName}, job title: {job.title}`;

        const response = await strapi.service('api::ai.ai').generateText(prompt);

        return response;
    },
};
