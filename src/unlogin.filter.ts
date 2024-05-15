import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import { Response } from 'express';

@Catch() // 自定义 UnLoginException 
export class UnLoginException{

  message: string;
  constructor(message?){this.message = message;}

}

@Catch(UnLoginException)
export class UnloginFilter implements ExceptionFilter {
  catch(exception: UnLoginException, host: ArgumentsHost) {
    
    const response = host.switchToHttp().getResponse<Response>();

    response.json({ // 统一格式
      code: HttpStatus.UNAUTHORIZED,
      message: 'fail',
      data: exception.message || '用户没有登录'
    }).end();
  }
}