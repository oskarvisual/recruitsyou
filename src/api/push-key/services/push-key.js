'use strict';

/**
 * token-push service
 */

const webpush = require('web-push');

const { createCoreService } = require('@strapi/strapi').factories;
const api = 'api::push-key.push-key';
//TODO: CREAR SERVICE WORKER Y PROBAR
module.exports = createCoreService(api, ({ strapi }) => ({
    async create(params) {
        const user = await strapi.service('api::user.user').me();

        /*webpush.setVapidDetails(
            `mailto:${process.env.SMTP_FROM}`,
            process.env.PUBLIC_VAPID_KEY,
            process.env.PRIVATE_VAPID_KEY,
        );*/
        
        params.data.user = user.id;
        
        const response = await super.create(params);

        return response;
    },
    async register(params) {

        return true;
    },
}));