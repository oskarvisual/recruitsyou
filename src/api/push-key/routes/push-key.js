'use strict';

/**
 * push-key router
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

module.exports = createCoreRouter('api::push-key.push-key');
