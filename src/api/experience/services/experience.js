'use strict';

/**
 * experience service
 */
//TODO: FALTA LOGICA PARA LIMITAR ACCION POR PLAN
const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::experience.experience');
