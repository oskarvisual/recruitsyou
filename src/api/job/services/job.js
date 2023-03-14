'use strict';

/**
 * job service
 */
const { v4: uuidv4 } = require('uuid');

const { createCoreService } = require('@strapi/strapi').factories;
const api = 'api::job.job';
module.exports = createCoreService(api, ({ strapi }) => ({
    async find(params) {
        const user = await strapi.service('api::user.user').me();
        if(user){ 
            params.filters = { company: user.company.id } 
            params.publicationState = 'preview';
        }else{ 
            params.filters= {
                //TODO: AGREGAR LOGICA DE CANDIDATO PARA COMPANY ID, FILTROS, ETC
                $and: [
                    {
                        archived: 0,
                    },
                ],
            }
        }
        params.populate = {}

        
        const result = await super.find(params);
        
        return result;
    },
    async findOne(entityId, params = {}) {
        const user = await strapi.service('api::user.user').me();
        if(user){
            params.filters= {
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
                departament: true,
                type: true,
                industry: true,
                experience: true,
                education: true,
                tags: true,
                tests: true,
            }

            const result = await strapi.entityService.findMany(api, params);
            if(result.length == 0){ return null; }
        
            return result[0];
        }
        //TODO: AGREGAR LOGICA DE CANDIDATO PARA COMPANY ID
        params.filters= {
            $and: [
                {
                    code: entityId,
                },
                {
                    archived: 0,
                },
            ],
        }
        params.populate = {
            company: true,
            departament: true,
            type: true,
            industry: true,
            experience: true,
            education: true,
            tags: true,
        }

        const result = await strapi.entityService.findMany(api, params);
        if(result.length == 0){ return null; }
    
        return result[0];
    },
    async create(params) {
        const ctx = strapi.requestContext.get();
        const user = await strapi.service('api::user.user').me();

        params.data.company = user.company.id;
        params.data.code = uuidv4();

        if(params.data.publishedAt){
            params.data.publishedAt = new Date();
        }else{
            params.data.publishedAt = null;
        }

        if(params.data.archived){
            params.data.archivedAt = new Date();
        }else{
            params.data.archivedAt = null;
        }

        //TODO: AUTOMATE EN STAGES (POSIBLE PROBLEMA CON IDS EN ATUOMATE RELATION)
        if(!user.company.plan.unlimitedJobs && !params.data.archived){ 
            const countJobs = await strapi.db.query(api).count({ 
                filters: { 
                    $and: [
                        {
                            company: user.company.id,
                        },
                        {
                            archived: 0,
                        },
                    ]
                },
                publicationState: 'preview'
            });
    
            if(countJobs >= 1){
                return ctx.forbidden('Your plan does not allow you to perform this action', {});
            }
        }

        const attributes = [];

        if(params.data.departament){     
            const departament = await strapi.service('api::departament.departament').findOne(params.data.departament); 
            if(!departament){ attributes.push('departament'); } 
        }          
                
        if(params.data.industry){   
            const industry = await strapi.service('api::industry.industry').findOne(params.data.industry);
            if(!industry){ attributes.push('industry'); }   
        }    
        
        if(params.data.tags){
            for(let i = 0; i < params.data.tags.length; i++){
                let tag = await strapi.service('api::tag-job.tag-job').findOne(params.data.tags[i]);
                if(!tag && !attributes.includes('tags')){
                    attributes.push('tags');
                }
            }
        } 

        if(params.data.tests){
            for(let i = 0; i < params.data.tests.length; i++){
                let test = await strapi.service('api::test.test').findOne(params.data.tests[i]);
                if(!test && !attributes.includes('tests')){
                    attributes.push('tests');
                }
            }
        } 

        let filtersPipeline = {
            $and: [
                {
                    company: user.company.id,
                },
            ],
        };

        if(params.data.pipeline){
            filtersPipeline.$and.push({
                id: params.data.pipeline,
            });

            delete params.data.pipeline;
        }else{
            filtersPipeline.$and.push({
                default: 1,
            });
        }

        let stages = [];

        const pipelines = await strapi.entityService.findMany('api::pipeline.pipeline', {
            filters: filtersPipeline,
            start: 0, 
            limit: 1,
            sort: { id: 'desc' },
        });
        if(pipelines.length == 0){ 
            attributes.push('pipeline'); 
        }else{
            stages = await strapi.entityService.findMany('api::stage.stage', {
                fields: [
                    'stage',
                    'type',
                    'order',
                ],
                filters: {
                    pipeline:{
                        id: pipelines[0].id
                    }
                },
                populate: {
                    automated: true,
                },
                sort: { order: 'asc' },
            });

            if(stages.length == 0){ 
                attributes.push('stages'); 
            }
        }

        let questions = [];

        if(params.data.questionnaire){
            questions = await strapi.entityService.findMany('api::question.question', {
                fields: [
                    'question',
                    'description',
                    'type',
                    'videoDuration',
                    'required',
                    'order',
                ],
                filters: {
                    $and: [
                        {
                            company: user.company.id,
                        },
                        {
                            questionnaire: params.data.questionnaire 
                        }
                    ],
                },
                populate: {
                    alternatives: true,
                },
                sort: { order: 'asc' },
            });
            delete params.data.questionnaire;
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
        
        const response = await super.create(params);

        if(stages.length > 0){
            for(let i = 0; i < stages.length; i++){
                await strapi.entityService.create('api::job-stage.job-stage', {
                    data: {
                        company: user.company.id,
                        job: response.id,
                        stage: stages[i].stage,
                        type: stages[i].type,
                        order: stages[i].order,
                    }
                });
            }
        }
        
        if(questions.length > 0){
            for(let i = 0; i < questions.length; i++){
                await strapi.entityService.create('api::job-question.job-question', {
                    data: {
                        company: user.company.id,
                        job: response.id,
                        question: questions[i].question,
                        description: questions[i].description,
                        type: questions[i].type,
                        videoDuration: questions[i].videoDuration,
                        required: questions[i].required,
                        order: questions[i].order,
                    }
                });
            }
        }
                
        await strapi.entityService.create('api::job-user.job-user', {
            data: {
                company: user.company.id,
                job: response.id,
                user: user.id,
                owner: 1,
            }
        });

        return response;
    },
    async update(entityId, params) {
        const user = await strapi.service('api::user.user').me();
        params.data.company = user.company.id;

        if(!user.company.plan.unlimitedJobs && !params.data.archived){ 
            const countJobs = await strapi.db.query(api).count({ 
                filters: { 
                    $and: [
                        {
                            company: user.company.id,
                        },
                        {
                            id: {
                                $ne: entityId,
                            }, 
                        },                   
                        {
                            archived: 0,
                        },
                    ]
                },
                publicationState: 'preview'
            });
    
            if(countJobs >= 1){
                return ctx.forbidden('Your plan does not allow you to perform this action', {});
            }
        }

        if(params.data.code){
            delete params.data.code;
        }

        if(params.data.publishedAt){
            params.data.publishedAt = new Date();
        }else{
            params.data.publishedAt = null;
        }

        const attributes = [];

        if(params.data.departament){     
            const departament = await strapi.service('api::departament.departament').findOne(params.data.departament); 
            if(!departament){ attributes.push('departament'); } 
        }         
                
        if(params.data.type){     
            const type = await strapi.service('api::type-job.type-job').findOne(params.data.type);
            if(!type){ attributes.push('type'); }  
        }        
                
        if(params.data.industry){   
            const industry = await strapi.service('api::industry.industry').findOne(params.data.industry);
            if(!industry){ attributes.push('industry'); }   
        }       
                
        if(params.data.experience){                   
            const experience = await strapi.service('api::experience.experience').findOne(params.data.experience);
            if(!experience){ attributes.push('experience'); }  
        }     
                
        if(params.data.education){
            const education = await strapi.service('api::education.education').findOne(params.data.education);
            if(!education){ attributes.push('education'); }
        } 
        
        if(params.data.tags){
            for(let i = 0; i < params.data.tags.length; i++){
                let tag = await strapi.service('api::tag-job.tag-job').findOne(params.data.tags[i]);
                if(!tag && !attributes.includes('tags')){
                    attributes.push('tags');
                }
            }
        } 

        if(params.data.tests){
            for(let i = 0; i < params.data.tests.length; i++){
                let test = await strapi.service('api::test.test').findOne(params.data.tests[i]);
                if(!test && !attributes.includes('tests')){
                    attributes.push('tests');
                }
            }
        } 

        if(params.data.pipeline){
            delete params.data.pipeline;
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
        
        const result = await strapi.service(api).findOne(entityId);
        if(!result){ return null; }

        if(params.data.archivedAt){
            delete params.data.archivedAt;
        }

        if(params.data.archived && !result.archived){
            params.data.archivedAt = new Date();
        }
        
        if(!params.data.archived){
            params.data.archivedAt = null;
        }

        const response = await super.update(entityId, params);
    
        return response;
    },
    async delete(entityId, params) {
        //TODO: ELIMINAR TODO LO RELACIONADO
        const user = await strapi.service('api::user.user').me();
        
        const result = await strapi.service(api).findOne(entityId);
        if(!result){ return null; }        

        const jobQuestions = await strapi.entityService.findMany('api::job-question.job-question', {
            fields: ['id'],
            filters: {
                job: result.id,
            },
        });

        if(jobQuestions.length > 0){
            const jobQuestionIds = jobQuestions.map(s => s.id);
    
            await strapi.db.query('api::job-question.job-question').deleteMany({
                where: {
                    id: {
                        $in: jobQuestionIds,
                    },
                },
            });
            
        }
        
        const jobLinks = await strapi.entityService.findMany('api::link.link', {
            fields: ['id'],
            filters: {
                job: result.id,
            },
        });

        if(jobLinks.length > 0){
            const jobLinkIds = jobLinks.map(s => s.id);
    
            await strapi.db.query('api::link.link').deleteMany({
                where: {
                    id: {
                        $in: jobLinkIds,
                    },
                },
            });
            
        }
        
        const jobAnswers = await strapi.entityService.findMany('api::job-answer.job-answer', {
            fields: ['id'],
            filters: {
                job: result.id,
            },
        });

        if(jobAnswers.length > 0){
            const jobAnswerIds = jobAnswers.map(s => s.id);
    
            await strapi.db.query('api::job-answer.job-answer').deleteMany({
                where: {
                    id: {
                        $in: jobAnswerIds,
                    },
                },
            });
            
        }
        
        const jobStages = await strapi.entityService.findMany('api::job-stage.job-stage', {
            fields: ['id'],
            filters: {
                job: result.id,
            },
        });

        if(jobStages.length > 0){
            const jobStageIds = jobStages.map(s => s.id);
    
            await strapi.db.query('api::job-stage.job-stage').deleteMany({
                where: {
                    id: {
                        $in: jobStageIds,
                    },
                },
            });
            
        }

        const jobCandidates = await strapi.entityService.findMany('api::job-candidate.job-candidate', {
            fields: ['id'],
            filters: {
                job: result.id,
            },
        });

        if(jobCandidates.length > 0){
            const jobCandidateIds = jobCandidates.map(s => s.id);
    
            await strapi.db.query('api::job-candidate.job-candidate').deleteMany({
                where: {
                    id: {
                        $in: jobCandidateIds,
                    },
                },
            });
            
        }

        const jobUsers = await strapi.entityService.findMany('api::job-user.job-user', {
            fields: ['id'],
            filters: {
                job: result.id,
            },
        });

        if(jobUsers.length > 0){
            const jobUserIds = jobUsers.map(s => s.id);
    
            await strapi.db.query('api::job-user.job-user').deleteMany({
                where: {
                    id: {
                        $in: jobUserIds,
                    },
                },
            });
            
        }
        
        const response = await super.delete(entityId, params);

        return response;
    }
}));
