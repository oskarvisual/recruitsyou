'use strict';

/**
 * job-candidate service
 */

const { ApplicationError } = require('@strapi/utils').errors;

//TODO: POPULATE
//TODO: CUANDO AGREGA CANDIDATO PRIMERO FILTRA SI YA EXISTE Y SI LO HACE DEVELVE LA CONSULTA Y NO LO VUELVE A AGREGAR
//TODO: OBTENER ULTIMO ORDEN DE CANDIDATO Y SUMARLE UNO ANTES DE AGREGARLO CUANDO ES ANTIGUO (CUANDO ES NUEVO YA LO HACE COPIAR)
//TODO: FALTA CONTROLLER PARA EXPORTAR CSV
//TODO: FALTA CONTROLLER PARA MOVER DE FASE
//TODO: CONTROLADOR CON TODOS LAS FASES Y CANDIDATOS ESPECIALMENTE HECHO PARA KANBAN DE REACT
const { createCoreService } = require('@strapi/strapi').factories;
const api = 'api::job-candidate.job-candidate';

module.exports = createCoreService(api, ({ strapi }) => ({
    async find(params) {
        const user = await strapi.service('api::user.user').me();

        const job = await strapi.service('api::job.job').findOne(params.filters.job); 
        if(!job){
            throw new ApplicationError('Job does not exist', {});
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

                let jobCandidates = await strapi.entityService.findMany('api::job-candidate.job-candidate', {
                    filters: {
                        job: job.id
                    },
                    populate: { 
                        candidate: {
                            fields: [
                                'id',
                                'email',
                                'firstName',
                                'lastName',
                                'birthDate',
                                'gender',
                            ],
                            populate: { 
                                photo: true,
                            }
                        },
                    },
                    sort: { order: 'asc' },
                });
                if(jobCandidates.length > 0){
                    for(let c = 0; c < jobCandidates.length; c++){
                        meta.candidates++;

                        let candidate = jobCandidates[c].candidate;

                        if(candidate.photo){
                            candidate.photo.url = await strapi.service('api::s3.s3').signedUrl(`${candidate.photo.hash}${candidate.photo.ext}`, candidate.photo.mime, 10 * 60);
                            delete candidate.photo.hash;
                            delete candidate.photo.provider;
                            delete candidate.photo.provider_metadata;
                            candidate.photo.formats = null;
                        }

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

        return response;

    },
}));