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
            description: `CompanyID: ${companyId}`,
        }); 

        return customer;
    },
    async findOneCustomer(customerId){
        const customer = await Stripe.customers.retrieve(customerId);

        return customer;
    },
    async updateCustomer(customerId, params){
        const customer = await Stripe.customers.update(customerId, params);

        return customer;
    },
    async createPaymentMethod(customerId, params){
        const paymentMethod = await Stripe.paymentMethods.create(params);

        const customerPaymentMethod = await Stripe.paymentMethods.attach(
            paymentMethod.id,
            {customer: customerId}
        );

        return customerPaymentMethod;
    },
    async detachPaymentMethod(customerId, id){
        
        const paymentMethod = await strapi.service('api::stripe.stripe').findOnePaymentMethod(customerId, id);

        const detachPaymentMethod = await Stripe.paymentMethods.detach(paymentMethod.id);

        return detachPaymentMethod;
    },
    async findPaymentMethod(customerId, type){
        const paymentMethod = await Stripe.customers.listPaymentMethods(
            customerId,
            {type: type},
        );

        return paymentMethod;
    },
    async findOnePaymentMethod(customerId, id){
        const paymentMethod = await Stripe.customers.retrievePaymentMethod(customerId, id);
        
        return paymentMethod;
    },
    async createSubscription(customerId, priceId){
        const subscription = await Stripe.subscriptions.create({
            customer: customerId,
            items: [
                { price: priceId },
            ],
        });
        
        return subscription;
    },
    async findSubscription(customerId){
        const subscriptions = await Stripe.subscriptions.list({
            customer: customerId,
        });
        
        return subscriptions;
    },
    async findOneSubscription(subscriptionId){
        const subscription = await Stripe.subscriptions.retrieve(subscriptionId);
        
        return subscription;
    },
    async cancelSubscription(subscriptionId){
        const subscription = await Stripe.subscriptions.del(subscriptionId);
        
        return subscription;
    },
    async findInvoice(customerId){
        const invoices = await Stripe.invoices.list({
            customer: customerId,
        });
        
        return invoices;
    },
    async findOneInvoice(invoceId){
        const invoce = await Stripe.invoices.retrieve(invoceId);
        
        return invoce;
    },
    async findOnePrice(priceId){
        const price = await Stripe.prices.retrieve(priceId);
        
        return price;
    },
}
