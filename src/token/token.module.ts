import { Global, Module } from '@nestjs/common';
import { TokenService } from './token.service';

@Global()
@Module({
  controllers: [],
  providers: [TokenService],

  exports: [TokenService]
})
export class TokenModule {}
