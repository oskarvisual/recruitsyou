const collection = "disqualify";

module.exports = {
    async afterCreate(event) {
        const { result, params } = event;

        await strapi.service('api::log.log').create({
            data:{
                log: `Added ${collection}`,
                type: `add-${collection}`,
                data: result
            }
        });
    },
    async afterUpdate(event) {
        const { result, params } = event;

        await strapi.service('api::log.log').create({
            data:{
                log: `Updated ${collection}`,
                type: `update-${collection}`,
                data: result
            }
        });
    },
    async afterDelete(event) {
        const { result, params } = event;

        await strapi.service('api::log.log').create({
            data:{
                log: `Deleted ${collection}`,
                type: `delete-${collection}`,
                data: result
            }
        });
    },
};