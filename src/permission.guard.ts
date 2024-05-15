import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

@Injectable()
export class PermissionGuard implements CanActivate {

  @Inject(Reflector)
  private reflector: Reflector;

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest();

    if(!request.user) {
      return true;
    }

    const permissions = request.user.permissions; // 持有权限

    // reflector 取controller 上的 require-permission 的 metadata
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>('require-permission', [
      context.getClass(),
      context.getHandler()
    ])
    
    if(!requiredPermissions) { // 如果没有，不需要权限，直接放行
      return true;
    }
    
    // 对于需要的每个权限，检查下用户是否拥有
    for(let i = 0; i < requiredPermissions.length; i++) {
      const curPermission = requiredPermissions[i]; // each required perm

      // 遍历持有权限 每个对比当前required perm
      const found = permissions.find(item => item.code === curPermission);
      if(!found) { // 其中任意一个找不到则认为无权
        throw new UnauthorizedException('您缺少访问该接口的权限');
      }
    }

    return true;
  }
}
