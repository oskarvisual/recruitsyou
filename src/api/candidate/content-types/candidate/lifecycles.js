const collection = "candidate";

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

        const jobCandidates = await strapi.db.query('api::job-candidate.job-candidate').findMany({
            fields: ['id'],
            filters: {
                candidate: result.id,
            },
        });

        if(jobCandidates.length > 0){
            const jobCandidateIds = [];
            for(let i = 0; i < jobCandidates.length; i++){
                jobCandidateIds.push(jobCandidates[i].id);
            }
    
            await strapi.db.query('api::job-candidate.job-candidate').deleteMany({
                where: {
                    id: {
                        $in: jobCandidateIds,
                    },
                },
            });
            
        }

        const fileCandidates = await strapi.db.query('api::candidate-file.candidate-file').findMany({
            fields: ['id'],
            filters: {
                candidate: result.id,
            },
        });

        if(fileCandidates.length > 0){
            const fileCandidateIds = [];
            for(let i = 0; i < fileCandidates.length; i++){
                fileCandidateIds.push(fileCandidates[i].id);
            }
    
            await strapi.db.query('api::candidate-file.candidate-file').deleteMany({
                where: {
                    id: {
                        $in: fileCandidateIds,
                    },
                },
            });
            
        }

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