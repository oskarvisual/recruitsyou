'use strict';

/**
 * timezone service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::timezone.timezone');
