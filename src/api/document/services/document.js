'use strict';

/**
 * document service
 */

const { createCoreService } = require('@strapi/strapi').factories;
//TODO: FALTA LOGICA PARA LIMITAR ACCION POR PLAN
//TODO: FALTA POPULATE POR DEFECTO
module.exports = createCoreService('api::document.document');
