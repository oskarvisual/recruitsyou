'use strict';

/**
 * analytic service
 */

const ip = require('ip');
const geoip = require('geoip-lite');

const { createCoreService } = require('@strapi/strapi').factories;
const api = 'api::analytic.analytic';

module.exports = createCoreService(api, ({ strapi }) => ({
    //TODO: AGREGAR FILTROS (POR FECHA, PAIS, MAS BUSCADOS, ETC)
    async find(params) {
        const user = await strapi.service('api::user.user').me();

        let hostname = user.company.domain;

        if(user.company.subdomain){
            hostname = `${user.company.domain}.${process.env.ATS_DOMAIN}`;
        }

        params.filters = { hostname: hostname, }
        params.populate = {}

        const result = await super.find(params);
        
        return result;
    },
    async findOne(entityId, params = {}) {
        const user = await strapi.service('api::user.user').me();

        let hostname = user.company.domain;

        if(user.company.subdomain){
            hostname = `${user.company.domain}.${process.env.ATS_DOMAIN}`;
        }

        params.filters = {
            $and: [
                {
                    hostname: hostname,
                },
                {
                    id: entityId,
                },
            ],
        }
        params.populate = {}

        const result = await strapi.entityService.findMany(api, params);
        if(result.length == 0){ return null; }
    
        return result[0];
    },
    async create(params) {
        const ctx = strapi.requestContext.get();
        const headers = ctx.request.headers;

        const userIp = ip.address();
        const userGeo = geoip.lookup(userIp);

        try {
            const url = new URL(params.data.url);
            
            params.data.protocol = url.protocol;
            params.data.hostname = url.hostname;
            params.data.port = url.port;
            params.data.pathname = url.pathname;
            params.data.search = url.search;
            params.data.userAgent = headers['user-agent'];
            params.data.ip = userIp;
            params.data.timezone = (userGeo) ? userGeo.timezone : null;
            params.data.country = (userGeo) ? userGeo.country : null;
            params.data.region = (userGeo) ? userGeo.region : null;
            params.data.city = (userGeo) ? userGeo.city : null;
            
            const response = await super.create(params);
    
            return response;
         
        } catch (err) {
            return ctx.badRequest(err, {});
        }
    },
}));