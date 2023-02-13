'use strict';

/**
 * timezone controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::timezone.timezone');
