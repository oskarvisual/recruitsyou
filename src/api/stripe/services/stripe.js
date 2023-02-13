'use strict';

/**
 * stripe service
 */

const stripe = require('stripe');

const Stripe = stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2020-08-27'
});

module.exports = {
    async createCustomer(companyId, email){
        const customer = await Stripe.customers.create({
            email,
            description: `ID: ${companyId}`,
        }); 

        return customer;
    },
    async findOneCustomer(id){
        const customer = await Stripe.customers.retrieve(id)

        return customer;
    },
}