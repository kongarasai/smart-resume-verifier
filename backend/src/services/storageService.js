const fs = require('fs');
const path = require('path');
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const logger = require('../utils/logger');

const STORAGE_TYPE = process.env.STORAGE_TYPE || 'local';

let s3Client;
if (STORAGE_TYPE === 's3') {
  s3Client = new S3Client({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });
}

const uploadFile = async (file, subdir = 'general') => {
  if (STORAGE_TYPE === 's3') {
    const key = `${subdir}/${Date.now()}-${file.originalname}`;
    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key,
      Body: file.buffer || fs.readFileSync(file.path),
      ContentType: file.mimetype,
    });

    try {
      await s3Client.send(command);
      logger.info(`Uploaded file to S3: ${key}`);
      return `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
    } catch (err) {
      logger.error(`S3 Upload failed: ${err.message}`);
      throw err;
    }
  } else {
    // Local fallback
    const backendUrl = process.env.BACKEND_URL || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5000');
    return `${backendUrl}/uploads/${subdir}/${file.filename}`;
  }
};

const getPresignedUrl = async (key) => {
  if (STORAGE_TYPE !== 's3') return null;
  const command = new PutObjectCommand({ Bucket: process.env.S3_BUCKET_NAME, Key: key });
  return getSignedUrl(s3Client, command, { expiresIn: 3600 });
};

const deleteFile = async (fileUrl) => {
  try {
    if (STORAGE_TYPE === 's3') {
      const key = fileUrl.split('.com/')[1];
      const command = new DeleteObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: key,
      });
      await s3Client.send(command);
    } else {
      const filename = fileUrl.split('/').pop();
      const subdir = fileUrl.split('/').slice(-2, -1)[0];
      const filePath = path.join(__dirname, '../../uploads', subdir, filename);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
  } catch (err) {
    logger.error(`File deletion failed: ${err.message}`);
  }
};

module.exports = {
  uploadFile,
  getPresignedUrl,
  deleteFile
};
