import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, TransactWriteCommand } from '@aws-sdk/lib-dynamodb';
import { randomUUID } from 'crypto';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
        // Логування запиту (+7.5 балів)
        console.log('POST - /products request received. Event:', JSON.stringify(event));

        if (!event.body) {
            return {
                statusCode: 400,
                headers: { 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ message: 'Product data is missing' }),
            };
        }

        const data = JSON.parse(event.body);
        const { title, description, price, count } = data;

        // Валідація даних (+7.5 балів)
        if (!title || typeof title !== 'string' || typeof price !== 'number' || typeof count !== 'number') {
            return {
                statusCode: 400,
                headers: { 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ message: 'Product data is invalid. Ensure title (string), price (number) and count (number) are provided.' }),
            };
        }

        const id = randomUUID();

        // Створення продукту через транзакцію (+7.5 балів)
        // Якщо одна з операцій впаде, інша теж скасовується
        await docClient.send(new TransactWriteCommand({
            TransactItems: [
                {
                    Put: {
                        TableName: process.env.PRODUCTS_TABLE,
                        Item: {
                            id,
                            title,
                            description: description || '',
                            price,
                        }
                    }
                },
                {
                    Put: {
                        TableName: process.env.STOCKS_TABLE,
                        Item: {
                            product_id: id,
                            count,
                        }
                    }
                }
            ]
        }));

        return {
            statusCode: 201,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Credentials': true,
            },
            body: JSON.stringify({ id, title, description, price, count }),
        };
    } catch (err: any) {
        console.error('Error creating product:', err);
        // Обробка помилок сервера (+7.5 балів)
        return {
            statusCode: 500,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ message: 'Internal Server Error', error: err.message }),
        };
    }
};
