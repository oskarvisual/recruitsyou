'use strict';

/**
 * job service
 */

const { createCoreService } = require('@strapi/strapi').factories;
const api = 'api::job.job';
module.exports = createCoreService(api, ({ strapi }) => ({
    async find(params) {
        const user = await strapi.service('api::user.user').me();
        if(user){ params.filters = { company: user.company.id } }
        else{ 
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
    //TODO: AGREGAR SERIVICO PARA POSTULAR (AGREGA USUARIO A JOB Y A JOB STAGE) 
    async create(params) {
        //TODO: FALTA LOGICA PARA LIMITAR ACCION POR PLAN
        //TODO: LOGICA PARA COPIAR PIPELINE DEFAULT COMO PLANTILAA
        //TODO AGREGAR LOGICA PARA COPIAR DE DEFAULT O PLANTILLA
        const user = await strapi.service('api::user.user').me();
        params.data.company = user.company.id;
        
        const response = await super.create(params);

        return response;
    },
    //TODO AGREGAR LOGICA PARA COPIAR PIPELINES
    async update(entityId, params) {
        const user = await strapi.service('api::user.user').me();
        params.data.company = user.company.id;
        
        const result = await strapi.service(api).findOne(entityId);
        if(!result){ return null; }

        const response = await super.update(entityId, params);
    
        return response;
    },
    async delete(entityId, params) {
        //TODO: CUANDO SE ELIMINA UN TRABAJO SE ELIMINA TODO LO RELACIONADO (STAGES, QUESTIONS, ANSWERS, CANDIDATOS, ETC)
        const user = await strapi.service('api::user.user').me();
        
        const result = await strapi.service(api).findOne(entityId);
        if(!result){ return null; }
        
        const response = await super.delete(entityId, params);

        return response;
    }
}));
