import { Controller, Get, Module } from '@nestjs/common';

class FrameworkController {
  status() {
    return {
      ok: true,
      framework: 'NestJS',
      service: 'knockout-api',
      architecture: 'single-process-multi-tenant',
    };
  }
}

Controller('api/framework')(FrameworkController);
Get()(FrameworkController.prototype, 'status', Object.getOwnPropertyDescriptor(FrameworkController.prototype, 'status'));

class AppModule {}
Module({ controllers: [FrameworkController] })(AppModule);

export { AppModule };
