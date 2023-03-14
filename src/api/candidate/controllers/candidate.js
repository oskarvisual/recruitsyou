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
//TODO: CREAR CONTROLADOR PARA APLICAR
//TODO: FALTA PROBAR AMBOS IMPORTADORES CON TRABAJOS Y DATA REAL
//TODO: PROBAR IMPORTAR CV A CANDIDATO YA EXISTENTE PERO SIN CV
module.exports = createCoreController('api::candidate.candidate', ({ strapi }) => ({
    async apply(ctx){

    },
    async create(ctx) {
        const user = await strapi.service('api::user.user').me();
        const data = await this.sanitizeInput(ctx.request.body.data);

        const response = await super.create(ctx);
        
        if(data?.job){
            await strapi.service('api::job-candidate.job-candidate').create({
                data: {
                    candidate: response.data.id,
                    job: data.job,
                },
            });
        }

        return response;
    },
    async importCsv(ctx){
        const user = await strapi.service('api::user.user').me();
        const data = await this.sanitizeInput(ctx.request.body.data);

        if(!user.company.plan.files){ 
            return ctx.forbidden('Your plan does not allow you to perform this action', {});
        }

        if(!ctx.request.files || !ctx.request.files[ 'csv' ]){
            return ctx.badRequest('The file was not uploaded correctly', {});
        }
        
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
        
        let count = [];
        let countExist = [];
        const csv = load(ctx.request.files[ 'csv' ].path);

        if(csv.length > 0){
            for(let i = 0; i < csv.length; i++){
                if(csv[i].email || csv[i].firstName){
                    continue;
                }
                
                let candidateData = {
                    data: {
                        company: user.company.id,
                        email: csv[i].email,
                        firstName: csv[i].firstName,
                        source: source.id,
                    }
                };
                
                if(csv[i].lastName){
                    candidateData.data.lastName = csv[i].lastName;
                }
                
                if(csv[i].birthDate){
                    candidateData.data.birthDate = moment(new Date(csv[i].birthDate)).format('YYYY-MM-DD');
                }
                
                if(csv[i].salaryExpectation){
                    candidateData.data.salaryExpectation = csv[i].salaryExpectation;
                }
                
                if(csv[i].phone){
                    candidateData.data.phone = csv[i].phone;
                }
                
                if(csv[i].mobile){
                    candidateData.data.mobile = csv[i].mobile;
                }

                let candidate = await strapi.service('api::candidate.candidate').create(candidateData);

                if(candidate){
                    if(!candidate.exist){ count.push(candidate); }
                    else{ countExist.push(candidate); }

                    if(data?.job){
                        await strapi.service('api::job-candidate.job-candidate').create({
                            data: {
                                candidate: candidate.id,
                                job: data.job,
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
    },
    async import(ctx){
        const user = await strapi.service('api::user.user').me();
        const data = await this.sanitizeInput(ctx.request.body.data);

        if(!user.company.plan.files){ 
            return ctx.forbidden('Your plan does not allow you to perform this action', {});
        }

        const config = strapi.config.get("plugin.upload");

        if(!ctx.request.files || !ctx.request.files[ 'resume' ]){
            return ctx.badRequest('The file was not uploaded correctly', {});
        }

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

        const resumeFetch = await fetch(`https://api.apilayer.com/resume_parser/url?url=${file.url}`, {
            method: 'GET',
            redirect: 'follow',
            headers: myHeaders
        });
        const resume = await resumeFetch.json();

        if(!resume){
            return ctx.badRequest('Import Resume File Error', { 
                details: {}
            });
        }

        if(resume.message || !resume.email || !resume.name){
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
        
        if(resume.phone){
            candidateData.data.phone = resume.phone;
        }
        
        if(resume.phone){
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
        
        if(data?.job){
            await strapi.service('api::job-candidate.job-candidate').create({
                data: {
                    candidate: candidate.id,
                    job: data.job,
                },
            });
        }

        return {
            data: candidate,
            meta: {}
        };
    },
    async gpdr(ctx){
        const deleted = await strapi.service('api::candidate.candidate').deleteGpdr();

        return {
            data: {
                deleted: deleted,
            },
            meta: {}
        };
    }
}));
