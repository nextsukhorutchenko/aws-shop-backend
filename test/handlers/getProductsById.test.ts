import { handler } from '../../src/handlers/getProductsById';

describe('getProductsById handler', () => {
    it('should return 200 and the product if found', async () => {
        const event = {
            pathParameters: { productId: '7567ec4b-b10c-48c5-9345-fc73c48a80a0' }
        } as any;
        const result = await handler(event);

        expect(result.statusCode).toBe(200);
        expect(JSON.parse(result.body).title).toBe('Product 1');
    });

    it('should return 404 if product is not found', async () => {
        const event = {
            pathParameters: { productId: 'non-existing-id' }
        } as any;
        const result = await handler(event);

        expect(result.statusCode).toBe(404);
        expect(JSON.parse(result.body).message).toBe('Product not found');
    });
});
