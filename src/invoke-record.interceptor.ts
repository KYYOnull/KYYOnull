import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { Response, Request } from 'express';


@Injectable() // 接口访问记录的 interceptor
export class InvokeRecordInterceptor implements NestInterceptor {

  private readonly logger = new Logger(InvokeRecordInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {

    const request= context.switchToHttp().getRequest<Request>();
    const response= context.switchToHttp().getResponse<Response>();

    const userAgent= request.headers['user-agent'];
    const {ip, method, path}= request; // express 才有这种属性

    // 记录访问的 ip、user agent
    // 请求的 controller、method，接口耗时、响应内容，当前登录用户等信息
    this.logger.debug(
      `${method} ${path} ${ip} ${userAgent}: ${
        context.getClass().name // 与请求本身无关 但真实使用到的controller handler
      } ${
        context.getHandler().name
      } invoked...`,
    ); 
    // POST /user/admin/login ::1 PostmanRuntime/7.37.3: 
    // UserController 
    // adminLogin 
    // invoked...
    this.logger.debug(
      `user: ${request.user?.userId}, ${request.user?.username}`
    );
    // user: undefined, undefined  登录时user当前还没有
    // user: 7, zhangsan 带着token访问时 token里都有了

    const now= Date.now();

    return next.handle().pipe( // 登录检验完成
      tap((res) => { // return时 再次log
        this.logger.debug(
          `${method} ${path} ${ip} ${userAgent}: ${response.statusCode}: ${Date.now() - now}ms`,
        );
        // POST /user/admin/login ::1 PostmanRuntime/7.37.3: 201: 76ms
        this.logger.debug(`Response: ${JSON.stringify(res)}`);
        // 未被改造的 response userInfo
      }),
    );

  }
}
