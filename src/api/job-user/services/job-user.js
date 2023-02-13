'use strict';

/**
 * job-user service
 */
//TODO: CUANDO AGREGA USUARIO PRIMERO FILTRA SI YA EXISTE Y SI LO HACE DEVELVE LA CONSULTA Y NO LO VUELVE A AGREGAR
//TODO: NO PUEDE ELIMINARLO SI ES OWNER
const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::job-user.job-user');
