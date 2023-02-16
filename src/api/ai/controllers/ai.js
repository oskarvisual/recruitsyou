'use strict';

/**
 * A set of functions called "actions" for `ai`
 */

module.exports = {
    async generate(ctx){
        try {
            const user = await strapi.service('api::user.user').me();
            const data = ctx.request.body.data;

            const text = await strapi.service('api::ai.ai').generateText(data.prompt);

            ctx.body = {
                data: text,
                meta: {}
            };
            
        } catch (err) {
            ctx.send({
                data: null,
                ...err,
            }, 500);
        }
    },
};
