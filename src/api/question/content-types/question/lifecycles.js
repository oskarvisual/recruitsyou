const collection = "question";
//TODO: REPLICAR ESTO EN JOBS
module.exports = {
    async afterCreate(event) {
        const { result, params } = event;

        const questionnaire = await strapi.entityService.findMany('api::questionnaire.questionnaire', {
            id: params.data.questionnaire,
        });

        let parent = '';
        if(questionnaire.length > 0){
            parent = questionnaire[0].questionnaire;
        }
        
        await strapi.service('api::log.log').create({
            data:{
                log: `Added ${collection} in ${parent}`,
                type: `add-${collection}`,
                result: result,
                params: params,
            }
        });
    },
    async afterUpdate(event) {
        const { result, params } = event;

        await strapi.service('api::log.log').create({
            data:{
                log: `Updated ${collection}`,
                type: `update-${collection}`,
                result: result,
                params: params,
            }
        });
    },
    async afterDelete(event) {
        const { result, params } = event;

        await strapi.service('api::log.log').create({
            data:{
                log: `Deleted ${collection}`,
                type: `delete-${collection}`,
                result: result,
                params: params,
            }
        });
    },
};