const moment = require('moment');
const startToday =  moment(new Date(new Date().setUTCHours(0,0,0,0))).format();
const endToday =  moment(new Date(new Date().setUTCHours(23,59,59,999))).format();

//TODO: RECORDATORIO DE TASKS 
//TODO: VENCIMIENTO DE TASK
//TODO: ENVIAR AVISO DE GPDR
//TODO: PROBAR SI FUNCIONA
//TODO: SI SE SUSPENDE ENVIAR CORREO
module.exports = {
    '0 0 10 * * *': async ({ strapi }) => {
        try {
            const companies = await strapi.entityService.findMany('api::company.company', {
                fields: [
                    'id', 
                    'company',
                    'dueDate',
                    'customerID'
                ],
                filters: {
                    plan: { 
                        id: {
                            $gt: 1,    
                        }
                    },
                    dueDate: { 
                        $lt: moment(new Date()).format('YYYY-MM-DD'),
                    },
                },
                publicationState: 'live',
                populate: ['plan'],
            });

            if(companies.length > 0){
                for(let i = 0; i < companies.length; i++){
                    if(companies[i].plan.id == 1){
                        continue;
                    }

                    let subscriptions = await strapi.service('api::stripe.stripe').findSubscription(companies[i].customerID);

                    if(subscriptions.data.length == 0){
                        continue;
                    }

                    let subscription = await strapi.service('api::stripe.stripe').findOneSubscription(subscriptions.data[0].id);

                    if(subscription.status != "active"){
                        continue;
                    }
                    
                    let plans = await strapi.entityService.findMany('api::plan.plan', {
                        filters: {
                            productAPI: subscription.plan.product,
                        },
                    });
        
                    if(plans.length == 0){
                        continue;
                    }

                    let dueDate = moment.unix(subscription.current_period_end).format('YYYY-MM-DD');
        
                    await strapi.entityService.update('api::company.company', companies[i].id, {
                        data: {
                            dueDate: dueDate,
                            plan: plans[0].id,
                        },
                    });
                }
            }

        } catch(err){
            console.log(err);
        }
    },
    '0 0 11 * * *': async ({ strapi }) => {
        try {
            //TODO: Suspender bloquear todos los usuarios
            //TODO: Desactivar todos  los trabajos
            //TODO: Logica en jobs que no permita activar mas de uno si es free
            //TODO: Despublicar todas las paginas menos las basicas
            
            const companies = await strapi.entityService.findMany('api::company.company', {
                fields: [
                    'id', 
                    'company',
                    'dueDate',
                    'customerID'
                ],
                filters: {
                    plan: { 
                        id: {
                            $gt: 1,    
                        }
                    },
                    dueDate: { 
                        $lte: moment(new Date()).subtract(7, 'days').format('YYYY-MM-DD'),
                    },
                },
                publicationState: 'live',
                populate: ['plan'],
            });

            if(companies.length > 0){
                for(let i = 0; i < companies.length; i++){
                    if(companies[i].plan.id == 1){
                        continue;
                    }
                    
                    await strapi.entityService.update('api::company.company', companies[0].id, {
                        data: {
                            plan: 1,
                        },
                    });
                }
            }

        } catch(err){
            console.log(err);
        }
    },
    '0 * * * * *': async ({ strapi }) => {
        try {
            if(process.env.SMTP_SEND == "true"){

                const emails = await strapi.db.query('api::email.email').findMany({
                    where: {
                        $and: [
                            {
                                sent: 0,
                            },
                            {
                                publishedAt: { 
                                    $lt: new Date() 
                                },
                            },
                        ]
                    },
                    populate: ['company'],
                    sort: { publishedAt: 'ASC' },
                    offset: 0, 
                    limit: 25,
                });

                for (let i = 0; i < emails.length; i++) {

                    emails[i].company = await strapi.db.query('api::company.company').findOne({
                        select: [
                            'id',
                            'company',
                            'demo',
                        ],
                        where: { id: emails[i].company.id },
                        populate: { 
                            plan: true,
                        },
                    });

                    if (emails[i].company.unlimitedEmails === false) {

                        let emailSents = await strapi.db.query('api::email.email').count({
                            filters: {
                                $and: [
                                    {
                                        company: emails[i].company.id,
                                    },
                                    {
                                        sent: 1,
                                    },
                                    {
                                        createdAt: {
                                            $gte: startToday,
                                        },
                                    },
                                    {
                                        createdAt: {
                                            $lte: endToday,
                                        },
                                    },
                                ],
                            }
                        });

                        if(emailSents >= emails[i].company.emailsPerDay){
                            continue;
                        }
                    }

                    dataEmail = {
                        from: emails[i].from,
                        to: emails[i].to,
                        replyTo: emails[i].replyTo,
                        subject: emails[i].subject,
                        html: emails[i].body,
                    }
                        
                    let email = await strapi.plugins['email'].services.email.send(dataEmail);

                    if(email.accepted.length > 0){
                        await strapi.entityService.update('api::email.email', emails[i].id, {
                            data: {
                                sent: 1,
                            },
                        });

                        await strapi.service('api::log.log').create({
                            data:{
                                company: emails[i].company.id,
                                log: `Sent email`,
                                type: `send-email`,
                                data: dataEmail
                            }
                        });
                    }
                }
            }
        } catch(err){
            console.log(err);
        }
    },
  };