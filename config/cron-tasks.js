const moment = require('moment');
const startToday =  moment(new Date(new Date().setUTCHours(0,0,0,0))).format();
const endToday =  moment(new Date(new Date().setUTCHours(23,59,59,999))).format();

//TODO: RECORDATORIO DE TASKS 
//TODO: VENCIMIENTO DE TASK
//TODO: ENVIAR AVISO DE GPDR
//TODO: PROBAR SI FUNCIONA

//TODO: PARA DEMO Y NO DEMO CUANDO FINALIZA PLAN:
//TODO: Suspender bloquear todos los usuarios
//TODO: Desactivar todos  los trabajos
//TODO: Logica en jobs que no permita activar mas de uno si es free
//TODO: Despublicar todas las paginas menos las basicas
module.exports = {
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
    '0 0 10 * * *': async ({ strapi }) => {
        try {            
            const companies = await strapi.entityService.findMany('api::company.company', {
                fields: [
                    'id', 
                    'company',
                    'dueDate',
                    'demo',
                    'customerID'
                ],
                filters: {
                    plan: { 
                        id: {
                            $ne: process.env.ATS_FREE_PLAN,     
                        }
                    },
                    demo: 0,
                    dueDate: { 
                        $lte: moment(new Date()).subtract(7, 'days').format('YYYY-MM-DD'),
                    },
                },
                publicationState: 'live',
                populate: ['plan', 'users'],
            });

            if(companies.length > 0){
                for(let i = 0; i < companies.length; i++){
                    if(process.env.SMTP_SEND == "true"){
                        let userData = false;
                        if(companies[i].users.length > 0){
                            for(let o = 0; o < companies[i].users.length; o++){
                                if(companies[i].users[o].administrator){
                                    userData = companies[i].users[o];
                                }
                            }
                        }

                        if(userData){
                            await strapi.plugins['email'].services.email.send({
                                from: process.env.SMTP_FROM,
                                to: userData.email,
                                subject: `${process.env.ATS_NAME} downgrade to free plan due to non-payment`,
                                html: `<p>Dear ${userData.firstName},</p>
                                
                                <p>I hope this email finds you well. We are writing to inform you that your subscription to ${process.env.ATS_NAME} has been downgraded from its previous paid plan to the current Free plan due to unpaid or cancelled subscription.</p>
                                
                                <p>We understand that circumstances can change and that financial constraints can arise unexpectedly. However, it is important to note that our ATS is a premium service that requires a paid subscription to access its full features and functionality.</p>
                                
                                <p>While your account has been downgraded to the Free plan, you will still have access to basic features, such as free posting job openings and reviewing applications. However, some of the more advanced features, such as automated candidate communication, ai, unlimited jobs and users, custom actions, etc. will no longer be available to you.</p>
                                
                                <p>We understand that this may be inconvenient for your hiring needs, but we hope that you will continue to find value in the basic features offered by the Free plan.</p>
                                
                                <p>Thank you for your understanding and for being a valued customer of ${process.env.ATS_NAME}. Please do not hesitate to contact us if you have any questions or concerns.</p>

                                <p>Best Regards,<br />${process.env.ATS_NAME} Team</p>`,
                            });
                        }
                    }
                    
                    await strapi.entityService.update('api::company.company', companies[0].id, {
                        data: {
                            demo: 0,
                            plan: process.env.ATS_FREE_PLAN,
                        },
                    });
                }
            }

        } catch(err){
            console.log(err);
        }
    },
    '0 0 12 * * *': async ({ strapi }) => {
        try {
            const companies = await strapi.entityService.findMany('api::company.company', {
                fields: [
                    'id', 
                    'company',
                    'dueDate',
                    'demo',
                    'customerID'
                ],
                filters: {
                    plan: { 
                        id: {
                            $ne: process.env.ATS_FREE_PLAN,     
                        }
                    },
                    demo: 1,
                    dueDate: { 
                        $lte: moment(new Date()).format('YYYY-MM-DD'),
                    },
                },
                publicationState: 'live',
                populate: ['plan', 'users'],
            });

            if(companies.length > 0){
                for(let i = 0; i < companies.length; i++){
                    if(process.env.SMTP_SEND == "true"){
                        let userData = false;
                        if(companies[i].users.length > 0){
                            for(let o = 0; o < companies[i].users.length; o++){
                                if(companies[i].users[o].administrator){
                                    userData = companies[i].users[o];
                                }
                            }
                        }

                        if(userData){
                            await strapi.plugins['email'].services.email.send({
                                from: process.env.SMTP_FROM,
                                to: userData.email,
                                subject: `Your ${process.env.ATS_NAME} Demo Trial Has Ended`,
                                html: `<p>Dear ${userData.firstName},</p>
                                
                                <p>We hope this email finds you well. We wanted to remind you that your ${process.env.ATS_TRIAL_DAYS}-day demo trial of ${process.env.ATS_NAME} has come to an end. We hope you found the system valuable and informative for your recruitment needs.</p>
                                
                                <p>Now that your demo trial has ended, your account will be automatically downgraded to the Free plan. As a result, some of the advanced features of ${process.env.ATS_NAME}, such as automated candidate communication, ai, unlimited jobs and users, custom actions, etc. will no longer be available to you.</p>
                                
                                <p>However, you will still be able to use the basic features of the Free plan, including free posting job openings and reviewing applications. If you would like to continue using the advanced features of ${process.env.ATS_NAME}, you can upgrade your subscription at any time.</p>
                                
                                <p>We appreciate your interest in ${process.env.ATS_NAME} and hope that you will consider subscribing to our service. If you have any questions or concerns about your account, please do not hesitate to contact us.</p>
                                
                                <p>Best Regards,<br />${process.env.ATS_NAME} Team</p>`,
                            });
                        }
                    }
                    
                    await strapi.entityService.update('api::company.company', companies[0].id, {
                        data: {
                            demo: 0,
                            plan: process.env.ATS_FREE_PLAN,
                        },
                    });
                }
            }

        } catch(err){
            console.log(err);
        }
    },
  };