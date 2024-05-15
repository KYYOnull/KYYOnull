import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/user/user.service';
import { LoginUserVo } from 'src/user/vo/login-user.vo';
import { RefreshTokenVo } from 'src/user/vo/refresh-token.vo';
import { jwtSign } from 'src/utils';

@Injectable()
export class TokenService {

    @Inject(UserService)
    private userSvc: UserService;
    @Inject(JwtService)
    private jwtSvc: JwtService;
    @Inject(ConfigService)
    private configSvc: ConfigService;

    // 基于userVo 签发access + refresh
    jwtSign2Vo(userVo: LoginUserVo) :LoginUserVo{
        userVo= jwtSign(this.jwtSvc, this.configSvc, userVo);
        return userVo;
    }

    async refresh(refreshToken:string, isAdmin:boolean) :Promise<RefreshTokenVo>{
        try {
            const data = this.jwtSvc.verify(refreshToken); 
            let userVo: LoginUserVo = await this.userSvc.findUserById(data.userId, isAdmin);
            const vo: RefreshTokenVo = new RefreshTokenVo();

            userVo= this.jwtSign2Vo(userVo);
            vo.access_token = userVo.accessToken;
            vo.refresh_token = userVo.refreshToken;

            return vo;

        } catch (e) { throw new UnauthorizedException('token 失效，请重新登录'); }
    }


}
