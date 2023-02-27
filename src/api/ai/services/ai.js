'use strict';

const { Configuration, OpenAIApi } = require("openai");
const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

const moment = require('moment');

const startToday =  moment(new Date()).startOf('day').format('YYYY-MM-DD HH:mm:ss');
const endToday =  moment(new Date()).endOf('day').format('YYYY-MM-DD HH:mm:ss');

/**
 * ai service
 */

module.exports = {
    async generateText(prompt) {  
        const ctx = strapi.requestContext.get();

        const user = await strapi.service('api::user.user').me();

        const aiGenerated = await strapi.db.query('api::log.log').count({
            filters: {
                $and: [
                    {
                        company: user.company.id,
                    },
                    {
                        type: 'generate-ai',
                    },
                    {
                        createdAt: {
                            $between: [startToday, endToday]
                        },
                    },
                ],
            }
        });

        if(!user.company.plan.ai || aiGenerated >= user.company.plan.aiPerDay){
            return ctx.forbidden('Your plan does not allow you to perform this action', {});
        }
        
        const result = await openai.createCompletion({
            model: process.env.OPENAI_API_MODEL,
            prompt: prompt,
            max_tokens: parseInt(process.env.OPENAI_API_MAX_TOKENS),
            temperature: parseFloat(process.env.OPENAI_API_TEMPERATURE),
        });

        await strapi.service('api::log.log').create({
            data:{
                log: `Generated AI text`,
                type: 'generate-ai',
                result: result.data,
                params: {
                    prompt: prompt
                },
            }
        });


        return {
            data: result.data.choices,
            meta: {}
        };
    }
};
