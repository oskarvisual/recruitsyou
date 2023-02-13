'use strict';

/**
 * test service
 */

const { createCoreService } = require('@strapi/strapi').factories;
//TODO: FALTA LOGICA PARA LIMITAR ACCION POR PLAN
module.exports = createCoreService('api::test.test');
