import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from './app.module.js';

export async function createNestApplication(expressInstance, serviceName) {
  const application = await NestFactory.create(
    AppModule,
    new ExpressAdapter(expressInstance),
    {
      bodyParser: false,
      logger: ['log', 'error', 'warn'],
    },
  );
  const instance = application.getHttpAdapter().getInstance();
  instance.disable('x-powered-by');
  instance.locals.nestService = serviceName;
  return application;
}
