import { Inject, Injectable } from '@nestjs/common';
import { EmailService } from 'src/email/email.service';
import { RedisService } from 'src/redis/redis.service';

@Injectable()
export class CaptchaService {

    @Inject(RedisService)
    private redisSvc: RedisService;
    @Inject(EmailService)
    private emailSvc: EmailService;

    private captchaTypeMap = {
        register_captcha: '注册验证码',
        update_password_captcha: '更新密码验证码',
        update_userinfo_captcha: '更新用户信息验证码',
    };

    async sendCaptcha2Mail(captchaType: string, address: string) {

        const captchaCode = Math.random().toString().slice(2, 8);
        const subj: string = this.captchaTypeMap[captchaType];

        let expiration = 5 * 60; // update_userInfo_captcha_1102413882@qq.com
        await this.redisSvc.set(`${captchaType}_${address}`, captchaCode, expiration);

        // 发送邮件
        await this.emailSvc.sendMail({
            to: address,
            subject: subj, // 主题
            html: `<p>你的${subj}是${captchaCode}</p>`,
        })

        return `${subj}的验证码发送成功`;
    }
}
