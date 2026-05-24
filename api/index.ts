import express, { type Request, type Response } from 'express';
import { ExpressAdapter } from '@nestjs/platform-express';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/config/app-bootstrap';

const expressServer = express();
let appReady: Promise<void> | undefined;

async function bootstrapServer() {
  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(expressServer),
  );

  configureApp(app);
  await app.init();
}

export default async function handler(req: Request, res: Response) {
  appReady ??= bootstrapServer();
  await appReady;

  return expressServer(req, res);
}
