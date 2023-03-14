'use strict';

/**
 * candidate service
 */

const utils = require('@strapi/utils');

const moment = require('moment');

const { createCoreService } = require('@strapi/strapi').factories;
const api = 'api::candidate.candidate';

module.exports = createCoreService(api, ({ strapi }) => ({
    async find(params) {
        //TODO: FILTRO POR SKILLS Y TAGS
        const user = await strapi.service('api::user.user').me();
        
        let filters = {
            $and: [
                {
                    company: user.company.id,
                },
            ],
        }

        let filterJob = 0;

        if(params.filters){
            let candidates = [];

            if(params.filters.job){
                filterJob = params.filters.job;
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
                    populate: { 
                        job: {
                            fields: [
                                'id',
                            ],
                        },
                    },
                });

                if(stage.length == 0){
                    return { results: null, pagination: null };
                }
                
                filterJob = stage[0].job.id;

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
            if(params.filters.createdAtMin){
                filters.$and.push({ createdAt: {
                        $gte: params.filters.createdAtMin,
                    } 
                });
            }
            if(params.filters.createdAtMax){
                filters.$and.push({ createdAt: {
                        $lte: params.filters.createdAtMax,
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
            if(params.filters.gpdrExpired && user.company.gpdr){
                filters.$and.push({ 
                    createdAt: {
                        $lte: moment(new Date()).subtract(user.company.gpdrRetentionDays, 'days').format()
                    }
                })
            }
        }

        params.filters = filters;
        params.populate = { 
            source: true,
            tags: true,
            referrals: true,
            disqualifyReason: true,
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
        };
        
        const result = await super.find(params);

        for(let i = 0; i < result.results.length; i++){
            result.results[i] = await strapi.service(api).formatData(result.results[i]);
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
            socialNetwork: true,
            source: true,
            experience: true,
            education: true,
            tags: true,
            referrals: true,
            disqualifyReason: true,
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
            resume: {
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
        };

        const result = await strapi.entityService.findMany(api, params);
        if(result.length == 0){ return null; }

        const candidate = await strapi.service(api).formatData(result[0]);

        return candidate;
    },
    async formatData(candidate, hide = {}){
        if(!candidate){ return false; }

        if(hide.jobs !== true){
            const jobs = await strapi.entityService.findMany('api::job-candidate.job-candidate', {
                filters: {
                    candidate: candidate.id,
                },
                fields: [
                    'id',
                    'order',
                ],
                populate: { 
                    job: {
                        fields: [
                            'id',
                            'title',
                            'archived',
                        ],
                    },
                    stage: {
                        fields: [
                            'id',
                            'stage',
                            'type',
                        ],
                    },
                },
                sort: { createdAt: 'desc' },
            });

            candidate.jobs = jobs;
        }

        if(hide.evaluations !== true){
            const maxEvaluation = 3;
            candidate.evaluations = 0;
            candidate.evaluationsAvg = false;
            candidate.evaluationsPercentage = false;

            const evaluations = await strapi.entityService.findMany('api::evaluation.evaluation', {
                filters: {
                    candidate: candidate.id,
                },
                fields: [
                    'id',
                    'evaluation',
                ],
            });

            candidate.evaluations = evaluations.length;

            if(evaluations.length > 0){
                let evaluationsArray = evaluations.map(s => s.evaluation);
                let evaluationsSum = evaluationsArray.reduce((previous, current) => current += previous);

                candidate.evaluationsAvg = evaluationsSum / evaluationsArray.length;
                candidate.evaluationsPercentage = new Intl.NumberFormat('default', {
                    style: 'percent',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                }).format((evaluationsSum * 100) / (maxEvaluation * evaluationsArray.length) / 100);
            }
        }

        if(hide.notes !== true){
            candidate.notes = await strapi.db.query('api::note.note').count({ 
                filters: { 
                    candidate: candidate.id
                },
            });
        }

        if(hide.experience !== true){
            let fromYear = 0;
            let toYear = 0;

            candidate.yearsExperience = false;
            
            if(candidate.experience?.length > 0){
                
                for(let i = 0; i < candidate.experience.length; i++){
                    if(candidate.experience[i].fromYear < fromYear || fromYear == 0){
                        fromYear = candidate.experience[i].fromYear;
                    }

                    if(candidate.experience[i].toYear > toYear){
                        toYear = candidate.experience[i].toYear;
                    }
                }
            }

            if(fromYear > 0 && toYear > 0){
                let yearsExperience = toYear - fromYear;
                
                candidate.yearsExperience = (yearsExperience <= 0) ? 1 : yearsExperience;
            }
        }


        if(candidate.resume){
            candidate.resume.url = await strapi.service('api::s3.s3').signedUrl(`${candidate.resume.hash}${candidate.resume.ext}`, candidate.resume.mime, 10 * 60);
            delete candidate.resume.hash;
        }

        if(candidate.photo){
            candidate.photo.url = await strapi.service('api::s3.s3').signedUrl(`${candidate.photo.hash}${candidate.photo.ext}`, candidate.photo.mime, 10 * 60);
            delete candidate.photo.hash;
        }

        return candidate;
    },
    async create(params) {
        const user = await strapi.service('api::user.user').me();
        params.data.company = user.company.id;

        if(user && params.data.demo){
            delete params.data.demo;
        }

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

        if(user && params.data.demo){
            delete params.data.demo;
        }

        const result = await strapi.service(api).findOne(entityId);
        if(!result){ return null; }

        const response = await super.update(entityId, params);
    
        return response;
    },
    async delete(entityId, params) {
        const user = await strapi.service('api::user.user').me();
        
        const result = await strapi.service(api).findOne(entityId);
        if(!result){ return null; }

        await strapi.service(api).deleteData(result);
        
        const response = await super.delete(entityId, params);

        return response;
    },
    async deleteGpdr() {
        const user = await strapi.service('api::user.user').me();

        if(!user.company.gpdr){
            return 0;
        }

        let candidatesDeleted = 0;

        const candidates = await strapi.entityService.findMany(api, {
            filters: {
                $and: [
                    {
                        company: user.company.id,
                    },
                    {
                        consent: 0,
                    },
                    { 
                        createdAt: {
                            $lte: moment(new Date()).subtract(user.company.gpdrRetentionDays, 'days').format()
                        }
                    }
                ],
            }
        });

        if(candidates.length > 0){
            for(let i = 0; i < candidates.length; i++){
                await strapi.service(api).delete(candidates[i].id, {});
                candidatesDeleted++;
            }
        }

        return candidatesDeleted;
    },
    async deleteData(candidate){
        const jobCandidates = await strapi.entityService.findMany('api::job-candidate.job-candidate', {
            fields: ['id'],
            filters: {
                candidate: candidate.id,
            },
        });

        if(jobCandidates.length > 0){
            for (let i = 0; i < jobCandidates.length; i++){
                let candidateSearch = await strapi.entityService.findMany('api::job-candidate.job-candidate', {
                    filters: {
                        $and: [
                            {
                                id: jobCandidates[i].id,
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

                await strapi.service('api::job-candidate.job-candidate').deleteData(candidateSearch);
                await strapi.db.query('api::job-candidate.job-candidate').delete({
                    where: { id: jobCandidates[i].id },
                });
            }
            
        }

        const candidateDocuments = await strapi.entityService.findMany('api::document.document', {
            fields: ['id'],
            filters: {
                candidate: candidate.id,
            },
            populate: {
                files: true,
            }
        });

        if(candidateDocuments.length > 0){
            for (let i = 0; i < candidateDocuments.length; i++){
                await strapi.service('api::document.document').deleteFiles(candidateDocuments[i].files, {});
                await strapi.db.query('api::document.document').delete({
                    where: { id: candidateDocuments[i].id },
                });
            }
        }

        if(!candidate.demo){
            if(candidate.photo){
                let file = await strapi.db.query('plugin::upload.file').delete({
                    where: { id: candidate.photo.id },
                });
                strapi.plugins.upload.services.upload.remove(file);
            }
        }
        
        if(candidate.resume){
            let file = await strapi.db.query('plugin::upload.file').delete({
                where: { id: candidate.resume.id },
            });
            strapi.plugins.upload.services.upload.remove(file);
        }

        const nps = await strapi.entityService.findMany('api::nps.nps', {
            fields: ['id'],
            filters: {
                candidate: candidate.id,
            },
        });
        
        if(nps.length > 0){
            const npsIds = nps.map(s => s.id);
    
            await strapi.db.query('api::nps.nps').deleteMany({
                where: {
                    id: {
                        $in: npsIds,
                    },
                },
            });
        }

        const tasks = await strapi.entityService.findMany('api::task.task', {
            fields: ['id'],
            filters: {
                candidate: candidate.id,
            },
        });
        
        if(tasks.length > 0){
            const tasksIds = tasks.map(s => s.id);
    
            await strapi.db.query('api::task.task').deleteMany({
                where: {
                    id: {
                        $in: tasksIds,
                    },
                },
            });
        }

        const notes = await strapi.entityService.findMany('api::note.note', {
            fields: ['id'],
            filters: {
                candidate: candidate.id,
            },
        });
        
        if(notes.length > 0){
            const notesIds = notes.map(s => s.id);
    
            await strapi.db.query('api::note.note').deleteMany({
                where: {
                    id: {
                        $in: notesIds,
                    },
                },
            });
        }

        const evaluations = await strapi.entityService.findMany('api::evaluation.evaluation', {
            fields: ['id'],
            filters: {
                candidate: candidate.id,
            },
        });
        
        if(evaluations.length > 0){
            const evaluationsIds = evaluations.map(s => s.id);
    
            await strapi.db.query('api::evaluation.evaluation').deleteMany({
                where: {
                    id: {
                        $in: evaluationsIds,
                    },
                },
            });
        }
    }
}));
