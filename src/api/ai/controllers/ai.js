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
        if(!departament){ attributes.push('departament'); }         

        const industry = await strapi.service('api::industry.industry').findOne(data.industry);
        if(!industry){ attributes.push('industry'); }          
        
        const country = ct.getCountry(data.country);           
        
        const salaryCurrency = data.salaryCurrency;  
        
        let tags_arr = [];
        let tags = "";
        if(data.tags.length > 0){
            for(let i = 0; i < data.tags.length; i++){
                let tag = await strapi.service('api::tag-job.tag-job').findOne(data.tags[i]);
                if(!tag){
                    if(!tag && !attributes.includes('tags')){ attributes.push('tags'); }   
                    continue;  
                }
                tags_arr.push(tag.tag);
            }

            tags = new Intl.ListFormat('en').format(tags_arr);
        }  
        
        if(attributes.length > 0){
            return ctx.badRequest('These attributes were not found', { 
                errors: [
                    {
                        path: attributes,
                        message: "These attributes were not found",
                        name: "ValidationError"
                    }
                ]
            });
        }

        const prompt = `Write only the description for a job ${data.type} ${data.location} with this job title '${data.title}', for ${data.experience} and ${data.education} candidate, for the ${departament.departament} departament in ${country.name}, in the ${industry.industry} industry, with this tags '${tags}' and this skills '${data.skills}'`;

        const response = await strapi.service('api::ai.ai').generateText(prompt);

        return response;
    },
    async jobRequirements(ctx){
        const user = await strapi.service('api::user.user').me();
        const data = ctx.request.body.data;

        const attributes = [];

        const departament = await strapi.service('api::departament.departament').findOne(data.departament); 
        if(!departament){ attributes.push('departament'); }       

        const industry = await strapi.service('api::industry.industry').findOne(data.industry);
        if(!industry){ attributes.push('industry'); }          
        
        const country = ct.getCountry(data.country);           
        
        const salaryCurrency = data.salaryCurrency;  
        
        let tags_arr = [];
        let tags = "";
        if(data.tags.length > 0){
            for(let i = 0; i < data.tags.length; i++){
                let tag = await strapi.service('api::tag-job.tag-job').findOne(data.tags[i]);
                if(!tag){
                    if(!tag && !attributes.includes('tags')){ attributes.push('tags'); }   
                    continue;  
                }
                tags_arr.push(tag.tag);
            }

            tags = new Intl.ListFormat('en').format(tags_arr);
        }  
        
        if(attributes.length > 0){
            return ctx.badRequest('These attributes were not found', { 
                errors: [
                    {
                        path: attributes,
                        message: "These attributes were not found",
                        name: "ValidationError"
                    }
                ]
            });
        }

        const prompt = `Write only the requirements for a job ${data.type} ${data.location} with this job title '${data.title}', for ${data.experience} and ${data.education} candidate, for the ${departament.departament} departament in ${country.name}, in the ${industry.industry} industry, with this tags '${tags}' and this skills '${data.skills}'`;

        const response = await strapi.service('api::ai.ai').generateText(prompt);

        return response;
    },
    async jobBenefits(ctx){
        const user = await strapi.service('api::user.user').me();
        const data = ctx.request.body.data;

        const attributes = [];

        const departament = await strapi.service('api::departament.departament').findOne(data.departament); 
        if(!departament){ attributes.push('departament'); }       

        const industry = await strapi.service('api::industry.industry').findOne(data.industry);
        if(!industry){ attributes.push('industry'); }        
        
        const country = ct.getCountry(data.country);           
        
        const salaryCurrency = data.salaryCurrency;  
        
        let tags_arr = [];
        let tags = "";
        if(data.tags.length > 0){
            for(let i = 0; i < data.tags.length; i++){
                let tag = await strapi.service('api::tag-job.tag-job').findOne(data.tags[i]);
                if(!tag){
                    if(!tag && !attributes.includes('tags')){ attributes.push('tags'); }   
                    continue;  
                }
                tags_arr.push(tag.tag);
            }

            tags = new Intl.ListFormat('en').format(tags_arr);
        }   
        
        if(attributes.length > 0){
            return ctx.badRequest('These attributes were not found', { 
                errors: [
                    {
                        path: attributes,
                        message: "These attributes were not found",
                        name: "ValidationError"
                    }
                ]
            });
        }

        const prompt = `Write only the benefits for a job ${data.type} ${data.location} with this job title '${data.title}', for ${data.experience} and ${data.education} candidate, for the ${departament.departament} departament in ${country.name}, in the ${industry.industry} industry, with this tags '${tags}' and this skills '${data.skills}'`;

        const response = await strapi.service('api::ai.ai').generateText(prompt);

        return response;
    },
    async jobQuestions(ctx){
        const user = await strapi.service('api::user.user').me();
        const data = ctx.request.body.data;

        const attributes = [];

        const departament = await strapi.service('api::departament.departament').findOne(data.departament); 
        if(!departament){ attributes.push('departament'); }     

        const industry = await strapi.service('api::industry.industry').findOne(data.industry);
        if(!industry){ attributes.push('industry'); }       
        
        const country = ct.getCountry(data.country);           
        
        const salaryCurrency = data.salaryCurrency;  
        
        let tags_arr = [];
        let tags = "";
        if(data.tags.length > 0){
            for(let i = 0; i < data.tags.length; i++){
                let tag = await strapi.service('api::tag-job.tag-job').findOne(data.tags[i]);
                if(!tag){
                    if(!tag && !attributes.includes('tags')){ attributes.push('tags'); }   
                    continue;  
                }
                tags_arr.push(tag.tag);
            }

            tags = new Intl.ListFormat('en').format(tags_arr);
        }   
        
        if(attributes.length > 0){
            return ctx.badRequest('These attributes were not found', { 
                errors: [
                    {
                        path: attributes,
                        message: "These attributes were not found",
                        name: "ValidationError"
                    }
                ]
            });
        }

        const prompt = `Write only 10 or less questions of selection process to a candidate for a job ${data.type} ${data.location} with this job title '${data.title}', for ${data.experience} and ${data.education} candidate, for the ${departament.departament} departament in ${country.name}, in the ${industry.industry} industry, with this tags '${tags}' and this skills '${data.skills}'`;

        const response = await strapi.service('api::ai.ai').generateText(prompt);

        return response;
    },
    async candidateMatch(ctx){
        const user = await strapi.service('api::user.user').me();
        const data = ctx.request.body.data;

        const attributes = [];   

        let job = false;
        if(data.job){
            job = await strapi.service('api::job.job').findOne(data.job);
            if(!job){ attributes.push('job'); }   
        }

        const candidate = await strapi.service('api::candidate.candidate').findOne(data.candidate); 
        if(!candidate){ attributes.push('candidate'); }    
        
        if(attributes.length > 0){
            return ctx.badRequest('These attributes were not found', { 
                errors: [
                    {
                        path: attributes,
                        message: "These attributes were not found",
                        name: "ValidationError"
                    }
                ]
            });
        }

        let education = "";
        let educationArr = [];
        if(candidate.education.length > 0){
            candidate.education.forEach(function callback(row, index, array) {
                educationArr.push(`School: ${row.school}, degree: ${row.degree}, degree subject: ${row.degreeSubject}, description: ${row.description}, from ${row.fromYear} to ${row.toYear} year`);
            });

            education = new Intl.ListFormat('en').format(educationArr);
        }

        let experience = "";
        let experienceArr = [];
        if(candidate.experience.length > 0){
            candidate.experience.forEach(function callback(row, index, array) {
                experienceArr.push(`Title: ${row.title}, company: ${row.company}, description: ${row.description}, from ${row.fromYear} ${(!row.current) ? " to " + row.toYear : ""} ${(!row.current) ? " year" : " (current job)"}`);
            });

            experience = new Intl.ListFormat('en').format(experienceArr);
        }

        let prompt = `Write a match score (percentage) for a candidate resume and skils for a selection process. cover letter: "${candidate.coverLetter}", summary: "${candidate.summary}", skills: "${candidate.skills}", salary expectation: ${candidate.salaryExpectation} ${candidate.salaryCurrency} (${candidate.salaryPeriod}), with ${candidate.yearsExperience} years of experience, with this education: "${education}" and this experience: "${experience}"`;

        if(job){
            prompt = `Write a match score (percentage) between job description and candidate resume and skils for a selection process. The job type ${job.type} and ${job.location} location with this title '${job.title}', for ${job.experience} and ${job.education} candidate, for the ${job.departament?.departament} departament in ${job.country}, in the ${job.industry?.industry} industry, with this skills '${job.skills}', with from ${job.salaryFrom} to ${job.salaryTo} salary ${job.salaryCurrency} (${job.salaryPeriod}). and the candidate data is the following. cover letter: "${candidate.coverLetter}", summary: "${candidate.summary}", skills: "${candidate.skills}", salary expectation: ${candidate.salaryExpectation} ${candidate.salaryCurrency} (${candidate.salaryPeriod}), with ${candidate.yearsExperience} years of experience, with this education: "${education}" and this experience: "${experience}"`;
        }

        const response = await strapi.service('api::ai.ai').generateText(prompt);

        response.data.match = 0;
        const percentageStart = parseInt(response.data.content.indexOf("%")) - 3;
        if(percentageStart >= 0){
            response.data.match = parseInt(response.data.content.slice(percentageStart, percentageStart + 3));            
        }

        response.data.evaluation = 1;
        if(response.data?.match >= 30){ response.data.evaluation = 2 }
        if(response.data?.match >= 70){ response.data.evaluation = 3 }

        if(data.evaluation){
            await strapi.service('api::evaluation.evaluation').create({
                data: {
                    job: (job) ? job.id : null,
                    candidate: candidate.id,
                    description: response.data.content,
                    evaluation: response.data.evaluation,
                    ai: 1,
                }
            });
        }

        return response;
    },
    async email(ctx){
        const user = await strapi.service('api::user.user').me();
        const data = ctx.request.body.data;

        const prompt = `Write a ${data.type} email (only the message without subject) as the company ${user.company.company} for this subject ${data.subject} to a candidate in one selection process with this details: '${data.details}', my name is ${user.firstName} ${user.lastName}, the company name is ${user.company.company} and you can use this variables. candidate first name: {candidate.firstName}, candidate last name: {candidate.lastName}, job title: {job.title}."`;

        const response = await strapi.service('api::ai.ai').generateText(prompt);

        return response;
    },
};
