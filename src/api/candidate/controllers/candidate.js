'use strict';

/**
 * candidate controller
 */
const { nanoid } = require("nanoid");
const path = require('path');
var mime = require('mime-types');

const moment = require('moment');

const fs = require('fs');
const { Readable } = require("stream");

const getServiceUpload = (name) => {
  return strapi.plugin("upload").service(name);
};

const { load } = require('csv-load-sync');

const { createCoreController } = require('@strapi/strapi').factories;
//TODO: CREAR CONTROLADOR PARA APLICAR y ONBOARDING
//TODO: FALTA PROBAR AMBOS IMPORTADORES CON TRABAJOS Y DATA REAL
//TODO: PROBAR IMPORTAR CV A CANDIDATO YA EXISTENTE PERO SIN CV
//TODO: FALTA CONTROLLER PARA EXPORTAR CSV
module.exports = createCoreController('api::candidate.candidate', ({ strapi }) => ({
    async apply(ctx){

    },
    async onboarding(ctx){

    },
    async create(ctx) {
        const user = await strapi.service('api::user.user').me();
        const response = await super.create(ctx);
        const data = await this.sanitizeInput(ctx.request.body.data);

        const candidateId = response.data.id;
        
        if(data.job != undefined){
            if(data.job != undefined){
                const job = await strapi.service('api::job.job').findOne(data.job);
                if(job != null){
                    const stage = await strapi.entityService.findMany('api::job-stage.job-stage', {
                        filters: {
                            $and: [
                                {
                                    company: user.company.id,
                                },
                                {
                                    job: job.id,
                                },
                                {
                                    type: 'sourced',
                                },
                            ],
                        },
                    });
                    
                    if(stage.length > 0){
                        let stageCandidates = await strapi.service('api::job-candidate.job-candidate', {
                            filters: {
                                $and: [
                                    {
                                        company: user.company.id,
                                    },
                                    {
                                        job: job.id,
                                    },
                                    {
                                        stage: stage[0].id,
                                    },
                                ],
                            },
                            orderBy: { order: 'DESC' },
                        });
                        
                        let order = 0;
                        
                        if(stageCandidates.length > 0){
                            order = stageCandidates[0].order;
                        }
            
                        await strapi.service('api::job-candidate.job-candidate').create({
                            data: {
                                company: user.company.id,
                                job: job.id,
                                stage: stage[0].id,
                                candidate: candidateId,
                                order: order + 1,
                            },
                        });
                    }
                }
            }
        }

        return response;
    },
    async importCsv(ctx){
        const user = await strapi.service('api::user.user').me();
        const data = await this.sanitizeInput(ctx.request.body.data);

        if(!user.company.plan.files){ 
            return ctx.forbidden('Your plan does not allow you to perform this action', {});
        }


        if(ctx.request.files != undefined){
            if(ctx.request.files[ 'csv' ] != undefined){

                const mimeType = mime.lookup(ctx.request.files[ 'csv' ].name);

                if(mimeType != 'text/csv'){
                    return ctx.badRequest('Import Resume File Format Error', {});
                }

                const sourceName = 'Import ' + moment(new Date()).format('YYYY-MM-DD');
                
                const source = await strapi.service('api::source.source').create({
                    data: {
                        company: user.company.id,
                        source: sourceName,
                    }
                });

                let jobData = null;

                if(data != undefined){
                    if(data.job != undefined){
                        const job = await strapi.service('api::job.job').findOne(data.job);
                    
                        if(job != null){
                            const stage = await strapi.entityService.findMany('api::job-stage.job-stage', {
                                filters: {
                                    $and: [
                                        {
                                            company: user.company.id,
                                        },
                                        {
                                            job: job.id,
                                        },
                                        {
                                            type: 'sourced',
                                        },
                                    ],
                                },
                            });
                            
                            if(stage.length > 0){
                                let stageCandidates = await strapi.entityService.findMany('api::job-candidate.job-candidate', {
                                    filters: {
                                        $and: [
                                            {
                                                company: user.company.id,
                                            },
                                            {
                                                job: job.id,
                                            },
                                            {
                                                stage: stage[0].id,
                                            },
                                        ],
                                    },
                                    orderBy: { order: 'DESC' },
                                });
                                
                                let order = 0;
                                
                                if(stageCandidates.length > 0){
                                    order = stageCandidates[0].order;
                                }

                                jobData = {
                                    job: job.id,
                                    stage: stage[0].id,
                                }
                            }
                        }
                    }
                }
                
                let count = [];
                let countExist = [];
                const csv = load(ctx.request.files[ 'csv' ].path);

                if(csv.length > 0){
                    for(let i = 0; i < csv.length; i++){
                        if(csv[i].email == undefined || csv[i].firstName == undefined){
                            continue;
                        }
                        
                        const candidateData = {
                            data: {
                                company: user.company.id,
                                email: csv[i].email,
                                firstName: csv[i].firstName,
                                source: source.id,
                            }
                        };
                        
                        if(csv[i].lastName != undefined){
                            candidateData.data.lastName = csv[i].lastName;
                        }
                        
                        if(csv[i].birthDate != undefined){
                            candidateData.data.birthDate = moment(new Date(csv[i].birthDate)).format('YYYY-MM-DD');
                        }
                        
                        if(csv[i].salaryExpectation != undefined){
                            candidateData.data.salaryExpectation = csv[i].salaryExpectation;
                        }
                        
                        if(csv[i].phone != undefined){
                            candidateData.data.phone = csv[i].phone;
                        }
                        
                        if(csv[i].mobile != undefined){
                            candidateData.data.mobile = csv[i].mobile;
                        }

                        const candidate = await strapi.service('api::candidate.candidate').create(candidateData);

                        if(candidate != null){
                            if(candidate.exist == undefined){ count.push(candidate); }
                            else{ countExist.push(candidate); }

                            if(jobData != null){
                                await strapi.service('api::job-candidate.job-candidate').create({
                                    data: {
                                        company: user.company.id,
                                        candidate: candidate.id,
                                        ...jobData,
                                        order: order + i,
                                    },
                                });
                            }
                        }

                        
                    }
                }
    
                return ctx.send({
                    data: {
                        imports: count,
                        exists: countExist
                    },
                    meta: {}
                });
            }
        }

        return ctx.internalServerError('Resume no uploaded', {});
    },
    async import(ctx){
        const user = await strapi.service('api::user.user').me();
        const data = await this.sanitizeInput(ctx.request.body.data);

        if(!user.company.plan.files){ 
            return ctx.forbidden('Your plan does not allow you to perform this action', {});
        }

        const config = strapi.config.get("plugin.upload");

        if(ctx.request.files != undefined){
            if(ctx.request.files[ 'resume' ] != undefined){
                const fileNameNoExt = path.basename(ctx.request.files[ 'resume' ].name, path.extname(ctx.request.files[ 'resume' ].name));
                const stats = fs.statSync(ctx.request.files[ 'resume' ].path);
                const fileSizeInBytes = stats.size;
                const mimeType = mime.lookup(ctx.request.files[ 'resume' ].name);

                if(mimeType != 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                && mimeType != 'application/msword' && mimeType != 'application/pdf'){
                    return ctx.badRequest('Import Resume File Format Error', {});
                }

                const entity = {
                    name:  ctx.request.files[ 'resume' ].name,
                    hash:  `${nanoid()}_${fileNameNoExt}`,
                    ext: path.extname(ctx.request.files[ 'resume' ].name),
                    mime: mimeType,
                    size: fileSizeInBytes,
                    provider: config.provider,
                    folderPath: '/2'
                };

                let buffer = fs.readFileSync(ctx.request.files[ 'resume' ].path);
                entity.getStream = () => Readable.from(buffer);
                await getServiceUpload("provider").upload(entity);

                const fileValues = { ...entity };

                const file = await strapi.query("plugin::upload.file").create({ data: fileValues });

                var myHeaders = new Headers();
                myHeaders.append("apikey", process.env.RESUME_API_KEY);

                var requestOptions = {
                    method: 'GET',
                    redirect: 'follow',
                    headers: myHeaders
                };

                const resumeFetch = await fetch(`https://api.apilayer.com/resume_parser/url?url=${file.url}`, requestOptions);
                const resume = await resumeFetch.json();

                if(resume == undefined){
                    return ctx.badRequest('Import Resume File Error', { 
                        details: {}
                    });
                }

                if(resume.message != undefined || resume.email == undefined || resume.name == undefined){
                    return ctx.badRequest('Import Resume File Error', {});
                }

                let firstName = resume.name;
                let lastName = '';
                
                if(resume.name.includes(' ')){
                    let nameTemp = resume.name.split(' ');
                    firstName = nameTemp[0];
                    lastName = resume.name.substring(nameTemp[0].length + 1, resume.name.length);
                }
                
                
                const candidateData = {
                    data: {
                        company: user.company.id,
                        email: resume.email,
                        firstName: firstName,
                        lastName: lastName,
                        resume: file.id,
                    }
                };
                
                if(resume.phone != undefined){
                    candidateData.data.phone = resume.phone;
                }
                
                if(resume.phone != undefined){
                    candidateData.data.phone = resume.phone;
                }
                
                if(resume.skills.length > 0){
                    candidateData.data.skills = resume.skills.toString();
                }
                
                if(resume.education.length > 0){
                    candidateData.data.education = [];
                    for(let i = 0; i < resume.education.length; i++){
                        candidateData.data.education.push({
                            school: resume.education[i].name,
                        });
                    }
                    candidateData.data.skills = resume.skills.toString();
                }
                
                if(resume.experience.length > 0){
                    candidateData.data.experience = [];
                    for(let i = 0; i < resume.experience.length; i++){
                        candidateData.data.experience.push({
                            school: resume.experience[i].name,
                        });
                    }
                    for(let i = 0; i < resume.experience.length; i++){
                        candidateData.data.experience.push({
                            company: resume.experience[i].name,
                        });
                    }
                    candidateData.data.skills = resume.skills.toString();
                }

                const sourceName = 'Import ' + moment(new Date()).format('YYYY-MM-DD');
                
                const source = await strapi.service('api::source.source').create({
                    data: {
                        company: user.company.id,
                        source: sourceName,
                    }
                });

                candidateData.data.source = source.id;

                const candidate = await strapi.service('api::candidate.candidate').create(candidateData);
                
                if(data != undefined){
                    if(data.job != undefined){
                        const job = await strapi.service('api::job.job').findOne(data.job);
                        if(job != null){
                            const stage = await strapi.entityService.findMany('api::job-stage.job-stage', {
                                filters: {
                                    $and: [
                                        {
                                            company: user.company.id,
                                        },
                                        {
                                            job: job.id,
                                        },
                                        {
                                            type: 'sourced',
                                        },
                                    ],
                                },
                            });
                            
                            if(stage.length > 0){
                                let stageCandidates = await strapi.service('api::job-candidate.job-candidate', {
                                    filters: {
                                        $and: [
                                            {
                                                company: user.company.id,
                                            },
                                            {
                                                job: job.id,
                                            },
                                            {
                                                stage: stage[0].id,
                                            },
                                        ],
                                    },
                                    orderBy: { order: 'DESC' },
                                    offset: 0, 
                                    limit: 1,
                                });
                                
                                let order = 0;
                                
                                if(stageCandidates.length > 0){
                                    order = stageCandidates[0].order;
                                }
                    
                                await strapi.service('api::job-candidate.job-candidate').create({
                                    data: {
                                        company: user.company.id,
                                        job: job.id,
                                        stage: stage[0].id,
                                        candidate: candidate.id,
                                        order: order + 1,
                                    },
                                });
                            }
                        }
                    }
                }
                
                let candidateId = candidate.id;
                delete candidate.id;
                let attributes = candidate;

                return {
                    data: {
                        id: candidateId,
                        attributes: attributes,
                    },
                    meta: {}
                };
            }
        }

        return ctx.internalServerError('Resume no uploaded', {});
    },
}));
