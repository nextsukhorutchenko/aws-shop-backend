import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { products } from '../mocks/products';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
        console.log('GET - /products/{productId} event:', event);

        const { productId } = event.pathParameters || {};
        const product = products.find((p) => p.id === productId);

        if (!product) {
            return {
                statusCode: 404,
                headers: { 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ message: 'Product not found' }),
            };
        }

        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Credentials': true,
            },
            body: JSON.stringify(product),
        };
    } catch (err: any) {
        return {
            statusCode: 500,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ message: err.message }),
        };
    }
};
