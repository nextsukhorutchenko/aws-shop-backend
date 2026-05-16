import { S3Event } from 'aws-lambda';
import { S3Client, GetObjectCommand, CopyObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import csvParser from 'csv-parser';
import { Readable } from 'stream';

const s3Client = new S3Client({ region: process.env.AWS_REGION || 'eu-west-1' });

export const handler = async (event: S3Event): Promise<void> => {
  console.log('Incoming S3 event:', JSON.stringify(event));

  for (const record of event.Records) {
    const bucketName = record.s3.bucket.name;
    const objectKey = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));

    console.log(`Processing file: ${objectKey} from bucket: ${bucketName}`);

    try {
      const getObjectParams = {
        Bucket: bucketName,
        Key: objectKey,
      };

      const getObjectCommand = new GetObjectCommand(getObjectParams);
      const response = await s3Client.send(getObjectCommand);

      if (!response.Body) {
        throw new Error('S3 object body is empty');
      }

      const stream = response.Body as Readable;

      await new Promise<void>((resolve, reject) => {
        stream
          .pipe(csvParser())
          .on('data', (data) => {
            console.log('Parsed record:', data);
          })
          .on('error', (error) => {
            console.error('Error parsing CSV:', error);
            reject(error);
          })
          .on('end', async () => {
            console.log(`Finished parsing CSV file: ${objectKey}`);
            resolve();
          });
      });

      // Move file to 'parsed' folder
      const parsedKey = objectKey.replace('uploaded/', 'parsed/');

      console.log(`Moving file from ${objectKey} to ${parsedKey}`);

      const copyCommand = new CopyObjectCommand({
        Bucket: bucketName,
        CopySource: `${bucketName}/${objectKey}`,
        Key: parsedKey,
      });

      await s3Client.send(copyCommand);
      console.log(`File copied to ${parsedKey}`);

      const deleteCommand = new DeleteObjectCommand({
        Bucket: bucketName,
        Key: objectKey,
      });

      await s3Client.send(deleteCommand);
      console.log(`File deleted from ${objectKey}`);
    } catch (error) {
      console.error('Error processing S3 event:', error);
    }
  }
};
