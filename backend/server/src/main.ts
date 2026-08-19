import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import "dotenv/config";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: "*",
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
    allowedHeaders: "*",
  });

  const PORT = process.env.PORT || 5000;
  await app.listen(PORT);
  console.log(`[NestJS] AbleSpace API running on http://localhost:${PORT}`);
}
bootstrap();
