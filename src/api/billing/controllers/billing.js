'use strict';

/**
 * A set of functions called "actions" for `billing`
 */

const moment = require('moment');
const unparsed = require("koa-body/unparsed.js");

module.exports = {
    async getBilling(ctx){
        const user = await strapi.service('api::user.user').me();

        const customer = await strapi.service('api::stripe.stripe').findOneCustomer(user.company.customerID);

        ctx.body = {
            data: customer,
            meta: {}
        };
    },
    async updateBilling(ctx){
        const user = await strapi.service('api::user.user').me();

        const data = ctx.request.body.data;
        
        const customer = await strapi.service('api::stripe.stripe').updateCustomer(user.company.customerID, {
            email: data.email,
            name: data.name,
            phone: data.phone,
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
                log: `Updated billing details`,
                type: "update-billing",
                result: customer,
                params: data
            }
        });

        ctx.body = {
            data: customer,
            meta: {}
        };
    },
    async updateDefaultPaymentMethod(ctx){
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
    },
    async createPaymentMethod(ctx){
        const user = await strapi.service('api::user.user').me();

        const data = ctx.request.body.data;

        const customer = await strapi.service('api::stripe.stripe').findOneCustomer(user.company.customerID);
        
        if(!customer.address || !customer.name || !customer.email || !customer.phone){
            return ctx.badRequest('You must first update your billing contact information', {});
        }

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
    },
    async deletePaymentMethod(ctx){
        const { id } = ctx.params;

        const user = await strapi.service('api::user.user').me();       

        const customer = await strapi.service('api::stripe.stripe').findOneCustomer(user.company.customerID);
        
        if(!customer.address || !customer.name || !customer.email || !customer.phone){
            return ctx.badRequest('You must first update your billing contact information', {});
        }

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
    },
    async findPaymentMethod(ctx){
        const user = await strapi.service('api::user.user').me();
        const query = ctx.request.query;
        
        const paymentMethods = await strapi.service('api::stripe.stripe').findPaymentMethod(user.company.customerID, 'card', query);

        ctx.body = {
            data: paymentMethods.data,
            meta: {
                has_more: paymentMethods.has_more,
            }
        };
    },
    async findOnePaymentMethod(ctx){
        const { id } = ctx.params;

        const user = await strapi.service('api::user.user').me();
        
        const paymentMethod = await strapi.service('api::stripe.stripe').findOnePaymentMethod(user.company.customerID, id);

        ctx.body = {
            data: paymentMethod,
            meta: {}
        };
    },
    async findSubscription(ctx){
        const user = await strapi.service('api::user.user').me();
        const query = ctx.request.query;

        const subscriptions = await strapi.service('api::stripe.stripe').findSubscription(user.company.customerID, query);

        ctx.body = {
            data: subscriptions.data,
            meta: {
                has_more: subscriptions.has_more,
            }
        };
    },
    async findOneSubscription(ctx){
        const { id } = ctx.params;

        const user = await strapi.service('api::user.user').me();
        
        const subscription = await strapi.service('api::stripe.stripe').findOneSubscription(id);

        ctx.body = {
            data: subscription,
            meta: {}
        };
    },
    async createSubscription(ctx){
        const data = ctx.request.body.data;

        const user = await strapi.service('api::user.user').me();

        const customer = await strapi.service('api::stripe.stripe').findOneCustomer(user.company.customerID);
        
        if(!customer.address || !customer.name || !customer.email || !customer.phone){
            return ctx.badRequest('You must first update your billing contact information', {});
        }
        
        const subscription = await strapi.service('api::stripe.stripe').createSubscription(user.company.customerID, data.price_id);

        await strapi.service('api::log.log').create({
            data:{
                log: `Created subscription`,
                type: "create-subscription",
                result: subscription,
                params: {}
            }
        });

        ctx.body = {
            data: subscription,
            meta: {}
        };
    },
    async resumeSubscription(ctx){
        const { id } = ctx.params;

        const user = await strapi.service('api::user.user').me();

        const customer = await strapi.service('api::stripe.stripe').findOneCustomer(user.company.customerID);
        
        if(!customer.address || !customer.name || !customer.email || !customer.phone){
            return ctx.badRequest('You must first update your billing contact information', {});
        }
        
        const subscription = await strapi.service('api::stripe.stripe').resumeSubscription(id);

        await strapi.service('api::log.log').create({
            data:{
                log: `Resumed subscription`,
                type: "resume-subscription",
                result: subscription,
                params: {}
            }
        });

        ctx.body = {
            data: subscription,
            meta: {}
        };
    },
    async cancelSubscription(ctx){
        const { id } = ctx.params;

        const user = await strapi.service('api::user.user').me();

        const customer = await strapi.service('api::stripe.stripe').findOneCustomer(user.company.customerID);
        
        if(!customer.address || !customer.name || !customer.email || !customer.phone){
            return ctx.badRequest('You must first update your billing contact information', {});
        }
        
        const subscription = await strapi.service('api::stripe.stripe').cancelSubscription(id);

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
    },
    async findInvoice(ctx){
        const user = await strapi.service('api::user.user').me();
        const query = ctx.request.query;

        const invoices = await strapi.service('api::stripe.stripe').findInvoice(user.company.customerID, query);

        ctx.body = {
            data: invoices.data,
            meta: {
                has_more: invoices.has_more,
            }
        };
    },
    async findOneInvoice(ctx){
        const { id } = ctx.params;

        const user = await strapi.service('api::user.user').me();
        
        const invoice = await strapi.service('api::stripe.stripe').findOneInvoice(id);

        ctx.body = {
            data: invoice,
            meta: {}
        };
    },
};
