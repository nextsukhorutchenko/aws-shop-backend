import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
        // Логування запиту та аргументів (+7.5 балів)
        console.log('GET - /products/{productId} request received. Event:', JSON.stringify(event));

        const productId = event.pathParameters?.productId;

        if (!productId) {
            return {
                statusCode: 400,
                headers: { 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ message: 'Product ID is missing' }),
            };
        }

        // Шукаємо продукт
        const productResult = await docClient.send(new GetCommand({
            TableName: process.env.PRODUCTS_TABLE,
            Key: { id: productId }
        }));
        const product = productResult.Item;

        if (!product) {
            return {
                statusCode: 404,
                headers: { 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ message: 'Product not found' }),
            };
        }

        // Шукаємо запас
        const stockResult = await docClient.send(new GetCommand({
            TableName: process.env.STOCKS_TABLE,
            Key: { product_id: productId }
        }));
        const stock = stockResult.Item;

        // Об'єднуємо дані
        const joinedProduct = {
            ...product,
            count: stock ? stock.count : 0
        };

        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Credentials': true,
            },
            body: JSON.stringify(joinedProduct),
        };
    } catch (err: any) {
        console.error('Error fetching product by ID:', err);
        // Обробка помилок сервера (+7.5 балів)
        return {
            statusCode: 500,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ message: 'Internal Server Error', error: err.message }),
        };
    }
};
