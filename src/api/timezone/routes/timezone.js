'use strict';

/**
 * timezone router
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

module.exports = createCoreRouter('api::timezone.timezone');
