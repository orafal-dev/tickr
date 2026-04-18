import { NestFactory } from '@nestjs/core';
import { z } from 'zod';
import { AppModule } from './app.module';

/** Default when neither API_PORT nor PORT is set (avoids colliding with Next.js on 3000). */
const DEFAULT_PORT = 3001;

const listenPortSchema = z
  .object({
    API_PORT: z.string().optional(),
    PORT: z.string().optional(),
  })
  .transform((env) => {
    const raw = env.API_PORT ?? env.PORT;
    if (raw === undefined || raw === '') {
      return DEFAULT_PORT;
    }
    const parsed = Number(raw);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return DEFAULT_PORT;
    }
    return parsed;
  });

const parseListenPort = (): number =>
  listenPortSchema.parse({
    API_PORT: process.env.API_PORT,
    PORT: process.env.PORT,
  });

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(parseListenPort());
}
bootstrap();
