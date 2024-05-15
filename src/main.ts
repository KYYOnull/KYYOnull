import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FormatResponseInterceptor } from './format-response.interceptor';
import { InvokeRecordInterceptor } from './invoke-record.interceptor';
import { UnloginFilter } from './unlogin.filter';
import { CustomExceptionFilter } from './custom-exception.filter';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  // 静态资源要配特定平台的专用方法
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useStaticAssets('uploads', {
    prefix: '/uploads'
  }); // 通过 /uploads 的前缀访问静态


  // 对请求体做校验
  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalInterceptors(new FormatResponseInterceptor()); // 启用
  app.useGlobalInterceptors(new InvokeRecordInterceptor()); // 启用
  app.useGlobalFilters(new UnloginFilter()); // 启用过滤器
  app.useGlobalFilters(new CustomExceptionFilter());

  app.enableCors(); // 跨域支持

  // 用 SwaggerModule 生成接口文档，url 是 /api-doc
  const config = new DocumentBuilder()
    .setTitle('会议室预订系统')
    .setDescription('api 接口文档')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-doc', app, document);


  const configSvc = app.get(ConfigService);
  await app.listen(configSvc.get('nest_server_port')); // 8001
}
bootstrap();
