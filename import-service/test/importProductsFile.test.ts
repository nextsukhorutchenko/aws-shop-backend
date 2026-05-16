import { handler } from '../src/handlers/importProductsFile';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { mockClient } from 'aws-sdk-client-mock';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

// Need to mock getSignedUrl since it's from another module
jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn().mockResolvedValue('https://mocked-signed-url.com/uploaded/test.csv'),
}));

const s3Mock = mockClient(S3Client);

describe('importProductsFile', () => {
  beforeEach(() => {
    s3Mock.reset();
    process.env.BUCKET_NAME = 'mock-bucket';
  });

  it('should return 400 if name is not provided', async () => {
    const event = {
      queryStringParameters: {},
    } as unknown as APIGatewayProxyEvent;

    const result = await handler(event);

    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body)).toEqual({ message: 'Missing "name" query parameter' });
  });

  it('should return a signed URL when name is provided', async () => {
    const event = {
      queryStringParameters: {
        name: 'test.csv',
      },
    } as unknown as APIGatewayProxyEvent;

    const result = await handler(event);

    expect(result.statusCode).toBe(200);
    expect(result.body).toBe('https://mocked-signed-url.com/uploaded/test.csv');
  });

  it('should return 500 if an error occurs', async () => {
    const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
    getSignedUrl.mockRejectedValueOnce(new Error('Mocked error'));

    const event = {
      queryStringParameters: {
        name: 'test.csv',
      },
    } as unknown as APIGatewayProxyEvent;

    const result = await handler(event);

    expect(result.statusCode).toBe(500);
    expect(JSON.parse(result.body)).toEqual({ message: 'Internal server error' });
  });
});
