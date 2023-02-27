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
        
        if(
            customer.address == null || 
            customer.name == null || 
            customer.email == null || 
            customer.phone == null
        ){
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
        
        if(
            customer.address == null || 
            customer.name == null || 
            customer.email == null || 
            customer.phone == null
        ){
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
        
        if(
            customer.address == null || 
            customer.name == null || 
            customer.email == null || 
            customer.phone == null
        ){
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
        
        if(
            customer.address == null || 
            customer.name == null || 
            customer.email == null || 
            customer.phone == null
        ){
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
        
        if(
            customer.address == null || 
            customer.name == null || 
            customer.email == null || 
            customer.phone == null
        ){
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
    async webhook(ctx){
        const data = ctx.request.body;
        const headers = ctx.request.headers;

        const event = await strapi.service('api::stripe.stripe').checkSignature(ctx.request.body[unparsed], headers['stripe-signature']);
        
        if(event.type == 'invoice.paid'){
            const invoice = event.data.object;

            const customer = await strapi.service('api::stripe.stripe').findOneCustomer(invoice.customer);

            if(invoice.subscription != null){
                const subscription = await strapi.service('api::stripe.stripe').findOneSubscription(invoice.subscription);

                if(subscription.status != "active"){
                    return ctx.badRequest('Subscription is not active', {});
                }

                const plans = await strapi.entityService.findMany('api::plan.plan', {
                    filters: {
                        productAPI: subscription.plan.product,
                    },
                });
        
                if(plans.length == 0){
                    return ctx.notFound('Plan no exist', {
                        errors: [
                            {
                                path: ['plan'],
                                message: "These attributes were not found",
                                name: "ValidationError"
                            }
                        ]
                    });
                }
    
                const dueDate = moment.unix(subscription.current_period_end).format('YYYY-MM-DD');

                const companies = await strapi.entityService.findMany('api::company.company', {
                    fields: [
                        'id', 
                        'company',
                        'dueDate',
                        'demo',
                        'customerID'
                    ],
                    filters: {
                        customerID: invoice.customer,
                    },
                    publicationState: 'live',
                    populate: { 
                        plan: true,
                        users: true,
                    },
                });

                if(companies.length > 0){
                    const company = companies[0];
    
                    await strapi.entityService.update('api::company.company', company.id, {
                        data: {
                            demo: 0,
                            dueDate: dueDate,
                            plan: plans[0].id,
                        },
                    });

                    if(customer.email != null){
                        await strapi.service('api::email.email').create({
                            data:{
                                from: process.env.SMTP_FROM,
                                replyTo: process.env.SMTP_FROM,
                                to: customer.email,
                                subject: `Invoice Payment Confirmation for ${process.env.ATS_NAME} Subscription`,
                                body: `<p>Dear ${customer.name},</p>
                            
                                <p>We are pleased to inform you that your invoice for ${process.env.ATS_NAME} has been successfully paid. Thank you for your prompt payment.</p>
                                
                                <p>Please find below the details of your invoice:</p>
                            
                                <table style="border-collapse: collapse; width: 50%;">
                                    <tr>
                                    <td style="border: 1px solid #ddd; padding: 5px;">Invoice Number:</td>
                                    <td style="border: 1px solid #ddd; padding: 5px;">${invoice.number}</td>
                                    </tr>
                                    <tr>
                                    <td style="border: 1px solid #ddd; padding: 5px;">Amount Paid:</td>
                                    <td style="border: 1px solid #ddd; padding: 5px;">${parseFloat(invoice.amount_paid / 100).toFixed(2).toString()}</td>
                                    </tr>
                                    <tr>
                                    <td style="border: 1px solid #ddd; padding: 5px;">Currency:</td>
                                    <td style="border: 1px solid #ddd; padding: 5px;">${invoice.currency}</td>
                                    </tr>
                                    <tr>
                                    <td style="border: 1px solid #ddd; padding: 5px;">Description:</td>
                                    <td style="border: 1px solid #ddd; padding: 5px;">${invoice.lines.data[0].description}</td>
                                    </tr>
                                </table>
                                
                                <p>We confirm that the payment has been received in full. You can now continue to enjoy uninterrupted access to all the features and benefits of our powerful software.</p>
                                
                                <p>You can download your invoice from your account on our platform.</p>
                                
                                <p>If you have any queries or concerns regarding this invoice or your subscription, please feel free to contact our customer support team.</p>
                                
                                <p>Thank you for choosing our services. We look forward to your continued patronage.</p>
    
                                <p>Best Regards,<br />${process.env.ATS_NAME} Team</p>`,
                                sent: 0,
                                sendDate: new Date(),
                            }
                        });
                    }

                    await strapi.service('api::log.log').create({
                        data:{
                            company: company.id,
                            log: `Paid invoice`,
                            type: "pay-invoice",
                            result: invoice,
                            params: {}
                        }
                    });
                }
            }
        }
        
        if(event.type == 'customer.subscription.deleted'){
            const subscription = event.data.object;

            const customer = await strapi.service('api::stripe.stripe').findOneCustomer(subscription.customer);

            if(customer.email != null){
                await strapi.service('api::email.email').create({
                    data:{
                        from: process.env.SMTP_FROM,
                        replyTo: process.env.SMTP_FROM,
                        to: customer.email,
                        subject: `Confirmation of Cancellation of ${process.env.ATS_NAME} Subscription`,
                        body: `<p>Dear ${customer.name},</p>
                        
                        <p>We are writing to confirm that your ${process.env.ATS_NAME} subscription has been successfully cancelled, as per your request.</p>

                        <p>Your account will not be downgraded until the end of your billing period.</p>

                        <p>If you have any further questions about the cancellation, please feel free to contact our customer support team. We'll be happy to assist you in any way we can.</p>

                        <p>Thank you for being a part of our community, and we hope to see you again in the future.</p>

                        <p>Best Regards,<br />${process.env.ATS_NAME} Team</p>`,
                        sent: 0,
                        sendDate: new Date(),
                    }
                });
            }
        }
        
        if(event.type == 'customer.subscription.paused'){
            const subscription = event.data.object;

            const customer = await strapi.service('api::stripe.stripe').findOneCustomer(subscription.customer);

            if(customer.email != null){
                await strapi.service('api::email.email').create({
                    data:{
                        from: process.env.SMTP_FROM,
                        replyTo: process.env.SMTP_FROM,
                        to: customer.email,
                        subject: `Confirmation of Pausing of ${process.env.ATS_NAME} Subscription`,
                        body: `<p>Dear ${customer.name},</p>
                        
                        <pWe are writing to confirm that your ${process.env.ATS_NAME} subscription has been successfully paused, as per your request.</p>

                        <p>During the pause period, you will not be charged and your account will not be downgraded until the end of your billing period.</p>

                        <p>If you have any further questions about the pause, please feel free to contact our customer support team. We'll be happy to assist you in any way we can.</p>
                        
                        <p>Thank you for being a part of our community, and we look forward to serving you in the future.</p>

                        <p>Best Regards,<br />${process.env.ATS_NAME} Team</p>`,
                        sent: 0,
                        sendDate: new Date(),
                    }
                });
            }
        }
        
        if(event.type == 'payment_intent.payment_failed'){
            const paymentIntent = event.data.object;

            const customer = await strapi.service('api::stripe.stripe').findOneCustomer(paymentIntent.customer);

            if(customer.email != null){
                await strapi.service('api::email.email').create({
                    data:{
                        from: process.env.SMTP_FROM,
                        replyTo: process.env.SMTP_FROM,
                        to: customer.email,
                        subject: `Action required for ${process.env.ATS_NAME} Subscription`,
                        body: `<p>Dear ${customer.name},</p>

                        <p>Your default payment method failed when we attempted to charge it for ${process.env.ATS_NAME} subscription on your account.</p>

                        <p>Please take the necessary steps to resolve the payment issue and ensure that your account is up-to-date.</p>
                        
                        <p>If you have any questions or concerns, please don't hesitate to contact our customer support team. We'll be happy to assist you in any way we can.</p>
                        
                        <p>Thank you for being a part of our community, and we look forward to serving you in the future.</p>
                        
                        <p>Best Regards,<br />${process.env.ATS_NAME} Team</p>`,
                        sent: 0,
                        sendDate: new Date(),
                    }
                });
            }
        }

        ctx.body = {
            data: event,
            meta: {}
        };
    },
};
