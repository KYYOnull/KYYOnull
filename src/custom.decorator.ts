
// 把这两个 @SetMetadata 封装成自定义装饰器

import { createParamDecorator, ExecutionContext, SetMetadata } from "@nestjs/common";
import { Request } from "express";


// @RequireLogin()
const RequireLogin = () => SetMetadata('require-login', true); // 替换

// @RequirePermission('ddd')
const RequirePermission = (...permissions: string[]) => SetMetadata('require-permission', permissions);

// @UserInfo 参数装饰器  取 user 信息传入 handler
export const UserInfo = createParamDecorator(

    (data: string, ctx: ExecutionContext) => {
        // 获取当前请求的 Request 对象
        const request = ctx.switchToHttp().getRequest<Request>();

// 只有加了 login guard 才有 user
        if (!request.user)return null;
        return data ? request.user[data] : request.user; // 两种情况

        // Request 有个 user 结构为：
        // interface JwtUserData {
        //     userId: number;
        //     username: string;
        //     email: string; // 从 jwt 取出 email 
        //     roles: string[];
        //     permissions: Permission[]
        // }
    },
);

export {RequireLogin, RequirePermission};