'use strict';

/**
 * job-candidate service
 */

const { ApplicationError } = require('@strapi/utils').errors;

const moment = require('moment');

const { createCoreService } = require('@strapi/strapi').factories;
const api = 'api::job-candidate.job-candidate';

module.exports = createCoreService(api, ({ strapi }) => ({
    async find(params) {
        const user = await strapi.service('api::user.user').me();
        //TODO: FALTA PONER PROMEDIO DE EVALUACIONES y NUMERO DE NOTAS
        //TODO: PONER AÑOS DE EXPERIENCIA (MAX AÑO - MIN AÑO)
        //TODO: FILTRO POR SKILLS Y TAGS

        const job = await strapi.service('api::job.job').findOne(params.filters.job); 
        if(!job){
            throw new ApplicationError('Job does not exist', {});
        }

        let filtersCandidates = {
            $and: [
                {
                    company: user.company.id,
                },
                {
                    job: job.id,
                },
            ],
        }

        if(params.filters.createdAtMin){
            filtersCandidates.$and.push({ 
                candidate: {
                    createdAt: {
                        $gte: params.filters.createdAtMin,
                    }
                }
            });
        }
        if(params.filters.createdAtMax){
            filtersCandidates.$and.push({ 
                candidate: {
                    createdAt: {
                        $lte: params.filters.createdAtMax,
                    } 
                } 
            });
        }
        if(params.filters.email){
            filtersCandidates.$and.push({ 
                candidate: {
                    email: {
                        $contains: params.filters.email,
                    }
                }
            });
        }
        if(params.filters.salaryExpectationMin){
            filtersCandidates.$and.push({ 
                candidate: {
                    salaryExpectation: {
                        $gte: params.filters.salaryExpectationMin,
                    } 
                } 
            })
        }
        if(params.filters.salaryExpectationMax){
            filtersCandidates.$and.push({ 
                candidate: {
                    salaryExpectation: {
                        $lte: params.filters.salaryExpectationMax,
                    } 
                } 
            })
        }
        if(params.filters.disqualify){
            filtersCandidates.$and.push({ 
                candidate: {
                    disqualify: params.filters.disqualify 
                }
            })
        }
        if(params.filters.disqualifyReason){
            filtersCandidates.$and.push({ 
                candidate: {
                    disqualifyReason: params.filters.disqualifyReason 
                }
            })
        }
        if(params.filters.tags){
            filtersCandidates.$and.push({ 
                candidate: {
                    tags: {
                        $in: params.filters.tags,
                    } 
                } 
            })
        }
        if(params.filters.source){
            filtersCandidates.$and.push({ 
                candidate: {
                    source: params.filters.source 
                }
            })
        }
        if(params.filters.referral){
            filtersCandidates.$and.push({ 
                candidate: {
                    referral: params.filters.referral 
                }
            })
        }
        if(params.filters.gpdrExpired && user.company.gpdr){
            filtersCandidates.$and.push({ 
                candidate: {
                    createdAt: {
                        $lte: moment(new Date()).subtract(user.company.gpdrRetentionDays, 'days').format()
                    }
                }
            })
        }

        let data = {
            columns: []
        }

        let meta = {
            stages: 0,
            candidates: 0,
        }

        const stages = await strapi.entityService.findMany('api::job-stage.job-stage', {
            filters: {
                job: job.id
            }
        });

        if(stages.length > 0){
            for(let s = 0; s < stages.length; s++){
                meta.stages++;

                let stage = {
                    id: stages[s].id,
                    title: stages[s].stage,
                    cards: []
                }

                let filtersStageCandidates = filtersCandidates;

                filtersStageCandidates.$and.push({ 
                    stage: stages[s].id
                });

                let jobCandidates = await strapi.entityService.findMany(api, {
                    filters: filtersStageCandidates,
                    populate: { 
                        candidate: {
                            fields: [
                                'id',
                                'email',
                                'firstName',
                                'lastName',
                                'birthDate',
                                'gender',
                                'createdAt',
                                'updatedAt',
                            ],
                            populate: { 
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
                        },
                    },
                    sort: { order: 'asc' },
                });

                if(jobCandidates.length > 0){
                    for(let c = 0; c < jobCandidates.length; c++){
                        meta.candidates++;

                        let candidate = await strapi.service('api::candidate.candidate').formatData(jobCandidates[c].candidate, { jobs: true});
                        candidate.jobCandidateId = jobCandidates[c].id;
                        
                        stage.cards.push(candidate);
                    }
                }

                data.columns.push(stage);
            }
        }
        
        return { data, meta };
    },
    async create(params) {
        const ctx = strapi.requestContext.get();
        const user = await strapi.service('api::user.user').me();

        params.data.company = user.company.id;

        const attributes = [];

        const jobStageOrder = await strapi.service('api::job-stage.job-stage').getJobStageOrder(params.data.job, 'sourced');
        if(!jobStageOrder){ attributes.push('job'); }  

        const candidate = await strapi.service('api::candidate.candidate').findOne(params.data.candidate);
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

        let candidates = await strapi.db.query(api).findMany({
            filters: {
                $and: [
                    {
                        company: user.company.id,
                    },
                    {
                        job: jobStageOrder.jobId,
                    },
                    {
                        candidate: candidate.id,
                    },
                ],
            },
            start: 0, 
            limit: 1,
            sort: { order: 'desc' },
        });
        if(candidates.length > 0){
            return candidates[0];
        }

        params.data.candidate = candidate.id;
        params.data.job = jobStageOrder.jobId;
        params.data.stage = jobStageOrder.stageId;
        params.data.order = jobStageOrder.order;
        
        const response = await super.create(params);

        //TODO: CREAR LLAMADA A FUNCION PARA ACCIONES AUTOMATICAS Y SI ES ASI LAS HACE Y LOGS Y WEBHOOKS

        return response;

    },
    async update(entityId, params) {
        const ctx = strapi.requestContext.get();
        const user = await strapi.service('api::user.user').me();

        params.data.company = user.company.id;

        const attributes = [];

        const job = await strapi.service('api::job.job').findOne(params.data.job);
        if(!job){ attributes.push('job'); }  

        const jobStage = await strapi.service('api::job-stage.job-stage').findOne(params.data.stage);
        if(!jobStage){ attributes.push('stage'); }  

        const jobStageOrder = await strapi.service('api::job-stage.job-stage').getJobStageOrder(params.data.job, params.data.stage);
        let maxOrder = (jobStageOrder.order == 0) ? 0 : jobStageOrder.order;
        
        const candidateSearch = await strapi.entityService.findMany(api, {
            filters: {
                $and: [
                    {
                        company: user.company.id,
                    },
                    {
                        job: params.data.job,
                    },
                    {
                        id: entityId,
                    },
                ],
            },
            populate: { 
                candidate: {
                    fields: [
                        'id',
                    ],
                },
                stage: {
                    fields: [
                        'id',
                    ],
                },
            },
            start: 0, 
            limit: 1,
            sort: { order: 'desc' },
        });

        if(candidateSearch.length == 0){ attributes.push('jobCandidate'); }  

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

        const stageCurrent = candidateSearch[0].stage.id;
        const orderCurrent = candidateSearch[0].order;

        if(params.data.stage == stageCurrent && maxOrder > 0){
            maxOrder = maxOrder - 1;
        }

        if((params.data.order > maxOrder) || params.data.order == undefined){
            params.data.order = maxOrder;
        }

        let filtersFrom = {
            $and: [
                {
                    company: user.company.id,
                },
                {
                    job: params.data.job,
                },
                {
                    stage: stageCurrent,
                },
                {
                    candidate: {
                        id: {
                            $ne: candidateSearch[0].candidate.id
                        }
                    },
                },
            ],
        }

        if(params.data.stage == stageCurrent){
            if(params.data.order > orderCurrent){
                filtersFrom.$and.push({
                    order: {
                        $gt: orderCurrent
                    },
                });
                filtersFrom.$and.push({
                    order: {
                        $lte: params.data.order
                    },
                });
            }else{
                filtersFrom.$and.push({
                    order: {
                        $gte: params.data.order
                    },
                });
                filtersFrom.$and.push({
                    order: {
                        $lt: orderCurrent
                    },
                });
            }
        }else{
            filtersFrom.$and.push({
                order: {
                    $gt: orderCurrent
                },
            });
        }
        
        const candidatesFrom = await strapi.entityService.findMany(api, {
            filters: filtersFrom,
            populate: {},
            sort: { order: 'asc' },
        });

        if(candidatesFrom.length > 0){
            for(let i = 0; i < candidatesFrom.length; i++){
                let newOrder = candidatesFrom[i].order;

                if(params.data.stage == stageCurrent){
                    if(params.data.order > orderCurrent){
                        newOrder = newOrder - 1;
                    }else{
                        newOrder = newOrder + 1;
                    }
                }else{
                    newOrder = newOrder - 1;
                }
                await strapi.entityService.update(api, candidatesFrom[i].id, {
                    data: {
                        order: newOrder,
                    },
                });
            }
        }

        if(params.data.stage != stageCurrent){
            const candidatesTo = await strapi.entityService.findMany(api, {
                filters: {
                    $and: [
                        {
                            company: user.company.id,
                        },
                        {
                            job: params.data.job,
                        },
                        {
                            stage: params.data.stage,
                        },
                        {
                            order: {
                                $gte: params.data.order
                            },
                        },
                    ],
                },
                populate: { 
                    candidate: {
                        fields: [
                            'id',
                        ],
                    },
                },
                sort: { order: 'asc' },
            });
    
            if(candidatesTo.length > 0){
                for(let i = 0; i < candidatesTo.length; i++){
                    await strapi.entityService.update(api, candidatesTo[i].id, {
                        data: {
                            order: candidatesTo[i].order + 1,
                        },
                    });
                }
            }

            //TODO: CREAR LLAMADA A FUNCION PARA ACCIONES AUTOMATICAS Y SI ES ASI LAS HACE Y LOGS Y WEBHOOKS
        }

        const response = await super.update(candidateSearch[0].id, {
            data: {
                stage: params.data.stage,
                order: params.data.order,
            }
        });

        return response;
    },
    async delete(entityId, params) {
        const ctx = strapi.requestContext.get();
        const user = await strapi.service('api::user.user').me();

        const candidateSearch = await strapi.entityService.findMany(api, {
            filters: {
                $and: [
                    {
                        company: user.company.id,
                    },
                    {
                        id: entityId,
                    },
                ],
            },
            populate: { 
                job: {
                    fields: [
                        'id',
                    ],
                },
                stage: {
                    fields: [
                        'id',
                    ],
                },
                candidate: {
                    fields: [
                        'id',
                    ],
                },
            },
            start: 0, 
            limit: 1,
            sort: { order: 'desc' },
        });

        if(candidateSearch.length == 0){ return null; }  

        await strapi.service(api).deleteData(result);

        const result = await super.delete(entityId, params); 

        //TODO: MANDA LOGS Y WEBHOOKS
      
        return result;
    },
    async deleteData(candidateSearch){
        const candidates = await strapi.entityService.findMany(api, {
            filters: {
                $and: [
                    {
                        job: candidateSearch[0].job.id,
                    },
                    {
                        stage: candidateSearch[0].stage.id,
                    },
                    {
                        candidate: {
                            id: {
                                $ne: candidateSearch[0].candidate.id
                            }
                        },
                    },
                    {
                        order: {
                            $gt: candidateSearch[0].order
                        },
                    },
                ],
            },
            sort: { order: 'asc' },
        });

        if(candidates.length > 0){
            for(let i = 0; i < candidates.length; i++){
                await strapi.entityService.update(api, candidates[i].id, {
                    data: {
                        order: candidates[i].order - 1,
                    },
                });
            }
        }
    }
}));