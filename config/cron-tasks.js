const moment = require('moment');
const startToday =  moment(new Date(new Date().setUTCHours(0,0,0,0))).format();
const endToday =  moment(new Date(new Date().setUTCHours(23,59,59,999))).format();

//TODO: FALTA LOGICA PARA SUSPENDER CUENTA SIN PAGO
//TODO: FALTA LOGICA PARA ACTUALIZAR FECHA DE VENCIMIENTO SI PAGO
//TODO: FALTA CORREOS PERIDICOS CADA RECORDATIRIOS CADA X DIAS DESDE EL REGISTRO
//TODO: RECORDATORIO DE TASKS 
//TODO: VENCIMIENTO DE TASK
//TODO: ENVIAR AVISO DE GPDR
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
                                publishedAt: { $lt: new Date() },
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