'use strict';

const { Configuration, OpenAIApi } = require("openai");
const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

const moment = require('moment');

const startToday =  moment(new Date(new Date().setUTCHours(0,0,0,0))).format();
const endToday =  moment(new Date(new Date().setUTCHours(23,59,59,999))).format();

/**
 * ai service
 */

module.exports = {
    async generateText(prompt) {  
        const user = await strapi.service('api::user.user').me();

        const ctx = strapi.requestContext.get();

        try{
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
                                $gte: startToday,
                            },
                        },
                        {
                            createdAt: {
                                $lte: endToday,
                            },
                        },
                    ],
                }
            });

            if(!user.company.plan.ai || aiGenerated >= user.company.plan.aiPerDay){
                throw new Error({
                    data: null,
                    error: {
                        name: "PlanLimitationError",
                        message: "Your plan does not allow you to perform this action",
                        details: {}
                    }
                });
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

            return result.data;
        } catch(err){
            ctx.send({
                data: null,
                ...err
            }, 500);
        }
    }
};
