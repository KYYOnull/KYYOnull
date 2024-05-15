import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';
import { LoginUserVo } from './user/vo/login-user.vo';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, ParseIntPipe } from '@nestjs/common';

// 用 node 内置的 crypto 包实现 md5
function md5(str: string): string {
    const hash = crypto.createHash('md5');
    hash.update(str);
    return hash.digest('hex');
}

// 把email 签入到jwt
function jwtSign(jwtSvc: JwtService, configSvc: ConfigService, userVo: LoginUserVo): LoginUserVo {

    const accessToken: string = jwtSvc.sign({
        userId: userVo.userInfo.id,
        username: userVo.userInfo.username,
        email: userVo.userInfo.email, 
// 登录后把邮箱也签入到jwt中 用户修改邮箱时无需传现有邮箱 从LoginGuard 取出来注入 controller
        roles: userVo.userInfo.roles,
        permissions: userVo.userInfo.permissions
    }, { expiresIn: configSvc.get('jwt_access_token_expires_time') || '30m' });

    const refreshToken: string = jwtSvc.sign({
        userId: userVo.userInfo.id
    }, { expiresIn: configSvc.get('jwt_refresh_token_expres_time') || '7d' });

    userVo.accessToken = accessToken;
    userVo.refreshToken = refreshToken;
    return userVo;
}

function generateParseIntPipe(param: string) {
    return new ParseIntPipe({
        exceptionFactory() {
            throw new BadRequestException(param + ' 应该传数字');
        }
    })
}

export { md5, jwtSign, generateParseIntPipe };