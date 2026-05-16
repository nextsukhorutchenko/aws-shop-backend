import { handler } from '../src/handlers/importFileParser';
import { S3Event } from 'aws-lambda';
import { mockClient } from 'aws-sdk-client-mock';
import { S3Client, GetObjectCommand, CopyObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';

const s3Mock = mockClient(S3Client);

describe('importFileParser', () => {
  beforeEach(() => {
    s3Mock.reset();
  });

  it('should process S3 event, parse CSV and move file', async () => {
    const event: S3Event = {
      Records: [
        {
          s3: {
            bucket: { name: 'mock-bucket' },
            object: { key: 'uploaded/test.csv' },
          },
        },
      ],
    } as any;

    const mockCsvContent = 'id,title\n1,Product One\n2,Product Two';
    const stream = new Readable();
    stream.push(mockCsvContent);
    stream.push(null);

    s3Mock.on(GetObjectCommand).resolves({
      Body: stream as any,
    });

    s3Mock.on(CopyObjectCommand).resolves({});
    s3Mock.on(DeleteObjectCommand).resolves({});

    await handler(event);

    expect(s3Mock.calls()).toHaveLength(3);
    
    const getObjectCalls = s3Mock.commandCalls(GetObjectCommand);
    expect(getObjectCalls[0].args[0].input).toEqual({
      Bucket: 'mock-bucket',
      Key: 'uploaded/test.csv',
    });

    const copyObjectCalls = s3Mock.commandCalls(CopyObjectCommand);
    expect(copyObjectCalls[0].args[0].input).toEqual({
      Bucket: 'mock-bucket',
      CopySource: 'mock-bucket/uploaded/test.csv',
      Key: 'parsed/test.csv',
    });

    const deleteObjectCalls = s3Mock.commandCalls(DeleteObjectCommand);
    expect(deleteObjectCalls[0].args[0].input).toEqual({
      Bucket: 'mock-bucket',
      Key: 'uploaded/test.csv',
    });
  });
});
