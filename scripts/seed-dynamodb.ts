import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { products } from "../src/mocks/products"; // Беремо ваші мокові дані

// Використовуємо дефолтний регіон з вашого AWS профілю
const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

// Створюємо запаси (stocks) для кожного продукту
const stocks = products.map((product) => ({
  product_id: product.id,
  count: Math.floor(Math.random() * 20) + 1, // Випадкова кількість від 1 до 20
}));

const seedDatabase = async () => {
  try {
    console.log("Починаємо заповнення таблиці 'products'...");
    for (const product of products) {
      await docClient.send(
        new PutCommand({
          TableName: "products",
          Item: product,
        })
      );
      console.log(`Додано продукт: ${product.title} (${product.id})`);
    }

    console.log("\nПочинаємо заповнення таблиці 'stocks'...");
    for (const stock of stocks) {
      await docClient.send(
        new PutCommand({
          TableName: "stocks",
          Item: stock,
        })
      );
      console.log(`Додано запас (${stock.count} шт) для продукту: ${stock.product_id}`);
    }

    console.log("\n✅ База даних успішно заповнена тестовими даними!");
  } catch (error) {
    console.error("❌ Помилка під час заповнення бази даних:", error);
  }
};

seedDatabase();
