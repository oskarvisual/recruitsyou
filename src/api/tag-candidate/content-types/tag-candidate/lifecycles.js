const collection = "tag-candidate";

module.exports = {
    async afterCreate(event) {
        const { result, params } = event;

        await strapi.service('api::log.log').create({
            data:{
                log: `Added ${collection}`,
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