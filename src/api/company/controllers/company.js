'use strict';

/**
 * company controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

var CompanyEmailValidator = require("company-email-validator");

const { faker } = require('@faker-js/faker');
const { v4: uuidv4 } = require('uuid');
const { nanoid } = require("nanoid");

const moment = require('moment');

const ip = require('ip');
const geoip = require('geoip-lite');

//TODO: TODO DEBE TENER SU POPULATE INCLUIDO EN LA CONSULTA PARA NO PONERLO EN LA URL
//TODO: FALTA CREAR PLANTILLA DE PAGINAS CON (publishedAt: new Date())
//TODO: FALTA MODIFICAR PLANTILLA DE CORREOS CON VARIABLES REALES
module.exports = createCoreController('api::company.company', ({ strapi }) => ({
    async create(ctx){
        let user = await strapi.service('api::user.user').me();

        const data = await this.sanitizeInput(ctx.request.body.data);

        const password = nanoid();

        let dueDate = moment(new Date()).format('YYYY-MM-DD'); 
        
        let demo = 0;
        let plan = process.env.ATS_FREE_PLAN;

        if(!user){
            demo = 1;
            plan = process.env.ATS_PRO_PLAN;

            dueDate = moment(new Date()).add(process.env.ATS_TRIAL_DAYS, 'days').format('YYYY-MM-DD');        

            const userIp = ip.address();
            const userGeo = geoip.lookup(userIp);

            if(!CompanyEmailValidator.isCompanyEmail(data.email)){
                return ctx.badRequest('Only business emails are allowed', {});
            }

            if(!data.company){
                return ctx.badRequest('company must be defined', { 
                    errors: [
                        {
                            path: ['company'],
                            message: 'company must be defined',
                            name: 'ValidationError'
                        }
                    ]
                });
            }

            if(!data.email){
                return ctx.badRequest('email must be defined', { 
                    errors: [
                        {
                            path: ['email'],
                            message: 'email must be defined',
                            name: 'ValidationError'
                        }
                    ]
                });
            }

            const checkUser = await strapi.db.query('plugin::users-permissions.user').count({ 
                filters: {
                    $or: [
                        { username: data.email },
                        { email: data.email },
                    ]
                }
            });

            if(checkUser > 0){
                return ctx.badRequest('The email or username is already registered in the system', {});
            }

            const domainEmail = data.email.split('@').pop();
    
            const checkEmailExist = await strapi.db.query('plugin::users-permissions.user').count({ filters: { 
                email: {
                    $endsWith: '@' + domainEmail,
                }
            }});
            if(checkEmailExist > 0){
                return ctx.badRequest('An email is already registered with that domain', {});
            }

            user = await strapi.entityService.create('plugin::users-permissions.user',{
                data: {
                    username: data.email,
                    email: data.email,
                    provider: 'local',
                    password: password,
                    role: process.env.ATS_SUPERADMINISTRATOR_ROLE,
                    firstName: data.firstName,
                    lastName: data.lastName,
                    confirmed: 1,
                    timezone: (userGeo) ? userGeo.timezone : null,
                }
            });
            delete user.password;
            delete user.resetPasswordToken;
            delete user.confirmationToken;

            user.new = true;
        }else{
            if(user.role.id != process.env.ATS_SUPERADMINISTRATOR_ROLE){ 
                return ctx.forbidden('Your user role does not allow you to perform this action', {});
            }

            if(user.companies.length >= 5){ 
                return ctx.forbidden('You exceeded the limit of companies', {});
            }

            if(user.company.plan.id == process.env.ATS_FREE_PLAN){ 
                return ctx.forbidden('Your plan does not allow you to perform this action', {});
            }
            user.new = false;
        }

        let domain = data.company.toString()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w-]+/g, '')
        .replace(/--+/g, '-') + user.id;

        const company = await strapi.entityService.create('api::company.company', {
            data: {
                company: data.company,
                domain: domain,
                subdomain: 1,
                demo: demo,
                dueDate: dueDate,
                colorPrimary: process.env.COLOR_PRIMARY,
                colorSecundary: process.env.COLOR_SECUNDARY,
                colorAccent: process.env.COLOR_ACCENT,
                navBackground: process.env.NAV_BACKGROUND,
                navColor: process.env.NAV_COLOR,
                navColorHover: process.env.NAV_COLOR_HOVER,
                plan: plan,
                users: user.id,
                publishedAt: new Date(),
            }
        });

        if(user.new){
            user.password = password;
            
            await strapi.service('api::log.log').create({
                data:{
                    company: company.id,
                    log: `Registered user`,
                    type: "register-user",
                    result: user,
                    params: {}
                }
            });
        }

        await strapi.service('api::log.log').create({
            data:{
                company: company.id,
                log: `Registered company`,
                type: "register-company",
                result: company,
                params: {}
            }
        });

        await strapi.service('api::n8n.n8n').webhook(process.env.N8N_SETUP_URL, {
            data: {
                company: company,
                user: user,
            }
        });

        return {
            data: company,
            meta: {}
        };
    },
    async setup(ctx){
        const data = await this.sanitizeInput(ctx.request.body.data);

        await strapi.entityService.update('api::company.company', data.company.id, {
            data: {
                customerID: data.company.customerID,
            },
        });

        const pipeline = await strapi.entityService.create('api::pipeline.pipeline',{
            data: {
                company: data.company.id,
                pipeline: 'Default',
                default: 1,
            }
        });

        await strapi.entityService.create('api::stage.stage',{
            data: {
                company: data.company.id,
                pipeline: pipeline.id,
                stage: 'Sourced',
                type: 'sourced',
                order: 0,
            }
        });

        await strapi.entityService.create('api::stage.stage',{
            data: {
                company: data.company.id,
                pipeline: pipeline.id,
                stage: 'Apply',
                type: 'apply',
                order: 1,
            }
        });

        await strapi.entityService.create('api::stage.stage',{
            data: {
                company: data.company.id,
                pipeline: pipeline.id,
                stage: 'Interview',
                type: 'interview',
                order: 2,
            }
        });

        await strapi.entityService.create('api::stage.stage',{
            data: {
                company: data.company.id,
                pipeline: pipeline.id,
                stage: 'Assessment',
                type: 'assessment',
                order: 3,
            }
        });

        await strapi.entityService.create('api::stage.stage',{
            data: {
                company: data.company.id,
                pipeline: pipeline.id,
                stage: 'Offer',
                type: 'offer',
                order: 4,
            }
        });

        await strapi.entityService.create('api::stage.stage',{
            data: {
                company: data.company.id,
                pipeline: pipeline.id,
                stage: 'Hired',
                type: 'hired',
                order: 5,
            }
        });

        await strapi.entityService.create('api::stage.stage',{
            data: {
                company: data.company.id,
                pipeline: pipeline.id,
                stage: 'Onboarding',
                type: 'onboarding',
                order: 6,
            }
        });

        const sources = ['Careers site', 'Indeed', 'LinkedIn', 'Resume sent', 'Referral'];
        const sourceIds = []; 

        for (let i = 0; i < sources.length; i++) {
            let source = await strapi.entityService.create('api::source.source',{
                data: {
                    company: data.company.id,
                    source: sources[i],
                }
            });
            sourceIds.push(source.id);
        }

        const disqualifies = ['Not a fit', 'Lack of knowledge', 'Hired elsewhere', 'Overpriced', 'Spam', 'Lacks interpersonal skills', 'Wrong skill set'];
        const disqualifyIds = [];

        for (let i = 0; i < disqualifies.length; i++) {
            let disqualify = await strapi.entityService.create('api::disqualify.disqualify',{
                data: {
                    company: data.company.id,
                    disqualify: disqualifies[i],
                }
            });
            disqualifyIds.push(disqualify.id);
        }

        const departaments = ['Sales', 'Support', 'Product', 'IT', 'Human resources', 'Marketing'];
        const departamentIds = [];

        for (let i = 0; i < departaments.length; i++) {
            let departament = await strapi.entityService.create('api::departament.departament',{
                data: {
                    company: data.company.id,
                    departament: departaments[i],
                }
            });
            departamentIds.push(departament.id);
        }

        const tagCandidates = ['Junior', 'Mid-level', 'Senior', 'Hired'];
        const tagCandidatetIds = [];

        for (let i = 0; i < tagCandidates.length; i++) {
            let tagCandidate = await strapi.entityService.create('api::tag-candidate.tag-candidate',{
                data: {
                    company: data.company.id,
                    tag: tagCandidates[i],
                }
            });
            tagCandidatetIds.push(tagCandidate.id);
        }

        const TagJobs = ['Junior', 'Mid-level', 'Senior', 'Remote'];
        const TagJobsIds = [];

        for (let i = 0; i < TagJobs.length; i++) {
            let tagCandidate = await strapi.entityService.create('api::tag-job.tag-job',{
                data: {
                    company: data.company.id,
                    tag: TagJobs[i],
                }
            });
            TagJobsIds.push(tagCandidate.id);
        }

        const questionnaire = await strapi.entityService.create('api::questionnaire.questionnaire',{
            data: {
                company: data.company.id,
                questionnaire: 'Basic questionnaire',
            }
        });

        await strapi.entityService.create('api::question.question',{
            data: {
                company: data.company.id,
                questionnaire: questionnaire.id,
                question: 'Can you tell us about your work experience and qualifications for this position?',
                description: '',
                type: 'video',
                alternatives: [],
                videoDuration: 1,
                required: 1,
                order: 0,
            }
        });

        await strapi.entityService.create('api::question.question',{
            data: {
                company: data.company.id,
                questionnaire: questionnaire.id,
                question: 'What are your greatest strengths and weaknesses?',
                description: '',
                type: 'text-multiple',
                alternatives: [],
                videoDuration: 0,
                required: 1,
                order: 1,
            }
        });

        await strapi.entityService.create('api::question.question',{
            data: {
                company: data.company.id,
                questionnaire: questionnaire.id,
                question: 'Why do you want to work for our company?',
                description: '',
                type: 'text-single',
                alternatives: [],
                videoDuration: 0,
                required: 1,
                order: 2,
            }
        });

        await strapi.entityService.create('api::question.question',{
            data: {
                company: data.company.id,
                questionnaire: questionnaire.id,
                question: 'Have you ever worked in a similar role before? ',
                description: '',
                type: 'yes/no',
                alternatives: [],
                videoDuration: 0,
                required: 1,
                order: 3,
            }
        });

        await strapi.entityService.create('api::question.question',{
            data: {
                company: data.company.id,
                questionnaire: questionnaire.id,
                question: 'How do you handle stress and pressure in the workplace?',
                description: '',
                type: 'video',
                alternatives: [],
                videoDuration: 2,
                required: 1,
                order: 4,
            }
        });

        await strapi.entityService.create('api::question.question',{
            data: {
                company: data.company.id,
                questionnaire: questionnaire.id,
                question: 'Are you willing to travel for work?',
                description: '',
                type: 'yes/no',
                alternatives: [],
                videoDuration: 0,
                required: 1,
                order: 5,
            }
        });

        await strapi.entityService.create('api::question.question',{
            data: {
                company: data.company.id,
                questionnaire: questionnaire.id,
                question: 'What is your availability for this position?',
                description: '',
                type: 'choice-single',
                alternatives: [
                    {
                        alternative: 'Part-time',
                        disqualifyAuto: 0,
                        disqualify: null,
                    },
                    {
                        alternative: 'Full-time',
                        disqualifyAuto: 0,
                        disqualify: null,
                    },
                ],
                videoDuration: 0,
                required: 1,
                order: 6,
            }
        });

        await strapi.entityService.create('api::question.question',{
            data: {
                company: data.company.id,
                questionnaire: questionnaire.id,
                question: 'How do you handle conflicts with coworkers or superiors?',
                description: '',
                type: 'video',
                alternatives: [],
                videoDuration: 2,
                required: 1,
                order: 7,
            }
        });

        await strapi.entityService.create('api::question.question',{
            data: {
                company: data.company.id,
                questionnaire: questionnaire.id,
                question: 'Are you comfortable working remotely?',
                description: '',
                type: 'yes/no',
                alternatives: [],
                videoDuration: 0,
                required: 1,
                order: 8,
            }
        });

        await strapi.entityService.create('api::question.question',{
            data: {
                company: data.company.id,
                questionnaire: questionnaire.id,
                question: 'What are your salary expectations?',
                description: '',
                type: 'text-single',
                alternatives: [],
                videoDuration: 0,
                required: 1,
                order: 9,
            }
        });
        
        const job = await strapi.entityService.create('api::job.job',{
            data: {
                company: data.company.id,
                code: uuidv4(),
                title: 'Computer Software Engineer [SAMPLE]',
                departament: departamentIds[3],
                type: "full-time",
                industry: 25,
                experience: "senior",
                education: "professional",
                country: 'US',
                state: faker.address.state(),
                city: faker.address.city(),
                street: faker.address.streetAddress(),
                zip: faker.address.zipCode(),
                hoursFrom: 30,
                hoursTo: 50,
                salaryFrom: 2000,
                salaryTo: 6000,
                salaryPeriod: 'monthly',
                salaryCurrency: 'USD',
                description: `<p>We are seeking a highly skilled Computer Software Engineer to join our team. In this role, you will be responsible for designing, developing, and maintaining software applications. You will work with a team of developers to create innovative solutions for our clients and collaborate with stakeholders to understand their needs and requirements.</p>`,
                requirements: `
                <ul>
                    <li>Bachelor's degree in Computer Science or related field</li>
                    <li>3+ years of experience in software development</li>
                    <li>Strong programming skills in languages such as C++, Java, and Python</li>
                    <li>Experience with software development methodologies such as Agile and Scrum</li>
                    <li>Strong analytical and problem-solving skills</li>
                    <li>Ability to work in a team environment</li>
                    <li>Experience with software development tools such as Git and JIRA</li>
                </ul>
                `,
                benefits: `
                <ul>
                    <li>Competitive salary</li>
                    <li>Medical and dental insurance</li>
                    <li>401(k) plan</li>
                    <li>Generous paid time off</li>
                    <li>Professional development opportunities</li>
                    <li>A fun and dynamic work environment</li>
                </ul>
                `,
                publishedAt: new Date(),
            }
        });

        await strapi.entityService.create('api::job-user.job-user',{
            data: {
                company: data.company.id,
                job: job.id,
                user: data.user.id,
                owner: 1,
            },
        });

        const createdDates = faker.date.betweens(new Date().setDate(new Date().getDate() - 30), new Date(), 17);
        const birthDates = faker.date.betweens(new Date().setDate(new Date().getDate() - 10950), new Date().setDate(new Date().getDate() - 7300), 17);
        
        const candidateIds = [];

        const imageDemos = await strapi.query('plugin::upload.file').findMany({
            where: { folderPath: '/1' },
        });

        for(let i = 0; i <= 16; i++){                
            let disqualify = (Math.random() < 0.5) ? 1 : 0;
            let gender = faker.name.sex();
            let firstName = faker.name.firstName({ sex: gender });
            let lastName = faker.name.lastName();
            let photo = imageDemos[i];

            let candidate = await strapi.entityService.create('api::candidate.candidate',{
                data: {
                    company: data.company.id,
                    email: faker.internet.email(firstName, lastName),
                    mobile: faker.phone.number(),
                    phone: faker.phone.number(),
                    firstName: firstName,
                    lastName: lastName,
                    timezone: 'America/Los_Angeles',
                    nationality: 'US',
                    birthDate:  moment(new Date(birthDates[i].toISOString())).format('YYYY-MM-DD'),
                    gender: (gender == 'male' || gender == 'female') ? gender :  'not-specified',
                    source: sourceIds[Math.floor(Math.random() * sourceIds.length)],
                    salaryExpectation: faker.datatype.number({ min: 3000, max: 5000 }),
                    address: faker.address.streetAddress(),
                    coverLetter: faker.lorem.paragraph(),
                    summary: faker.lorem.paragraph(),
                    skills: faker.company.bsAdjective() + ', ' + faker.company.bsBuzz() + ', ' + faker.company.bsNoun() + ', ' + faker.company.catchPhrase() + ', ' + faker.company.catchPhraseAdjective() + ', ' + faker.company.catchPhraseNoun(),
                    disqualify: disqualify,
                    disqualifyReason: (disqualify == 1) ? disqualifyIds[Math.floor(Math.random() * disqualifyIds.length)] : null,
                    demo: 1,
                    photo: photo,
                    experience: [
                        {
                            title: faker.name.jobTitle(),
                            company: faker.company.name(),
                            location: faker.address.streetAddress(),
                            description: faker.company.catchPhrase() + ', ' + faker.company.catchPhrase() + ', ' + faker.company.catchPhrase(), 
                            fromYear: faker.datatype.number({ min: new Date().getFullYear() - 15, max: new Date().getFullYear() - 8 }), 
                            toYear: faker.datatype.number({ min: new Date().getFullYear() - 8, max: new Date().getFullYear() }), 
                            current: 0, 
                        },
                        {
                            title: faker.name.jobTitle(),
                            company: faker.company.name(),
                            location: faker.address.streetAddress(),
                            description: faker.company.catchPhrase() + ', ' + faker.company.catchPhrase() + ', ' + faker.company.catchPhrase(), 
                            fromYear: faker.datatype.number({ min: new Date().getFullYear() - 15, max: new Date().getFullYear() - 8 }), 
                            toYear: faker.datatype.number({ min: new Date().getFullYear() - 8, max: new Date().getFullYear() }), 
                            current: 0, 
                        },
                        {
                            title: faker.name.jobTitle(),
                            company: faker.company.name(),
                            location: faker.address.streetAddress(),
                            description: faker.company.catchPhrase() + ', ' + faker.company.catchPhrase() + ', ' + faker.company.catchPhrase(), 
                            fromYear: faker.datatype.number({ min: new Date().getFullYear() - 15, max: new Date().getFullYear() - 8 }), 
                            toYear: faker.datatype.number({ min: new Date().getFullYear() - 8, max: new Date().getFullYear() }), 
                            current: 0, 
                        },
                    ],
                    education: [
                        {
                            school: faker.company.name(),
                            degree: faker.company.bs(),
                            degreeSubject: faker.company.bsNoun(),
                            description: faker.lorem.paragraph(), 
                            fromYear: faker.datatype.number({ min: new Date().getFullYear() - 15, max: new Date().getFullYear() - 8 }), 
                            toYear: faker.datatype.number({ min: new Date().getFullYear() - 8, max: new Date().getFullYear() }), 
                        },
                    ],
                    createdAt: createdDates[i],
                },
            });
            
            candidateIds.push(candidate.id);
        }
    
        let stageSourced = await strapi.entityService.create('api::job-stage.job-stage',{
            data: {
                company: data.company.id,
                job: job.id,
                stage: 'Sourced',
                type: 'sourced',
                order: 0,
            }
        });

        for(let i = 0; i <= 6; i++){  
            await strapi.entityService.create('api::job-candidate.job-candidate',{
                data: {
                    company: data.company.id,
                    job: job.id,
                    stage: stageSourced.id,
                    candidate: candidateIds[i],
                    order: i,
                },
            });
        }

        let stageApply = await strapi.entityService.create('api::job-stage.job-stage',{
            data: {
                company: data.company.id,
                job: job.id,
                stage: 'Apply',
                type: 'apply',
                order: 1,
            }
        });

        for(let i = 7; i <= 9; i++){  
            await strapi.entityService.create('api::job-candidate.job-candidate',{
                data: {
                    company: data.company.id,
                    job: job.id,
                    stage: stageApply.id,
                    candidate: candidateIds[i],
                    order: i - 7,
                },
            });
        }

        let stageInterview = await strapi.entityService.create('api::job-stage.job-stage',{
            data: {
                company: data.company.id,
                job: job.id,
                stage: 'Interview',
                type: 'interview',
                order: 2,
            }
        });

        for(let i = 10; i <= 12; i++){  
            await strapi.entityService.create('api::job-candidate.job-candidate',{
                data: {
                    company: data.company.id,
                    job: job.id,
                    stage: stageInterview.id,
                    candidate: candidateIds[i],
                    order: i - 10,
                },
            });
        }
        
        let stageAssessment = await strapi.entityService.create('api::job-stage.job-stage',{
            data: {
                company: data.company.id,
                job: job.id,
                stage: 'Assessment',
                type: 'assessment',
                order: 3,
            }
        });

        for(let i = 13; i <= 14; i++){  
            await strapi.entityService.create('api::job-candidate.job-candidate',{
                data: {
                    company: data.company.id,
                    job: job.id,
                    stage: stageAssessment.id,
                    candidate: candidateIds[i],
                    order: i - 13,
                },
            });
        }

        let stageOffer = await strapi.entityService.create('api::job-stage.job-stage',{
            data: {
                company: data.company.id,
                job: job.id,
                stage: 'Offer',
                type: 'offer',
                order: 4,
            }
        });

        for(let i = 15; i <= 16; i++){  
            await strapi.entityService.create('api::job-candidate.job-candidate',{
                data: {
                    company: data.company.id,
                    job: job.id,
                    stage: stageOffer.id,
                    candidate: candidateIds[i],
                    order: i - 15,
                },
            });
        }

        await strapi.entityService.create('api::job-stage.job-stage',{
            data: {
                company: data.company.id,
                job: job.id,
                stage: 'Hired',
                type: 'hired',
                order: 5,
            }
        });

        await strapi.entityService.create('api::job-stage.job-stage',{
            data: {
                company: data.company.id,
                job: job.id,
                stage: 'Onboarding',
                type: 'onboarding',
                order: 6,
            }
        });

        await strapi.entityService.create('api::email-template.email-template',{
            data: {
                company: data.company.id,
                type: 'confirmation',
                template: 'Confirmation',
                subject: `{company.company} - Confirmation of your application for {job.title}`,
                body: `<p>Dear {candidate.firstName},</p>
        
                <p>We wanted to take a moment to thank you for submitting your application for the {job.title} role at {company.company}. We have received your application and are currently reviewing it.</p>
                
                <p>We appreciate your interest in our organization and the time you have taken to apply for this position. We will be in touch with you shortly regarding the next steps in the hiring process.</p>
                
                <p>If you have any questions or concerns, please do not hesitate to reach out to us. We will be happy to assist you.</p>
                
                <p>Thank you again for your application, and we look forward to the opportunity to meet you.</p>
                
                <p>Kind regards,</p>`,
                default: 1,
            }
        });
        
        await strapi.entityService.create('api::email-template.email-template',{
            data: {
                company: data.company.id,
                type: 'referral',
                template: 'Referral Notification',
                subject: `{company.company} - Referral Notification for {job.title}`,
                body: `<p>Dear {candidate.firstName},</p>
        
                <p>We are writing to inform you that you have been referred for the {job.title} role at {company.company} by {referral.firstName}. We appreciate the referral and are excited to review your application.</p>
                
                <p>We take referrals very seriously and value the input of our current employees and colleagues in the industry. Your referral is a testament to your qualifications and experience, and we are excited to learn more about you.</p>
                
                <p>If you have not yet completed your resume for this position, please follow this link {job.url.referral} and submit your application. If you have already applied, please disregard this email.</p>
                
                <p>We will be in touch with you shortly regarding the next steps in the hiring process. If you have any questions or concerns, please do not hesitate to reach out to us.</p>
                
                <p>Thank you for your time and consideration, and we look forward to the opportunity to meet you.</p>
                
                <p>Kind regards,</p>`,
                default: 1,
            }
        });
        
        await strapi.entityService.create('api::email-template.email-template',{
            data: {
                company: data.company.id,
                type: 'scheduler',
                template: 'Interview Invitation',
                subject: `{company.company} - Interview Invitation for {job.title}`,
                body: `<p>Dear {candidate.firstName},</p>
        
                <p>We are writing to invite you for an interview for the {job.title} role at {company.company}. We have reviewed your application and are impressed with your qualifications and experience. We would like to learn more about you and discuss how you can contribute to our organization.</p>
        
                <p>Please click on the following link {job.url.scheduler} to access our calendar and schedule a time that works best for you.</p>
                
                <p>Please make sure to review the instructions on the calendar page before scheduling your interview. We recommend that you find a quiet place, with a reliable internet connection and a web camera, to participate in the interview.</p>
                
                <p>If you have any questions or concerns, please do not hesitate to reach out to us. We will be happy to assist you.</p>
                
                <p>Thank you for your time and consideration, and we look forward to the opportunity to meet you.</p>
                
                <p>Kind regards,</p>`,
                default: 1,
            }
        });
        
        await strapi.entityService.create('api::email-template.email-template',{
            data: {
                company: data.company.id,
                type: 'assessment',
                template: 'Assessment Invitation',
                subject: `{company.company} - Assessment Invitation for {job.title}`,
                body: `<p>Dear {candidate.firstName},</p>
        
                <p>We are writing to invite you to participate in a series of tests as part of the hiring process for the {job.title} role at {company.company}. We have reviewed your application and are impressed with your qualifications and experience. We would like to learn more about your cognitive and behavioral characteristics to ensure that you are the best fit for the role.</p>
        
                <p>The tests will be conducted online. They will assess your cognitive abilities, personality traits, work-related values, intelligence, etc. The results will be used to evaluate your suitability for the position and to provide feedback on your strengths and areas for improvement.</p>
                
                <p>Please click on the following link {job.url.assessment} to access the test platform and schedule a time that works best for you. We recommend that you find a quiet place, with a reliable internet connection, to participate in the tests.</p>
                
                <p>If you have any questions or concerns, please do not hesitate to reach out to us. We will be happy to assist you.</p>
                
                <p>Thank you for your time and consideration, and we look forward to the opportunity to learn more about you.</p>
                
                <p>Kind regards,</p>`,
                default: 1,
            }
        });
        
        await strapi.entityService.create('api::email-template.email-template',{
            data: {
                company: data.company.id,
                type: 'questionnaire',
                template: 'Questionnaire Invitation',
                subject: `{company.company} - Questionnaire Invitation for {job.title}`,
                body: `<p>Dear {candidate.firstName},</p>
        
                <p>We are writing to invite you to participate in a questionnaire as part of the hiring process for the {job.title} role at {company.company}. We have reviewed your application and are impressed with your qualifications and experience. We would like to learn more about your skills, experiences and interests to ensure that you are the best fit for the role.</p>
        
                <p>The questionnaire will be conducted online. It will cover various aspects of your professional and personal background, such as your job experience, education, and career goals. The results will be used to evaluate your suitability for the position and to provide feedback on your strengths and areas for improvement.</p>
                
                <p>Please click on the following link {job.url.questionnaire} to access the questionnaire and complete it at your earliest convenience. We recommend that you review the questions carefully and provide honest and thoughtful answers.</p>
                
                <p>If you have any questions or concerns, please do not hesitate to reach out to us. We will be happy to assist you.</p>
                
                <p>Thank you for your time and consideration, and we look forward to the opportunity to learn more about you.</p>
                
                <p>Kind regards,</p>`,
                default: 1,
            }
        });
        
        await strapi.entityService.create('api::email-template.email-template',{
            data: {
                company: data.company.id,
                type: 'gpdr',
                template: 'GPDR Data Deletion',
                subject: `{company.company} - GPDR Automated Data Deletion Notification`,
                body: `<p>Dear {candidate.firstName},</p>
        
                <p>We are writing to inform you that, in accordance with the General Data Protection Regulation (GDPR), in ${process.env.GPDR_NOTIFICATION_DAYS} days we will be automating the deletion of your personal data that we collected as part of your application to the company {company.company}.</p>
        
                <p>As you may know, GDPR requires us to delete personal data that is no longer necessary for the purpose for which it was collected, and you have not given us explicit consent to keep it. Therefore, we will be automatically deleting your personal data, including your resume, cover letter, and any other documents you have submitted, as well as any notes or comments that our recruiters have made.</p>
                
                <p>Please note that this deletion will be permanent and irreversible, and that we will not be able to restore your data after it has been deleted. Therefore, If you want to keep your information, click on the following link {gpdr.url} to give us your consent and keep your information in our database for future job opportunities.</p>
                
                <p>Kind regards,</p>`,
                default: 1,
            }
        });
        
        await strapi.entityService.create('api::email-template.email-template',{
            data: {
                company: data.company.id,
                type: 'nps',
                template: 'Candidate NPS Feedback Request',
                subject: `{company.company} - Candidate Feedback Request`,
                body: `<p>Dear {candidate.firstName},</p>
        
                <p>We hope you are doing well. We wanted to take a moment to thank you for your interest in the {job.title} role at {company.company}. We appreciate the time and effort you have put into the recruitment process.</p>
        
                <p>As part of our ongoing efforts to improve our recruitment process, we would like to request your feedback on your experience with {company.company}. We value your input and would like to know how we can continue to improve our service to you.</p>
                
                <p>Please take a moment to complete the following survey by clicking on the link below. Your feedback will be completely anonymous and will only take a few minutes of your time.</p>
                
                <p>{job.url.nps}</p>
                
                <p>We understand that you may not be selected for the role at this time, but we hope that you will consider applying for future opportunities with our company.</p>
                
                <p>Thank you again for your time and consideration. We look forward to hearing your feedback.</p>
                
                <p>Kind regards,</p>`,
                default: 1,
            }
        });
        
        await strapi.entityService.create('api::email-template.email-template',{
            data: {
                company: data.company.id,
                type: 'disqualify',
                template: 'Disqualified candidate',
                subject: `{company.company} - Decision on your application for {job.title}`,
                body: `<p>Dear {candidate.firstName},</p>
        
                <p>Thank you for taking the time to apply for the {job.title} role at {company.company}. We appreciate your interest in our organization.</p>
        
                <p>After careful consideration, we have decided to move forward with other candidates who better fit the qualifications and experience required for the role.</p>
        
                <p>We wish you all the best in your job search and career endeavors.</p>
                
                <p>Thank you again for your application.</p>
                
                <p>Kind regards,</p>`,
                default: 1,
            }
        });
        
        await strapi.entityService.create('api::email-template.email-template',{
            data: {
                company: data.company.id,
                type: 'candidate',
                template: 'Sharing Candidates',
                subject: `{company.company} - Sharing Candidates for {job.title}`,
                body: `<p>Dear,</p>
        
                <p>I hope this email finds you well. I wanted to reach out and share some candidates that I believe would be a great fit for the {job.title} role that we are currently recruiting for.</p>
        
                <p>You can view the candidates on the following link:</p>
        
                <p>{candidates.url}</p>
                
                <p>I would highly recommend scheduling an interview with these candidates as soon as possible, as they are highly sought after in the job market and may not be available for long.</p>
                
                <p>Please let me know if you have any questions or need any additional information. I am happy to assist in any way I can.</p>
                
                <p>Kind regards,</p>`,
                default: 1,
            }
        });
        
        await strapi.entityService.create('api::email-template.email-template',{
            data: {
                company: data.company.id,
                type: 'document',
                template: 'Document',
                subject: `{company.company} sent you a document to {document.type}`,
                body: `<p>Dear {data.firstName},</p>
                
                <p>{company.company} sent you a document to {document.type}</p>
                
                <p>{document.url}</p>

                <p>Document: {document.title}</p>
                
                <p>If you have any questions or concerns regarding this document, please don't hesitate to reach out to our HR team.</p>
                
                <p>Kind regards,</p>`,
                default: 1,
            }
        });
        
        await strapi.entityService.create('api::email-template.email-template',{
            data: {
                company: data.company.id,
                type: 'general',
                template: 'Referral outreach',
                subject: `{company.company} - Referral Outreach for {job.title}`,
                body: `<p>Dear {candidate.firstName},</p>
        
                <p>We hope this email finds you well. We are writing to reach out to you regarding a new opportunity that has become available at our company {company.company}. The {job.title} role is a great fit for your skills and experience and we would like to invite you to apply for the role.</p>
        
                <p>We understand that you may not be actively seeking a new opportunity at this time, but we wanted to make sure you were aware of this opportunity. We believe that you would be a great fit for the role and we would be honored to have you as part of our team.</p>
        
                <p>To apply for the position, please follow this link {job.url} and submit your application. If you have any questions or concerns, please do not hesitate to reach out to us. We will be happy to assist you.</p>
        
                <p>We appreciate your time and consideration, and we look forward to the opportunity to meet you.</p>
                
                <p>Kind regards,</p>`,
                default: 0,
            }
        });
        
        await strapi.entityService.create('api::email-template.email-template',{
            data: {
                company: data.company.id,
                type: 'general',
                template: 'Phone Interview',
                subject: `{company.company} - Phone Interview Invitation for {job.title}`,
                body: `<p>Dear {candidate.firstName},</p>
        
                <p>We are writing to invite you for a phone interview as part of the hiring process for the {job.title} role at {company.company}. We have reviewed your application and are impressed with your qualifications and experience. We would like to learn more about you and discuss how you can contribute to our organization.</p>
        
                <p>The phone interview is scheduled for {calendar.date}. Please confirm your availability by replying to this email or by calling {user.phone}. We recommend that you find a quiet place, with a reliable phone connection, to participate in the interview.</p>
                
                <p>During the interview, we will ask you a series of questions related to your qualifications, experience, and motivation for the role. We will also provide you with more information about the position and the company, and give you an opportunity to ask any questions you may have.</p>
                
                <p>If you have any questions or concerns, please do not hesitate to reach out to us. We will be happy to assist you.</p>
                
                <p>Kind regards,</p>`,
                default: 0,
            }
        });
        
        await strapi.entityService.create('api::email-template.email-template',{
            data: {
                company: data.company.id,
                type: 'general',
                template: 'Reviewing Status',
                subject: `{company.company} - Checking and Reviewing Status of your application for {job.title}`,
                body: `<p>Dear {candidate.firstName},</p>
        
                <p>We wanted to reach out to you regarding the status of your application for the {job.title} role at {company.company}. We have received your application and are currently reviewing it.</p>
        
                <p>We understand that you may be eager to know the outcome of your application and we want to assure you that we are giving your application the attention it deserves. Our recruitment team is working diligently to review all applications and will be in touch with you shortly regarding the next steps in the hiring process.</p>
                
                <p>We appreciate your interest in our organization and the time you have taken to apply for this position. We will be in touch with you soon to provide an update on your application.</p>
                
                <p>If you have any questions or concerns, please do not hesitate to reach out to us. We will be happy to assist you.</p>
                
                <p>Thank you again for your application, and we look forward to the opportunity to meet you.</p>
                
                <p>Kind regards,</p>`,
                default: 0,
            }
        });

        ctx.body = {
            data: {
                status: "ok"
            },
            meta: {}
        };
    },
    async report(ctx){
        const { id } = ctx.params;

        const user = await strapi.service('api::user.user').me();

        if(user.company.id != id){
            return ctx.notFound('Not Found', {});
        }

        const report = {
            candidates: {
                total: 0,
                disqualify: 0,
                sourced: 0,
                apply: 0,
                interview: 0,
                assessment: 0,
                offer: 0,
                hired: 0,
                onboarding: 0,
                overTime: {
                    
                }
            },
            time: {
                toHire: 0,
                toDisqualify: 0,
            },
            nps: {
                
            },
            disqualify: {
                reasons: {

                },
                stages: {

                }
            },
            sources: {
                linkedin: 0,
                indeed: 0,
                careeSite: 0,
            },
            departaments: {
                one: 0,
                two: 0,
                three: 0,
            },
            jobs: {
                archivaded: 0,
                status: {},
                overTime: {
                    
                },
                list:{
                    job_1: {
                        pipeline: {
                            apply: 0,
                            interview: 0,
                            hire: 0,
                        }
                    },
                    job_2: {
                        pipeline: {
                            apply: 0,
                            interview: 0,
                            hire: 0,
                        }
                    }
                }
            },
            evaluations: {
                users: {},
                overTime: {
                    
                },
            },
            diversity: {
                //TODO: INFO DE EDADES, DIVERSIDAD, ETC
            }
        };


        ctx.body = {
            data: report,
            meta: {}
        };
    },
}));