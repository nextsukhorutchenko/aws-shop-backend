import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { products } from '../mocks/products';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
        console.log('GET - /products event:', event);

        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Credentials': true,
            },
            body: JSON.stringify(products),
        };
    } catch (err: any) {
        return {
            statusCode: 500,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ message: err.message }),
        };
    }
};
