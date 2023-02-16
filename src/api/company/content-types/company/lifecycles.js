module.exports = {
    async afterUpdate(event) {
        const { result, params } = event;

        await strapi.service('api::log.log').create({
            data:{
                log: `Updated company settings`,
                type: "update-company",
                result: result,
                params: params,
            }
        });
    },
  };