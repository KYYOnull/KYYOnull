import { Global, Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';

@Global()
@Module({
  imports: [ // 注入 Repository 在 UserModule 里引入 TypeOrm.forFeature
    TypeOrmModule.forFeature([
      User, Role, Permission
    ]) // 在 UserService 注入 Role 和 Permission 的 Repository
  ],
  controllers: [UserController],
  providers: [UserService],

  exports: [UserService]
})
export class UserModule {}
