import { Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './user/user.module';

import { User } from './user/entities/user.entity';
import { Role } from './user/entities/role.entity';
import { Permission } from './user/entities/permission.entity';

import { RedisModule } from './redis/redis.module';
import { EmailModule } from './email/email.module';
import { CaptchaModule } from './captcha/captcha.module';
import { TokenModule } from './token/token.module';


import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

import { APP_GUARD } from '@nestjs/core';
import { LoginGuard } from './login.guard';
import { PermissionGuard } from './permission.guard';
import { MeetingRoomModule } from './meeting-room/meeting-room.module';
import { MeetingRoom } from './meeting-room/entities/meeting-room.entity';
import { BookingModule } from './booking/booking.module';
import { Booking } from './booking/entities/booking.entity';
import { StatisticModule } from './statistic/statistic.module';
import * as path from 'path';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory(configSvc: ConfigService) {
        return {
          type: "mysql",
          host: configSvc.get('mysql_server_host'),
          port: configSvc.get('mysql_server_port'),
          username: configSvc.get('mysql_server_username'),
          password: configSvc.get('mysql_server_password'),
          database: configSvc.get('mysql_server_database'),
          synchronize: true,
          logging: true,
          entities: [User, Role, Permission, MeetingRoom, Booking],
          poolSize: 10,
          connectorPackage: 'mysql2',
          extra: { authPlugin: 'sha256_password',}
        } 
      },
      inject: [ConfigService],
    }),
    UserModule, RedisModule, EmailModule, 
    CaptchaModule, TokenModule, MeetingRoomModule,

    ConfigModule.forRoot({
      isGlobal: true,
      // envFilePath: 'src/.env', 
      // build 出来的代码没有 src 目录，是直接放在 dist 下
      envFilePath: path.join(__dirname, '.env'), 
    }),
    JwtModule.registerAsync({
      global: true,
      useFactory(configSvc: ConfigService){
        return {
          secret: configSvc.get('jwt_secret'),
          signOptions:{
            expiresIn: '30m' // 30 min
          }
        }
      },
      inject: [ConfigService],
    }),
    BookingModule,
    StatisticModule,

  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: LoginGuard, // 全局启用这个 Guard
    },
    {
      provide: APP_GUARD,
      useClass: PermissionGuard
    } 
  ],
})
export class AppModule {}
