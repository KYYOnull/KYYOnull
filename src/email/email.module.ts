import { Global, Module } from '@nestjs/common';
import { EmailService } from './email.service';

@Global() // EmailModule 声明为全局的，并且导出 EmailService
@Module({
  controllers: [],
  providers: [EmailService],
  
  exports: [EmailService]
})
export class EmailModule {}
