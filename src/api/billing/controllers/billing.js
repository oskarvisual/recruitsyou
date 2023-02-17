'use strict';

/**
 * A set of functions called "actions" for `billing`
 */

module.exports = {
    async getBilling(ctx){
        try{
            const user = await strapi.service('api::user.user').me();

            const customer = await strapi.service('api::stripe.stripe').findOneCustomer(user.company.customerID);

            ctx.body = {
                data: customer,
                meta: {}
            };
        } catch(err){
            ctx.send({
                data: null,
                ...err
            }, 500);
        }
    },
    async updateBilling(ctx){
        try{
            const user = await strapi.service('api::user.user').me();

            const data = ctx.request.body.data;
            
            const customer = await strapi.service('api::stripe.stripe').updateCustomer(user.company.customerID, {
                email: data.email,
                name: data.name,
                phone: data.phone,
                default_source: data.default_source,
                address:{
                    country: data.country,
                    state: data.state,
                    city: data.city,
                    postal_code: data.postal_code,
                    line1: data.line1,
                    line2: data.line2,
                },
            });

            await strapi.service('api::log.log').create({
                data:{
                    log: `Updated billing`,
                    type: "update-billing",
                    result: customer,
                    params: data
                }
            });

            ctx.body = {
                data: customer,
                meta: {}
            };
        } catch(err){
            ctx.send({
                data: null,
                ...err
            }, 500);
        }
    },
    async updateDefaultPaymentMethod(ctx){
        try{
            const user = await strapi.service('api::user.user').me();

            const data = ctx.request.body.data;
            
            const customer = await strapi.service('api::stripe.stripe').updateCustomer(user.company.customerID, {
                invoice_settings: {
                    default_payment_method: data.default_payment_method,
                }
            });

            await strapi.service('api::log.log').create({
                data:{
                    log: `Updated default payment method`,
                    type: "update-default-payment-method",
                    result: customer,
                    params: data
                }
            });

            ctx.body = {
                data: customer,
                meta: {}
            };
        } catch(err){
            ctx.send({
                data: null,
                ...err
            }, 500);
        }
    },
    async createPaymentMethod(ctx){
        try { 
            const user = await strapi.service('api::user.user').me();

            const data = ctx.request.body.data;

            const customer = await strapi.service('api::stripe.stripe').findOneCustomer(user.company.customerID);

            const paymentMethod = await strapi.service('api::stripe.stripe').createPaymentMethod(user.company.customerID, {
                type: data.type,
                card: data.card,
                billing_details: {
                    address: {
                        city: customer.address.city,
                        country: customer.address.country,
                        line1: customer.address.line1,
                        line2: customer.address.line2,
                        postal_code: customer.address.postal_code,
                        state: customer.address.state
                    },
                    email: customer.email,
                    name: customer.name,
                    phone: customer.phone
                }
            });

            await strapi.service('api::log.log').create({
                data:{
                    log: `Created payment method`,
                    type: "create-paymentmethod",
                    result: paymentMethod,
                    params: data
                }
            });

            ctx.body = {
                data: paymentMethod,
                meta: {}
            };

        } catch (err) {
            ctx.send({
                data: null,
                ...err,
            }, 500);
        }
    },
    async deletePaymentMethod(ctx){
        try { 
            const { id } = ctx.params;

            const user = await strapi.service('api::user.user').me();       

            const paymentMethod = await strapi.service('api::stripe.stripe').detachPaymentMethod(user.company.customerID, id);

            await strapi.service('api::log.log').create({
                data:{
                    log: `Deleted payment method`,
                    type: "delete-paymentmethod",
                    result: paymentMethod,
                    params: {}
                }
            });

            ctx.body = {
                data: paymentMethod,
                meta: {}
            };
        } catch (err) {
            ctx.send({
                data: null,
                ...err,
            }, 500);
        }
    },
    async findPaymentMethod(ctx){
        try { 
            const user = await strapi.service('api::user.user').me();

            const paymentMethods = await strapi.service('api::stripe.stripe').findPaymentMethod(user.company.customerID, 'card');

            ctx.body = {
                data: paymentMethods.data,
                meta: {
                    has_more: paymentMethods.has_more,
                }
            };
        } catch (err) {
            ctx.send({
                data: null,
                ...err,
            }, 500);
        }
    },
    async findOnePaymentMethod(ctx){
        try { 
            const { id } = ctx.params;

            const user = await strapi.service('api::user.user').me();
            
            const paymentMethod = await strapi.service('api::stripe.stripe').findOnePaymentMethod(user.company.customerID, id);

            ctx.body = {
                data: paymentMethod,
                meta: {}
            };
        } catch (err) {
            ctx.send({
                data: null,
                ...err,
            }, 500);
        }
    },
    async findSubscription(ctx){
        try { 
            const user = await strapi.service('api::user.user').me();

            const subscriptions = await strapi.service('api::stripe.stripe').findSubscription(user.company.customerID);

            ctx.body = {
                data: subscriptions.data,
                meta: {
                    has_more: subscriptions.has_more,
                }
            };
        } catch (err) {
            ctx.send({
                data: null,
                ...err,
            }, 500);
        }
    },
    async findOneSubscription(ctx){
        try { 
            const { id } = ctx.params;

            const user = await strapi.service('api::user.user').me();
            
            const subscription = await strapi.service('api::stripe.stripe').findOneSubscription(id);

            ctx.body = {
                data: subscription,
                meta: {}
            };
        } catch (err) {
            ctx.send({
                data: null,
                ...err,
            }, 500);
        }
    },
    async createSubscription(ctx){
        try { 
            const data = ctx.request.body.data;

            const user = await strapi.service('api::user.user').me();
            
            const subscription = await strapi.service('api::stripe.stripe').createSubscription(user.company.customerID, data.price_id);

            await strapi.service('api::log.log').create({
                data:{
                    log: `Deleted subscription`,
                    type: "delete-subscription",
                    result: subscription,
                    params: {}
                }
            });

            ctx.body = {
                data: subscription,
                meta: {}
            };
        } catch (err) {
            ctx.send({
                data: null,
                ...err,
            }, 500);
        }
    },
    async cancelSubscription(ctx){
        try { 
            const { id } = ctx.params;

            const user = await strapi.service('api::user.user').me();
            
            const subscription = await strapi.service('api::stripe.stripe').createSubscription(id);

            await strapi.service('api::log.log').create({
                data:{
                    log: `Canceled subscription`,
                    type: "cancel-subscription",
                    result: subscription,
                    params: {}
                }
            });

            ctx.body = {
                data: subscription,
                meta: {}
            };
        } catch (err) {
            ctx.send({
                data: null,
                ...err,
            }, 500);
        }
    },
    async findInvoice(ctx){
        try { 
            const user = await strapi.service('api::user.user').me();

            const invoices = await strapi.service('api::stripe.stripe').findInvoice(user.company.customerID);

            ctx.body = {
                data: invoices.data,
                meta: {
                    has_more: invoices.has_more,
                }
            };
        } catch (err) {
            ctx.send({
                data: null,
                ...err,
            }, 500);
        }
    },
    async findOneInvoice(ctx){
        try { 
            const { id } = ctx.params;

            const user = await strapi.service('api::user.user').me();
            
            const invoice = await strapi.service('api::stripe.stripe').findOneInvoice(id);

            ctx.body = {
                data: invoice,
                meta: {}
            };
        } catch (err) {
            ctx.send({
                data: null,
                ...err,
            }, 500);
        }
    },
};
