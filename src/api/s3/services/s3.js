'use strict';

/**
 * s3 service
 */


const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { S3, GetObjectCommand } = require("@aws-sdk/client-s3");

const s3Client = new S3({
    signatureVersion: 'v4',
    forcePathStyle: false,
    endpoint: process.env.AWS_S3_URL_ENDPOINT,
    region: process.env.AWS_S3_REGION,
    Bucket: process.env.AWS_S3_BUCKET,
    credentials: {
        accessKeyId: process.env.AWS_S3_ACCESS_KEY,
        secretAccessKey: process.env.AWS_S3_SECRET_KEY,
    }
});

module.exports = {
    async SignedUrl(Key, ContentType, expiresIn) { 
        try {
            const command = new GetObjectCommand({
                Bucket: process.env.AWS_S3_BUCKET,
                Key: Key,
                ContentType: ContentType
            });

            const url = await getSignedUrl(s3Client, command, { expiresIn: expiresIn });
            return url;
        } catch (err) {
            console.log("Error", err);
        }
    }
}
