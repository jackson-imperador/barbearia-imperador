import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import helmet from '@fastify/helmet';
import compression from '@fastify/compress';
import fastifyCookie from '@fastify/cookie';
import { AppModule } from './app.module';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';

import fmp from '@fastify/multipart';

async function bootstrap() {
  const adapter = new FastifyAdapter();

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    adapter,
  );

  const fastifyInstance = app.getHttpAdapter().getInstance();
  fastifyInstance.addHook('onRequest', (request, reply, done) => {
    console.log('Incoming request:', request.method, request.url, request.headers['content-type']);
    done();
  });
  fastifyInstance.addHook('onError', (request, reply, error, done) => {
    console.log('Fastify Error:', error.statusCode, error.message);
    done();
  });

  await app.register(fmp as any, {
    limits: {
      fileSize: 2 * 1024 * 1024 * 1024 // 2GB — suporta vídeos longos de cursos
    }
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3001);
  const corsOrigin = configService.get<string>('CORS_ORIGIN', 'http://localhost:3000').split(',');

  // Security headers
  await app.register(helmet as any, {
    crossOriginResourcePolicy: { policy: "cross-origin" }
  });
  
  // Compression
  await app.register(compression as any, { encodings: ['gzip', 'deflate'] });

  // CORS
  app.enableCors({
    origin: true,
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  });

  // Cookies
  await app.register(fastifyCookie as any, {
    secret: configService.get<string>('COOKIE_SECRET', 'my-super-secret-cookie-key'),
  });

  // Serve uploads via fastify hook
  const fs = require('fs');
  const pathModule = require('path');
  fastifyInstance.get('/uploads/*', async (req: any, reply: any) => {
    const filePath = pathModule.join(process.cwd(), 'uploads', req.params['*']);
    if (!fs.existsSync(filePath)) {
      return reply.status(404).send({ message: 'File not found' });
    }
    const ext = pathModule.extname(filePath).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
      '.webp': 'image/webp', '.gif': 'image/gif', '.pdf': 'application/pdf',
      '.mp4': 'video/mp4', '.mov': 'video/quicktime', '.avi': 'video/x-msvideo',
      '.mkv': 'video/x-matroska', '.webm': 'video/webm', '.flv': 'video/x-flv',
      '.wmv': 'video/x-ms-wmv'
    };

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      
      if (start >= fileSize) {
        reply.status(416).header('Content-Range', `bytes */${fileSize}`);
        return reply.send();
      }

      const chunksize = (end - start) + 1;
      const file = fs.createReadStream(filePath, { start, end });
      
      reply.status(206);
      reply.header('Content-Range', `bytes ${start}-${end}/${fileSize}`);
      reply.header('Accept-Ranges', 'bytes');
      reply.header('Content-Length', chunksize);
      reply.header('Content-Type', contentType);
      return reply.send(file);
    } else {
      reply.header('Content-Length', fileSize);
      reply.header('Content-Type', contentType);
      reply.header('Accept-Ranges', 'bytes');
      reply.header('Cache-Control', 'public, max-age=31536000');
      return reply.send(fs.createReadStream(filePath));
    }
  });

  // Global Interceptor for uniform responses
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Graceful shutdown
  app.enableShutdownHooks();

  await app.listen(port, '0.0.0.0');
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();

