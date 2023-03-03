'use strict';

/**
 * candidate service
 */

const utils = require('@strapi/utils');

const { createCoreService } = require('@strapi/strapi').factories;
const api = 'api::candidate.candidate';

module.exports = createCoreService(api, ({ strapi }) => ({
    async find(params) {
        const user = await strapi.service('api::user.user').me();
        
        let filters = {
            $and: [
                {
                    company: user.company.id,
                },
            ],
        }

        if(params.filters){
            let candidates = [];

            if(params.filters.job){
                if(!params.filters.stage){
                    const jobCandidates = await strapi.entityService.findMany('api::job-candidate.job-candidate', {
                        filters: {
                            $and: [
                                {
                                    company: user.company.id,
                                },
                                {
                                    job: params.filters.job,
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
                    });
                    
                    if(jobCandidates.length == 0){
                        return { results: null, pagination: null };
                    }

                    candidates = jobCandidates.map(s => s.candidate.id);
                    
                    filters.$and.push({ id: {
                            $in: candidates
                        }
                    });
                }else{
                    let stageFilters = {
                        $and: [
                            {
                                company: user.company.id,
                            },
                            {
                                job: params.filters.job,
                            },
                        ],
                    };

                    if(typeof(params.filters.stage) == 'number'){
                        stageFilters.$and.push({
                            id: params.filters.stage,
                        });
                    }else{
                        stageFilters.$and.push({
                            type: params.filters.stage,
                        });
                    }

                    let stage = await strapi.entityService.findMany('api::job-stage.job-stage', {
                        filters: stageFilters,
                    });

                    if(stage.length == 0){
                        return { results: null, pagination: null };
                    }

                    let stageCandidates = await strapi.entityService.findMany('api::job-candidate.job-candidate', {
                        filters: {
                            $and: [
                                {
                                    company: user.company.id,
                                },
                                {
                                    job: params.filters.job,
                                },
                                {
                                    stage: stage[0].id,
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
                    });
            
                    if(stageCandidates.length == 0){
                        return { results: null, pagination: null };
                    }

                    candidates = stageCandidates.map(s => s.candidate.id);

                    filters.$and.push({ id: {
                            $in: candidates
                        }
                    });
                }
            }else if(params.filters.stage){
                let stageFilters = {
                    $and: [
                        {
                            company: user.company.id,
                        },
                    ],
                };

                if(typeof(params.filters.stage) == 'number'){
                    stageFilters.$and.push({
                        id: params.filters.stage,
                    });
                }else{
                    stageFilters.$and.push({
                        type: params.filters.stage,
                    });
                }


                let stage = await strapi.entityService.findMany('api::job-stage.job-stage', {
                    filters: stageFilters,
                });

                if(stage.length == 0){
                    return { results: null, pagination: null };
                }

                let stages = stage.map(s => s.id);

                let stageCandidates = await strapi.entityService.findMany('api::job-candidate.job-candidate', {
                    filters: {
                        stage: {
                            id: {
                                $in: stages
                            }
                        }
                    },
                    populate: { 
                        candidate: {
                            fields: [
                                'id',
                            ],
                        },
                    },
                });
                
                if(stageCandidates.length == 0){
                    return { results: null, pagination: null };
                }

                candidates = stageCandidates.map(s => s.candidate.id);

                filters.$and.push({ id: {
                        $in: candidates
                    }
                });
            }
            if(params.filters.createdAt){
                filters.$and.push({ createdAt: {
                        $lte: params.filters.createdAt,
                    } 
                });
            }
            if(params.filters.email){
                filters.$and.push({ email: {
                        $contains: params.filters.email,
                    }
                });
            }
            if(params.filters.salaryExpectationMin){
                filters.$and.push({ salaryExpectation: {
                        $gte: params.filters.salaryExpectationMin,
                    } 
                })
            }
            if(params.filters.salaryExpectationMax){
                filters.$and.push({ salaryExpectation: {
                        $lte: params.filters.salaryExpectationMax,
                    } 
                })
            }
            if(params.filters.disqualify){
                filters.$and.push({ disqualify: params.filters.disqualify })
            }
            if(params.filters.disqualifyReason){
                filters.$and.push({ disqualifyReason: params.filters.disqualifyReason })
            }
            if(params.filters.tags){
                filters.$and.push({ tags: {
                        $in: params.filters.tags,
                    } 
                })
            }
            if(params.filters.source){
                filters.$and.push({ source: params.filters.source })
            }
            if(params.filters.referral){
                filters.$and.push({ referral: params.filters.referral })
            }
        }

        params.filters = filters;
        params.populate = { 
            photo: true,
        };
        
        const result = await super.find(params);

        for(let i = 0; i < result.results.length; i++){
            if(result.results[i].resume){
                result.results[i].resume.url = await strapi.service('api::s3.s3').signedUrl(`${result.results[i].resume.hash}${result.results[i].resume.ext}`, result.results[i].resume.mime, 10 * 60);
                delete result.results[i].resume.hash;
                delete result.results[i].resume.provider;
                delete result.results[i].resume.provider_metadata;
            }
    
            if(result.results[i].photo){
                result.results[i].photo.url = await strapi.service('api::s3.s3').signedUrl(`${result.results[i].photo.hash}${result.results[i].photo.ext}`, result.results[i].photo.mime, 10 * 60);
                delete result.results[i].photo.hash;
                delete result.results[i].photo.provider;
                delete result.results[i].photo.provider_metadata;
                result.results[i].photo.formats = null;
            }
        }
        
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
        params.populate = { 
            photo: true,
            socialNetwork: true,
            source: true,
            resume: true,
            experience: true,
            education: true,
            tags: true,
            referrals: true,
            disqualifyReason: true,
        };

        const result = await strapi.entityService.findMany(api, params);
        if(result.length == 0){ return null; }

        if(result[0].resume){
            result[0].resume.url = await strapi.service('api::s3.s3').signedUrl(`${result[0].resume.hash}${result[0].resume.ext}`, result[0].resume.mime, 10 * 60);
            delete result[0].resume.hash;
            delete result[0].resume.provider;
            delete result[0].resume.provider_metadata;
        }

        if(result[0].photo){
            result[0].photo.url = await strapi.service('api::s3.s3').signedUrl(`${result[0].photo.hash}${result[0].photo.ext}`, result[0].photo.mime, 10 * 60);
            delete result[0].photo.hash;
            delete result[0].photo.provider;
            delete result[0].photo.provider_metadata;
            result[0].photo.formats = null;
        }

        return result[0];
    },
    async create(params) {
        const user = await strapi.service('api::user.user').me();
        params.data.company = user.company.id;

        const result = await strapi.entityService.findMany(api, {
            filters: {
                $and: [
                    {
                        company: user.company.id,
                    },
                    {
                        email: params.data.email,
                    },
                ],
            },
            populate: { resume: true, }
        });
        
        if(result.length > 0){ 
            if(!result[0].resume && params.data.resume){
                await strapi.service('api::candidate.candidate').update(result[0].id, {
                    data:{
                        resume: resume,
                    }
                });
            }
            result[0].exist = true;
            return result[0]; 
        }
        
        const response = await super.create(params);

        return response;
    },
    async apply(params) {
        //TODO: AGREGAR LOGICA PARA POSTULAR CANDIDATOS
        //TODO: SI YA EXISTE DEVUELVE EL CANDIDATO
    },
    async onboarding(params) {
        //TODO: AGREGAR LOGICA PARA ENVIAR DOCUMENTOS
    },
    async update(entityId, params) {
        const user = await strapi.service('api::user.user').me();

        params.data.company = user.company.id;

        const result = await strapi.service(api).findOne(entityId);
        if(!result){ return null; }

        const response = await super.update(entityId, params);
    
        return response;
    },
    async delete(entityId, params) {
        const user = await strapi.service('api::user.user').me();
        //TODO: ELIMINAR ARCHIVOS Y TAMBIEN DE JOBS CANDIDATES
        
        const result = await strapi.service(api).findOne(entityId);
        if(!result){ return null; }
        
        const response = await super.delete(entityId, params);

        return response;
    }
}));
