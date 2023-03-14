'use strict';

/**
 * link service
 */
const { v4: uuidv4 } = require('uuid');

const moment = require('moment');

const { createCoreService } = require('@strapi/strapi').factories;
const api = 'api::link.link';

module.exports = createCoreService(api, ({ strapi }) => ({
    async find(params) {
        const user = await strapi.service('api::user.user').me();
        params.filters = {
            company: user.company.id
        }
        params.populate = {}
        
        //TODO: AGREGAR LOGICA PARA FILTAR POR EMPRESA PARA CANDIDATO
        const result = await super.find(params);

        if(result?.results.length > 0){
            for (let i = 0; i < result.results.length; i++){
                result.results[i].url = await strapi.service(api).getUrl(user.company.domain, user.company.subdomain, result.results[i].code);
            }
        }
        
        return result;
    },
    async findOne(entityId, params = {}) {
        //TODO: FALTA SI ES SCHEDULE MOSTRAR LOS HUECOS DISPONIBLES PARA EL USUARIO 
        //TODO: FALTA SI ES DOCUMENT SI ESTA EN ESTADO DONE O REJECT MUESTRE 404 PARA USUARIOS NO LOGUEADOS
        //TODO: FALTA SI ES JOB NO MOSTRAR ARCHIVADOS PARA USAURIOS NO LOGUEADOS (EN DOCUMENTO O JOB DIRECTO)
        //TODO: SI NO ESTA LOGUEADO Y VE DOCUMENTO, LOS SIGNERS SOLO SE USAN APRA VALIDAR SI YA FIRMMO Y LUEGO SE ELIMINAN DEL JSON
        //TODO: TODO LO RELACIONADO CON JOB VALIDAR SI EL CORREO DEL LINK COINCIDE CON ALGUN CANDIDADTO Y SI ES ASI OBTIENE SUS DATOS Y REVISA SI YA HIZO POR EJEMPLO EL CUESTIONARIO, EN EL CASO DE TESTS SOLO MUESTRA CHECK (COMO TE RECLUTA)
        const user = await strapi.service('api::user.user').me();

        if(user){ 
            params.filters = {
                $and: [
                    {
                        id: entityId,
                    },
                    { 
                        company: user.company.id 
                    },
                ],
            }
        }else{
            params.filters = {
                $and: [
                    {
                        code: entityId,
                    },
                ],
            }
        }

        params.populate = {
            company: {
                fields: [
                    'id',
                    'company',
                    'domain',
                    'subdomain',
                    'gpdrPrivacyUrl',
                    'website',
                ],
                populate: {
                    logo: {
                        fields: [
                            'id',
                            'name',
                            'alternativeText',
                            'width',
                            'height',
                            'ext',
                            'mime',
                            'size',
                            'url',
                            'folderPath',
                            'createdAt',
                            'updatedAt',
                        ],
                    },
                }
            },
            job: {
                fields: [
                    'id',
                    'title',
                    'code',
                    'description',
                    'publishedAt',
                    'archived',
                ]
            },
            candidates: {
                populate: {
                    socialNetwork: true,
                    source: true,
                    experience: true,
                    education: true,
                    tags: true,
                    referrals: true,
                    disqualifyReason: true,
                    photo: {
                        fields: [
                            'id',
                            'name',
                            'hash',
                            'alternativeText',
                            'width',
                            'height',
                            'ext',
                            'mime',
                            'size',
                            'folderPath',
                            'createdAt',
                            'updatedAt',
                        ],
                    },
                    resume: {
                        fields: [
                            'id',
                            'name',
                            'hash',
                            'alternativeText',
                            'width',
                            'height',
                            'ext',
                            'mime',
                            'size',
                            'folderPath',
                            'createdAt',
                            'updatedAt',
                        ],
                    },
                }
            },
            scheduler: {
                populate: {
                    user: {
                        fields: [
                            'id',
                            'email',
                            'firstName',
                            'lastName',
                            'timezone',
                        ],
                    },
                },
            },
            document: {
                populate: {
                    job: {
                        fields: [
                            'id',
                            'title',
                            'code',
                            'description',
                            'publishedAt',
                            'archived',
                        ]
                    },
                    candidate: {
                        fields: [
                            'id',
                            'email',
                            'firstName',
                            'lastName',
                        ],
                    },
                    files: {
                        fields: [
                            'id',
                            'name',
                            'hash',
                            'alternativeText',
                            'width',
                            'height',
                            'ext',
                            'mime',
                            'size',
                            'folderPath',
                            'createdAt',
                            'updatedAt',
                        ],
                    },
                    signers: {
                        fields: [
                            'id',
                            'candidate',
                            'email',
                            'name',
                            'position',
                            'comment',
                            'signed',
                            'signedAt',
                            'rejected',
                        ],
                    },
                }
            },
        }
        
        let result = await strapi.entityService.findMany(api, params);
        if(result.length == 0){ return null; }

        result = result[0];

        if(result.candidates?.length > 0){
            for(let i = 0; i < result.candidates.length; i++){
                result.candidates[i] = await strapi.service('api::candidate.candidate').formatData(result.candidates[i]);
            }
        }

        if(result.document?.files?.length > 0){
            for(let i = 0; i < result.document.files.length; i++){
                result.document.files[i].url = await strapi.service('api::s3.s3').signedUrl(`${result.document.files[i].hash}${result.document.files[i].ext}`, result.document.files[i].mime, 10 * 60);
                delete result.document.files[i].hash;
            }

        }

        result.url = await strapi.service(api).getUrl(result.company.domain, result.company.subdomain, result.code);
        
        return result;
    },
    async create(params) {
        const ctx = strapi.requestContext.get();
        const user = await strapi.service('api::user.user').me();

        params.data.company = user.company;
        params.data.expireDaysLinks = user.company.expireDaysLinks;
        
        const response = await strapi.service(api).generate(params);

        return response;
    },
    async generate(params) {
        let expireDaysLinks = (params.data?.expireDaysLinks) ? params.data.expireDaysLinks : 5;
        params.data.code = uuidv4();
        params.data.expireAt = moment(new Date()).add(expireDaysLinks, 'days').format();
        
        const response = await super.create({
            data: {
                company: params.data.company.id,
                email: params.data.email,
                job: (params.data.job) ? params.data.job : null,
                candidates: (params.data.candidates) ? params.data.candidates : null,
                code: params.data.code,
                type: params.data.type,
                scheduler: (params.data.document) ? params.data.document : null,
                document: (params.data.document) ? params.data.document : null,
                expireAt: params.data.expireAt,
            }
        });

        response.url = await strapi.service(api).getUrl(params.data.company.domain, params.data.company.subdomain, response.code);
        
        return response;
    },
    async update(entityId, params) {
        const ctx = strapi.requestContext.get();
        const user = await strapi.service('api::user.user').me();

        params.data.company = user.company;

        if(params.data.code){
            delete params.data.code;
        }
        
        const result = await strapi.service(api).findOne(entityId);
        if(!result){ return null; }

        const response = await super.update(entityId, params);

        response.url = await strapi.service(api).getUrl(user.company.domain, user.company.subdomain, response.code);
    
        return response;
    },
    async delete(entityId, params) {
        const user = await strapi.service('api::user.user').me();
        
        const result = await strapi.service(api).findOne(entityId);
        if(!result){ return null; }
        
        const response = await super.delete(entityId, params);

        response.url = await strapi.service(api).getUrl(user.company.domain, user.company.subdomain, response.code);

        return response;
    },
    async getUrl(domain, subdomain, code = null, type = 'link') {
        const companyUrl = (subdomain) ? `${domain}.${process.env.ATS_DOMAIN}` : domain;

        let link = "";
        switch (type){
            case 'link':
                link = `https://${companyUrl}/link?code=${code}`;
                break;
            case 'company':
                link = `https://${companyUrl}/`;
                break;
            case 'job':
                link = `https://${companyUrl}/job?code=${code}`;
                break;
        }

        return link;
    }
}));
