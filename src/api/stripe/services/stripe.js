'use strict';

/**
 * stripe service
 */

const stripe = require('stripe');

const Stripe = stripe(process.env.STRIPE_SECRET_KEY);

const moment = require('moment');

module.exports = {
    async checkSignature(data, sig){
        const event = await Stripe.webhooks.constructEvent(data, sig, process.env.STRIPE_SECRET_SIGNING);

        return event;
    },
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
        const paymentMethods = await strapi.service('api::stripe.stripe').findPaymentMethod(customerId, 'card');
        
        const paymentMethod = await Stripe.paymentMethods.create(params);

        const customerPaymentMethod = await Stripe.paymentMethods.attach(
            paymentMethod.id,
            {customer: customerId}
        );

        if(paymentMethods.data.length == 0){
            const customer = await strapi.service('api::stripe.stripe').updateCustomer(customerId, {
                invoice_settings: {
                    default_payment_method: paymentMethod.id,
                }
            });
        }

        return customerPaymentMethod;
    },
    async detachPaymentMethod(customerId, id){
        
        const paymentMethod = await strapi.service('api::stripe.stripe').findOnePaymentMethod(customerId, id);

        const detachPaymentMethod = await Stripe.paymentMethods.detach(paymentMethod.id);

        return detachPaymentMethod;
    },
    async findPaymentMethod(customerId, type, query = {}){
        let filters = { type: type }

        if(query.starting_after){
            filters.starting_after = query.starting_after;
        }
        
        const customer = await strapi.service('api::stripe.stripe').findOneCustomer(customerId);

        const paymentMethods = await Stripe.customers.listPaymentMethods(
            customerId,
            filters,
        );

        if(paymentMethods.data.length > 0){
            for(let i = 0; i < paymentMethods.data.length; i++){
                paymentMethods.data[i].default = false;

                if(customer.invoice_settings){
                    if(paymentMethods.data[i].id == customer.invoice_settings.default_payment_method){
                        paymentMethods.data[i].default = true;
                    }
                }
            }
        }

        return paymentMethods;
    },
    async findOnePaymentMethod(customerId, id){
        const customer = await strapi.service('api::stripe.stripe').findOneCustomer(customerId);

        const paymentMethod = await Stripe.customers.retrievePaymentMethod(customerId, id);

        paymentMethod.default = false;

        if(customer.invoice_settings){
            if(paymentMethod.id == customer.invoice_settings.default_payment_method){
                paymentMethod.default = true;
            }
        }
        
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
        
        return subscription;
    },
    async resumeSubscription(subscriptionId){
        const subscription = await Stripe.subscriptions.resume(
            subscriptionId,
            {
                billing_cycle_anchor: 'now'
            }
        );
        
        return subscription;
    },
    async findSubscription(customerId, query = {}){
        let filters = {}

        if(query.starting_after){
            filters.starting_after = query.starting_after;
        }

        const subscriptions = await Stripe.subscriptions.list({
            customer: customerId,
            ...filters,
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
    async findInvoice(customerId, query = {}){
        let filters = {}

        if(query.starting_after){
            filters.starting_after = query.starting_after;
        }

        const invoices = await Stripe.invoices.list({
            customer: customerId,
            ...filters,
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
    async findOneEvent(/* The event id that is sent from Stripe. */
    eventId){
        const event = await Stripe.events.retrieve(eventId);
        
        return event;
    },
}