import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { Observable } from 'rxjs';
import { Permission } from './user/entities/permission.entity';
import { UnLoginException } from './unlogin.filter';

// LoginGuard 和 PermissionGuard 来做鉴权

// 这是一个 guard 逻辑 在interceptor 之前调用
// 此时 request 被改造 后序业务逻辑看到的request中 包含了 user: JwtUserData 字段

// request.user?.username request.user?.userId
interface JwtUserData {
  userId: number;
  username: string;
  email: string; // 从 jwt 取出 email 
  roles: string[];
  permissions: Permission[]
}

// user 被放入 express格式的 Request中
declare module 'express' {
  interface Request {
    user: JwtUserData
  }
}

@Injectable()
export class LoginGuard implements CanActivate {
  
  @Inject()
  private reflector: Reflector;
  @Inject(JwtService)
  private jwtSvc: JwtService;
  
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    
    const request: Request = context.switchToHttp().getRequest();
    
    // reflector 从 controller 上拿到 require-login 的 metadata
    const requireLogin = this.reflector.getAllAndOverride('require-login', [
      context.getClass(),
      context.getHandler()
    ]);

    if(!requireLogin) return true; // 没有 metadata是不需要登录 放行
    
    // 鉴权
    const authorization = request.headers.authorization;
    if(!authorization) throw new UnauthorizedException('用户未登录');

    // 登录可能已经失效
    try{
      const token = authorization.split(' ')[1]; // jwt access
      const data:JwtUserData = this.jwtSvc.verify<JwtUserData>(token); // 有效解码后的数据的类型

// 从 jwt 取出来放到 request.user  实现了request改造
      request.user = { // 用户信息设置到 request
        userId: data.userId,
        username: data.username,
        email: data.email, // 从 jwt 取出 email 
        roles: data.roles,
        permissions: data.permissions
      }

      return true; // 放行

    } catch(e) { //  jwt无效 verify异常
      // throw new UnauthorizedException('token 失效，请重新登录');
      throw new UnLoginException();
    }
  }
}