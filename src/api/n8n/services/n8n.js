'use strict';

/**
 * n8n service
 */

module.exports = {
    async webhook(url, body, method = 'POST') {  
        var myHeaders = new Headers();
        myHeaders.append('Accept', 'application/json');
        myHeaders.append('Content-Type', 'application/json');
        myHeaders.append('Ats-Name', process.env.ATS_NAME);
        myHeaders.append('Ats-Url', process.env.ATS_URL);
        myHeaders.append('Ats-Support-Url', process.env.ATS_SUPOORT_URL);
        myHeaders.append('Ats-Documentation-Url', process.env.ATS_API_DOCUMENTATION_URL);
        myHeaders.append('Ats-Trials-Days', process.env.ATS_TRIAL_DAYS);
        myHeaders.append('Authorization', `Bearer ${process.env.N8N_HEADER_TOKEN}`);

        const n8nSetup = await fetch(url, {
            method: method,
            headers: myHeaders,
            body: JSON.stringify(body),
        });

        const n8nResult = await n8nSetup.json();

        return n8nResult;
    }
}
