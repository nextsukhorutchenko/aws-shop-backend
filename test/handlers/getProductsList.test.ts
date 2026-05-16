import { handler } from '../../src/handlers/getProductsList';
import { products } from '../../src/mocks/products';

describe('getProductsList handler', () => {
    it('should return 200 and all products', async () => {
        const event = {} as any;
        const result = await handler(event);

        expect(result.statusCode).toBe(200);
        expect(JSON.parse(result.body)).toEqual(products);
    });
});
