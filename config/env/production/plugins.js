module.exports = ({ env }) => ({
    email: {
        config: {
            provider: 'amazon-ses',
            providerOptions: {
                key: env('AWS_SES_KEY'),
                secret: env('AWS_SES_SECRET'),
                amazon: env('AWS_SES_URL'),
            },
            settings: {
                defaultFrom: env('AWS_SES_FROM'),
                defaultReplyTo: env('AWS_SES_FROM'),
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
                sizeLimit: 20 * 1024 * 1024,
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
  