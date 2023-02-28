'use strict';

/**
 * job controller
 */

const { createCoreController } = require('@strapi/strapi').factories;
//TODO: VALIDAR QUE RELACIONES EXISTAN EN LA EMPRESA (IGUAL EN CANDIDATOS Y TODO LO SIMILAR)
//TODO: FALTA LOGICA PARA LIMITAR ACCION POR PLAN
//TODO: CUANDO HACE DOWNGRADE A FREE ARCHIVAR TODOS LOS TRABAJOS
//TODO: AGREGAR DUPLICAR O USAR COMO PLANTILLA LO MAS FACIL
module.exports = createCoreController('api::job.job', ({ strapi }) => ({
    async report(ctx){
        const { id } = ctx.params;
        const job = await strapi.service('api::job.job').findOne(id, ctx);
        
        if(!job){
            return ctx.notFound('Not Found', {});
        }

        const report = {
            candidates: {
                total: 0,
                disqualified: 0,
                apply: 0,
                interview: 0,
                hire: 0,
                hired: 0,
                overTime: {
                    
                }
            },
            sources: {
                linkedin: 0,
                indeed: 0,
                careeSite: 0,
            },
            time: {
                toHire: 0,
                toDisqualify: 0,
            },
            nps: 0,
            disqualify: {
                reasons: {

                },
                stages: {

                }
            },
            evaluation:{
                total: 0,
                avg: 0,
                no: 0,
                yes: 0,
                great: 0,
            }
        };


        ctx.body = {
            data: report,
            meta: {}
        };
    }
}));
