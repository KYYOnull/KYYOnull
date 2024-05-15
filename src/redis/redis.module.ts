import { Global, Module } from '@nestjs/common';
import { RedisService } from './redis.service';
import { createClient } from 'redis';
import { ConfigService } from '@nestjs/config';

// 用 @Global() 声明为全局模块
// 这样只需要在 AppModule 引入，别的模块不用引入也注入 RedisService 
@Global()
@Module({
  providers: [
    RedisService,
    {
      provide: 'REDIS_CLIENT',
      async useFactory(configsVC: ConfigService) {
        // 加载 config
        const redisHost= configsVC.get('redis_server_host');
        const redisPort= configsVC.get('redis_server_port');

        const client = createClient({
            socket: {
                host: redisHost,
                port: redisPort,
            },
            database: configsVC.get('redis_server_db') 
            // redis 的 database 就是一个命名空间 随便指定
        });
        await client.connect();
        return client;
      },
      inject: [ConfigService]
    }
  ],
  exports: [RedisService]
})
export class RedisModule {}
