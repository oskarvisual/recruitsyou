'use strict';

/**
 * candidate service
 */

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
        //TODO: VER SI SE PUEDE MEJORAR FILTRO CON ESTO
        /*
        filters: {
            chef: {
            restaurants: {
                stars: {
                $eq: 5,
                },
            },
            },
        }
        */

        if(params.filters != undefined){
            let candidates = [];

            if(params.filters.job != undefined){
                if(params.filters.stage == undefined){
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
                        populate: ['candidate'],
                    });
    

                    for(let i = 0; i < jobCandidates.length; i++){
                        if(jobCandidates[i].candidate != undefined){
                            candidates.push(jobCandidates[i].candidate.id);
                        }
                    }

                    filters.$and.push({ id: {
                            $in: candidates
                        }
                    });
                }else{
                    if(params.filters.stage != undefined){
                        let stage = await strapi.entityService.findMany('api::job-stage.job-stage', {
                            filters: {
                                $and: [
                                    {
                                        company: user.company.id,
                                    },
                                    {
                                        job: params.filters.job,
                                    },
                                    {
                                        type: params.filters.stage,
                                    },
                                ],
                            },
                        });

                        if(stage.length > 0){
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
                                populate: ['candidate'],
                            });
            
                            for(let i = 0; i < stageCandidates.length; i++){
                                if(stageCandidates[i].candidate != undefined){
                                    candidates.push(stageCandidates[i].candidate.id);
                                }
                            }

                            filters.$and.push({ id: {
                                    $in: candidates
                                }
                            });
                        }
                    }
                }
            }else if(params.filters.stage != undefined){
                let stage = await strapi.entityService.findMany('api::job-stage.job-stage', {
                    filters: {
                        $and: [
                            {
                                company: user.company.id,
                            },
                            {
                                type: params.filters.stage,
                            },
                        ],
                    },
                });

                if(stage.length > 0){
                    let stages = [];
                    for(let i = 0; i < stage.length; i++){
                        stages.push(stage[i].id);
                    }

                    let stageCandidates = await strapi.entityService.findMany('api::job-candidate.job-candidate', {
                        filters: {
                            stage: stages
                        },
                        populate: ['candidate'],
                    });

                    for(let i = 0; i < stageCandidates.length; i++){
                        if(stageCandidates[i].candidate != undefined){
                            candidates.push(stageCandidates[i].candidate.id);
                        }
                    }

                    filters.$and.push({ id: {
                            $in: candidates
                        }
                    });
                }
            }
            if(params.filters.createdAt != undefined){
                filters.$and.push({ rating: {
                        $lte: params.filters.createdAt,
                    } 
                });
            }
            if(params.filters.email !== undefined){
                filters.$and.push({ email: {
                        $contains: params.filters.email,
                    }
                });
            }
            if(params.filters.salaryExpectationMin != undefined && params.filters.salaryExpectationMax != undefined){
                filters.$and.push({ rating: {
                        $between: [params.filters.salaryExpectationMin, params.filters.salaryExpectationMax],
                    } 
                })
            }
            if(params.filters.salaryExpectationMin != undefined && params.filters.salaryExpectationMax == undefined){
                filters.$and.push({ rating: {
                        $gte: params.filters.salaryExpectationMin,
                    } 
                })
            }
            if(params.filters.salaryExpectationMin == undefined && params.filters.salaryExpectationMax != undefined){
                filters.$and.push({ rating: {
                        $lte: params.filters.salaryExpectationMax,
                    } 
                })
            }
            if(params.filters.disqualify != undefined){
                filters.$and.push({ disqualify: params.filters.disqualify })
            }
            if(params.filters.disqualifyReason != undefined){
                filters.$and.push({ disqualifyReason: params.filters.disqualifyReason })
            }
            if(params.filters.tags != undefined){
                filters.$and.push({ rating: {
                        $in: params.filters.tags,
                    } 
                })
            }
            if(params.filters.source != undefined){
                filters.$and.push({ source: params.filters.source })
            }
            if(params.filters.referral != undefined){
                filters.$and.push({ referral: params.filters.referral })
            }
        }

        params.filters = filters;
        params.populate = { photo: true };
        const result = await super.find(params);

        for(let i = 0; i < result.results.length; i++){
            if(result.results[i].resume != null){
                result.results[i].resume.url = await strapi.service('api::s3.s3').SignedUrl(`${result.results[i].resume.hash}${result.results[i].resume.ext}`, result.results[i].resume.mime, 10 * 60);
                delete result.results[i].resume.hash;
                delete result.results[i].resume.provider;
                delete result.results[i].resume.provider_metadata;
            }
    
            if(result.results[i].photo != null){
                result.results[i].photo.url = await strapi.service('api::s3.s3').SignedUrl(`${result.results[i].photo.hash}${result.results[i].photo.ext}`, result.results[i].photo.mime, 10 * 60);
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
            nationality: true,
            timezone: true,
            experience: true,
            education: true,
            tags: true,
            referrals: true,
            disqualifyReason: true,
        };

        const result = await strapi.entityService.findMany(api, params);
        if(result.length == 0){ return null; }

        if(result[0].resume != null){
            result[0].resume.url = await strapi.service('api::s3.s3').SignedUrl(`${result[0].resume.hash}${result[0].resume.ext}`, result[0].resume.mime, 10 * 60);
            delete result[0].resume.hash;
            delete result[0].resume.provider;
            delete result[0].resume.provider_metadata;
        }

        if(result[0].photo != null){
            result[0].photo.url = await strapi.service('api::s3.s3').SignedUrl(`${result[0].photo.hash}${result[0].photo.ext}`, result[0].photo.mime, 10 * 60);
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
            if(result[0].resume == null && params.data.resume != undefined){
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
        if(result == null){ return null; }

        const response = await super.update(entityId, params);
    
        return response;
    },
    async delete(entityId, params) {
        const user = await strapi.service('api::user.user').me();
        //TODO: ELIMINAR ARCHIVOS Y TAMBIEN DE JOBS CANDIDATES
        
        const result = await strapi.service(api).findOne(entityId);
        if(result == null){ return null; }

        const jobCandidates = await strapi.db.query('api::job-candidate.job-candidate').findMany({
            filters: {
                candidate: entityId,
            },
        });

        if(jobCandidates.length > 0){
            const jobCandidateIds = [];
            for(let i = 0; i < jobCandidates.length; i++){
                jobCandidateIds.push(jobCandidates[i].id);
            }
    
            await strapi.db.query('api::job-candidate.job-candidate').deleteMany({
                where: {
                    id: {
                        $in: jobCandidateIds,
                    },
                },
            });
            
        }

        const fileCandidates = await strapi.db.query('api::candidate-file.candidate-file').findMany({
            filters: {
                candidate: entityId,
            },
        });

        if(fileCandidates.length > 0){
            const fileCandidateIds = [];
            for(let i = 0; i < fileCandidates.length; i++){
                fileCandidateIds.push(fileCandidates[i].id);
            }
    
            await strapi.db.query('api::candidate-file.candidate-file').deleteMany({
                where: {
                    id: {
                        $in: fileCandidateIds,
                    },
                },
            });
            
        }
        
        const response = await super.delete(entityId, params);

        return response;
    }
}));
