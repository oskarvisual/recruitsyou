'use strict';

/**
 * stripe service
 */
//TODO: FALTAN WEBHOOKS DESDE STRIPE
const stripe = require('stripe');

const Stripe = stripe(process.env.STRIPE_SECRET_KEY);

const moment = require('moment');

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
        const user = await strapi.service('api::user.user').me();

        let subscription = {};

        const subscriptions = await strapi.service('api::stripe.stripe').findSubscription(customerId);
        if(subscriptions.data.length == 0){
            subscription = await Stripe.subscriptions.create({
                customer: customerId,
                items: [
                    {
                        price: priceId
                    },
                ],
            });
        }else{
            subscription = await Stripe.subscriptions.update(
                subscriptions.data[0].id,
                {
                    items: [
                        {
                            price: priceId 
                        },
                    ],
                }
            );

            const deleted = await Stripe.subscriptionItems.del(
                subscriptions.data[0].items.data[0].id
            );

            subscription = await strapi.service('api::stripe.stripe').findOneSubscription(subscriptions.data[0].id);
        }

        if(subscription.status == "active"){
            const plans = await strapi.entityService.findMany('api::plan.plan', {
                filters: {
                    productAPI: subscription.plan.product,
                },
            });

            if(plans.length > 0){
                const dueDate = moment.unix(subscription.current_period_end).format('YYYY-MM-DD');
    
                await strapi.entityService.update('api::company.company', user.company.id, {
                    data: {
                        dueDate: dueDate,
                        plan: plans[0].id,
                    },
                });
            }
        }
        
        return subscription;
    },
    async resumeSubscription(subscriptionId){
        let subscription = await Stripe.subscriptions.resume(
            subscriptionId,
            {
                billing_cycle_anchor: 'now'
            }
        );

        subscription = await strapi.service('api::stripe.stripe').findOneSubscription(subscriptionId);
        
        if(subscription.status == "active"){
            const plans = await strapi.entityService.findMany('api::plan.plan', {
                filters: {
                    productAPI: subscription.plan.product,
                },
            });

            if(plans.length > 0){
                const dueDate = moment.unix(subscription.current_period_end).format('YYYY-MM-DD');
    
                await strapi.entityService.update('api::company.company', user.company.id, {
                    data: {
                        dueDate: dueDate,
                        plan: plans[0].id,
                    },
                });
            }
        }
        
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
