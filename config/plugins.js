module.exports = ({ env }) => ({
    email: {
        config: {
            provider: 'strapi-provider-email-smtp',
            providerOptions: {
                host: env('SMTP_HOST'),
                port: env.int('SMTP_PORT'), 
                secure: env.bool('SMTP_SECURE'),
                username: env('SMTP_USER'),
                password: env('SMTP_PASSWORD'),
                rejectUnauthorized: true,
                requireTLS: env.bool('SMTP_TLS'),
                connectionTimeout: 30,
            },
            settings: {
                defaultFrom: env('SMTP_FROM'),
                defaultReplyTo: env('SMTP_FROM'),
            },
        }, 
    },
    upload: {
        config: {
            provider: 'aws-s3',
            providerOptions: {
                accessKeyId: env('AWS_S3_ACCESS_KEY'),
                secretAccessKey: env('AWS_S3_SECRET_KEY'),
                endpoint: env('AWS_S3_ENDPOINT'),
                params: {
                    Bucket: env('AWS_S3_BUCKET'),
                },
                sizeLimit: 10 * 1024 * 1024,
            },
            actionOptions: {
                upload: {},
                uploadStream: {},
                delete: {},
            },
        }
    }, 
    'users-permissions': {
        config: {
            jwt: {
                expiresIn: '7d',
            },
        },
    },  
    'strapi-plugin-populate-deep': {
        config: {
            defaultDepth: 10,
        }
    },
    'transformer': {
        enabled: true,
        config: {
            responseTransforms: {
                removeAttributesKey: true,
                removeDataKey: false,
            },
            requestTransforms : {
                wrapBodyWithDataKey: true
            },
        }
    },
  });
  