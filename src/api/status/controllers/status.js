'use strict';

/**
 * A set of functions called "actions" for `status`
 */

module.exports = {
    async status(ctx){
        return {
            data: {
                admin: true,
                api: true,
                database: true,
                integrations: true,
                support: true,
                documentation: true,
            }
        }
    }
};
