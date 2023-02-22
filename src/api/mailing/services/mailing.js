'use strict';

/**
 * mailing service
 */


const { curly } = require('node-libcurl')
const { Buffer } = require("node:buffer");

const mailjetAuth = Buffer.from(process.env.MJ_APIKEY_PUBLIC + ':' + process.env.MJ_APIKEY_PRIVATE, 'utf-8').toString('base64');

module.exports = {
    async addContact(firstName, email, list){
        const contactData = await curly.post('https://api.mailjet.com/v3/REST/contact', {
            postFields: JSON.stringify({ 
                IsExcludedFromCampaigns: 'false', 
                Name: firstName,
                Email: email
            }),
            httpHeader: [
                'Content-Type: application/json',
                'Accept: application/json',
                `Authorization: Basic ${mailjetAuth}`,
            ],
        });

        await curly.post('https://api.mailjet.com/v3/REST/listrecipient', {
            postFields: JSON.stringify({ 
                IsUnsubscribed: 'false', 
                ListID: list,
                ContactID: contactData.data.Data[0].ID
            }),
            httpHeader: [
                'Content-Type: application/json',
                'Accept: application/json',
                `Authorization: Basic ${mailjetAuth}`,
            ],
        });
    }
};
