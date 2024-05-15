import { Module } from '@nestjs/common';
import { MeetingRoomService } from './meeting-room.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MeetingRoom } from './entities/meeting-room.entity';
import { MeetingRoomController } from './meeting-room.controller';


@Module({
  imports:[ //  引入 MeetingRoom 的 Repository
    TypeOrmModule.forFeature([MeetingRoom])
  ],
  controllers: [MeetingRoomController],
  providers: [MeetingRoomService],
})
export class MeetingRoomModule {}
