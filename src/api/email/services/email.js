'use strict';

/**
 * email service
 */
//TODO: SERVICIO PARA ENVIAR CORREOS POR PLANTILLA, SI SON MAS DE UN CORREO SEPERARLOS EN VARIOS, ETC
const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::email.email');
