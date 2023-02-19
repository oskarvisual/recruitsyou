'use strict';

/**
 * A set of functions called "actions" for `billing`
 */

const moment = require('moment');

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
            
            if(
                customer.address == null || 
                customer.name == null || 
                customer.email == null || 
                customer.phone == null
            ){
                return ctx.send({
                    data: null,
                    error: {
                        name: 'ValidationError',
                        message: 'You must first update your billing contact information.',
                    }
                }, 400);
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

            const customer = await strapi.service('api::stripe.stripe').findOneCustomer(user.company.customerID);
            
            if(
                customer.address == null || 
                customer.name == null || 
                customer.email == null || 
                customer.phone == null
            ){
                return ctx.send({
                    data: null,
                    error: {
                        name: 'ValidationError',
                        message: 'You must first update your billing contact information.',
                    }
                }, 400);
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

            const customer = await strapi.service('api::stripe.stripe').findOneCustomer(user.company.customerID);
            
            if(
                customer.address == null || 
                customer.name == null || 
                customer.email == null || 
                customer.phone == null
            ){
                return ctx.send({
                    data: null,
                    error: {
                        name: 'ValidationError',
                        message: 'You must first update your billing contact information.',
                    }
                }, 400);
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
        } catch (err) {
            ctx.send({
                data: null,
                ...err,
            }, 500);
        }
    },
    async resumeSubscription(ctx){
        try { 
            const { id } = ctx.params;

            const user = await strapi.service('api::user.user').me();

            const customer = await strapi.service('api::stripe.stripe').findOneCustomer(user.company.customerID);
            
            if(
                customer.address == null || 
                customer.name == null || 
                customer.email == null || 
                customer.phone == null
            ){
                return ctx.send({
                    data: null,
                    error: {
                        name: 'ValidationError',
                        message: 'You must first update your billing contact information.',
                    }
                }, 400);
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

            const customer = await strapi.service('api::stripe.stripe').findOneCustomer(user.company.customerID);
            
            if(
                customer.address == null || 
                customer.name == null || 
                customer.email == null || 
                customer.phone == null
            ){
                return ctx.send({
                    data: null,
                    error: {
                        name: 'ValidationError',
                        message: 'You must first update your billing contact information.',
                    }
                }, 400);
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
    async webhook(ctx){
        try { 
            const data = ctx.request.body;
            
            const event = await strapi.service('api::stripe.stripe').findOneEvent(data.id);

            if(event.type == 'invoice.paid'){
                const invoice = await strapi.service('api::stripe.stripe').findOneInvoice(event.data.object.id);

                const subscription = await strapi.service('api::stripe.stripe').findOneSubscription(invoice.subscription);

                if(subscription.status != "active"){
                    return ctx.send({
                        data: null,
                        error: {
                            name: 'SubscriptionError',
                            message: 'Subscription is not active',
                            details: {}
                        }
                    }, 500);
                }

                const plans = await strapi.entityService.findMany('api::plan.plan', {
                    filters: {
                        productAPI: subscription.plan.product,
                    },
                });
        
                if(plans.length == 0){
                    return ctx.send({
                        data: null,
                        error: {
                            name: 'ValidationError',
                            message: 'PlanNoExist',
                            details: {}
                        }
                    }, 500);
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
                    populate: ['plan', 'users'],
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

                    if(process.env.SMTP_SEND == "true"){
                        let userData = false;
                        if(company.users.length > 0){
                            for(let o = 0; o < company.users.length; o++){
                                if(company.users[o].administrator){
                                    userData = company.users[o];
                                }
                            }
                        }

                        if(userData){
                            await strapi.plugins['email'].services.email.send({
                                from: process.env.SMTP_FROM,
                                to: userData.email,
                                subject: `Invoice Payment Confirmation for ${process.env.ATS_NAME} Subscription`,
                                html: `<p>Dear ${userData.firstName},</p>
                                
                                <p>We are pleased to inform you that your invoice for ${process.env.ATS_NAME} has been successfully paid. Thank you for your prompt payment.</p>
                                
                                <p>Please find below the details of your invoice:</p>
                            
                                <table style="border-collapse: collapse; width: 50%;">
                                    <tr>
                                    <td style="border: 1px solid #ddd; padding: 5px;">Invoice Number:</td>
                                    <td style="border: 1px solid #ddd; padding: 5px;">${invoice.number}</td>
                                    </tr>
                                    <tr>
                                    <td style="border: 1px solid #ddd; padding: 5px;">Amount Paid:</td>
                                    <td style="border: 1px solid #ddd; padding: 5px;">${invoice.amount_paid}</td>
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
                            });
                        }
                    }
                }
            }

            ctx.body = {
                data: event,
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
