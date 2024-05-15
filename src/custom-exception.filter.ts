import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';

@Catch(HttpException) // @Catch 指定 HttpException，修改返回的响应格式
export class CustomExceptionFilter implements ExceptionFilter {

  catch(exception: HttpException, host: ArgumentsHost) {

    const response = host.switchToHttp().getResponse<Response>();
    response.statusCode = exception.getStatus();

    response.json({
      code: exception.getStatus(),
      message: 'fail',
      data: exception.message // 封装异常内容
    }).end();

  }
}
