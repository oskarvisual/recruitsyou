module.exports = [
    'strapi::errors',
    {
        name: 'strapi::security',
        config: {
            contentSecurityPolicy: {
                useDefaults: true,
                directives: {
                    'connect-src': ["'self'", 'https:'],
                    'img-src': [
                        "'self'",
                        'data:',
                        'blob:',
                        'dl.airtable.com',
                        'higheredlab.com',
                        'res.cloudinary.com',
                        process.env.AWS_S3_CDN,
                        process.env.AWS_S3_ENDPOINT,
                    ],
                    'media-src': [
                        "'self'",
                        'data:',
                        'blob:',
                        'dl.airtable.com',
                        'higheredlab.com',
                        'res.cloudinary.com',
                        process.env.AWS_S3_CDN,
                        process.env.AWS_S3_ENDPOINT,
                    ],
                    upgradeInsecureRequests: null,
                },
            },
        },
    },
    'strapi::cors',
    {
        name: 'strapi::poweredBy',
        config: {
            poweredBy: process.env.ATS_NAME,
        },
    },
    'strapi::logger',
    'strapi::query',
    {
        name: "strapi::body",
        config: {
            includeUnparsed: true,
            formLimit: "20mb",
            jsonLimit: "20mb",
            textLimit: "20mb",
            formidable: {
                maxFileSize: 20 * 1024 * 1024,
            },
        },
    },
    'strapi::session',
    {
        name: 'strapi::favicon',
        config: {
            path: './public/assets/images/favicon.png'
        },
    },
    {
        name: 'strapi::public',
        config: {
            defer: false,
            defaultIndex: false,
            index: 'index.html',
        },
    },
];
