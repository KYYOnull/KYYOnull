import { Global, Module } from '@nestjs/common';
import { CaptchaService } from './captcha.service';

@Global()
@Module({
  controllers: [],
  providers: [CaptchaService],

  exports: [CaptchaService] // 新模块 必须global 并导出service 给其他服务使用
})
export class CaptchaModule {}
