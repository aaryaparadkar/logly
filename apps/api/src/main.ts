import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: {
      origin: [
        "https://logly.aaryaparadkar.in",
        "http://localhost:3000",
        "http://localhost:3001",
      ],
      credentials: true,
    },
  });

  const port = process.env.PORT || 3001;

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.setGlobalPrefix("api");

  const document = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle("Logly API")
      .setDescription("AI-Powered Changelog Generator API")
      .setVersion("1.0")
      .addBearerAuth()
      .build(),
  );
  SwaggerModule.setup("api/docs", app, document);

  await app.listen(port);
  console.log(`🚀 API running on port ${port}`);
}
bootstrap();
