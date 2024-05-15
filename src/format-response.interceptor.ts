import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { map, Observable } from 'rxjs';
import { Response }  from 'express';

@Injectable() // 修改响应内容的拦截器 响应的格式改成 {code、message、data} 
export class FormatResponseInterceptor implements NestInterceptor {

  // 拦截逻辑
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {

    // 获取到当前请求的 Response 对象
    const response= context.switchToHttp().getResponse<Response>();

    // 调用下一个处理程序 用map改造调用结果
    return next.handle().pipe(map(
      data=>{
        return {
          code: response.statusCode,
          message: 'success',
          data, // 'bbb'
        }
      }
    ));
  }
}
