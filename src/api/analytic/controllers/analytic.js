'use strict';

/**
 * analytic controller
 */

//TODO: TERMINAR CONTROLADOR PARA REPORTE
const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::analytic.analytic', ({ strapi }) => ({
    async report(ctx){
    }
}));