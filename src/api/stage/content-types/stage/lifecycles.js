const collection = "stage";
//TODO: REPLICAR ESTO EN JOBS
module.exports = {
    async afterCreate(event) {
        const { result, params } = event;

        const pipeline = await strapi.entityService.findMany('api::pipeline.pipeline', {
            id: params.data.pipeline,
        });

        let parent = '';
        if(pipeline.length > 0){
            parent = pipeline[0].pipeline;
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