import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { Between, EntityManager, LessThanOrEqual, Like, MoreThanOrEqual } from 'typeorm';
import { InjectEntityManager } from '@nestjs/typeorm';
import { Booking } from './entities/booking.entity';
import { MeetingRoom } from 'src/meeting-room/entities/meeting-room.entity';
import { User } from 'src/user/entities/user.entity';
import { RedisService } from 'src/redis/redis.service';
import { EmailService } from 'src/email/email.service';

@Injectable()
export class BookingService {

  private opsDict = {
    apply: '审批通过',
    reject: '审批驳回',
    unbind: '已解除'
  }

  @InjectEntityManager()
  private entityManager: EntityManager;

  @Inject(RedisService)
  private redisService: RedisService;

  @Inject(EmailService)
  private emailService: EmailService;

  async find(pageNo: number, pageSize: number, username: string, meetingRoomName: string, meetingRoomPosition: string, bookingTimeRangeStart: number, bookingTimeRangeEnd: number) {
    const skipCount = (pageNo - 1) * pageSize;
    const condition: Record<string, any> = {}; // 如果传入了，就加到 condition 上
    if (username) {
      condition.user = {
        username: Like(`%${username}%`)
      }
    }
    if (meetingRoomName) {
      condition.room = {
        name: Like(`%${meetingRoomName}%`)
      }
    }
    if (meetingRoomPosition) {
      if (!condition.room) {
        condition.room = {}
      }
      condition.room.location = Like(`%${meetingRoomPosition}%`)
    }
    if (bookingTimeRangeStart) {
      if (!bookingTimeRangeEnd) {
        bookingTimeRangeEnd = bookingTimeRangeStart + 60 * 60 * 1000
      }
      condition.startTime = Between(new Date(bookingTimeRangeStart), new Date(bookingTimeRangeEnd))
    }

    const [bookings, totalCount] = await this.entityManager.findAndCount(Booking, {
      where: condition,
      relations: {
        user: true,
        room: true,
      },
      skip: skipCount,
      take: pageSize
    });

    return {
      bookings: bookings.map(item => {
        delete item.user.password;
        return item; // booking user without password
      }),
      totalCount
    }
  }

  // 预定
  async add(bookingDto: CreateBookingDto, userId: number) {
    // id 查询会议室
    const meetingRoom = await this.entityManager.findOneBy(MeetingRoom, { id: bookingDto.meetingRoomId });

    if (!meetingRoom) throw new BadRequestException('会议室不存在');

    // id 查询预定发起人
    const user = await this.entityManager.findOneBy(User, { id: userId });

    const booking = new Booking(); // 建立关联
    booking.room = meetingRoom;
    booking.user = user;
    booking.startTime = new Date(bookingDto.startTime);
    booking.endTime = new Date(bookingDto.endTime);

    // 查询已经预定的记录里 有没有包含这段时间
    const res = await this.entityManager.findOneBy(Booking, {
      room: {
        id: meetingRoom.id
      },
      startTime: LessThanOrEqual(booking.startTime), // <= start
      endTime: MoreThanOrEqual(booking.endTime) // >= end
    });

    if (res) throw new BadRequestException('该时间段已被预定');

    // 正常预定
    await this.entityManager.save(Booking, booking);
  }

  async ops(id: number, ops: string) {
    await this.entityManager.update(Booking, { id }, { status: this.opsDict[ops] });
    return 'success'
  }

  async urge(id: number) {
    const flag = await this.redisService.get('urge_' + id);
    if(flag) return '半小时内只能催办一次，请耐心等待';

    let email = await this.redisService.get('admin_email');
    if(!email) { 
      const admin = await this.entityManager.findOne(User, {
        select: {
          email: true // 只要邮箱
        },
        where: {
          isAdmin: true
        }
      });
      email = admin.email
      this.redisService.set('admin_email', admin.email);
    }

    this.emailService.sendMail({ // 发催办邮件
      to: email,
      subject: '预定申请催办提醒',
      html: `id 为 ${id} 的预定申请正在等待审批`
    });
    
    this.redisService.set('urge_' + id, 1, 60 * 30);
}


  async initData() {
    // entity-dao
    const user1: User = await this.entityManager.findOneBy(User, { id: 1 });
    const user2 = await this.entityManager.findOneBy(User, { id: 2 });
    const room1: MeetingRoom = await this.entityManager.findOneBy(MeetingRoom, { id: 4 });
    const room2 = await this.entityManager.findOneBy(MeetingRoom, { id: 6 }); // 146

    const booking1 = new Booking();
    booking1.room = room1;
    booking1.user = user1;
    booking1.startTime = new Date();
    booking1.endTime = new Date(Date.now() + 1000 * 60 * 60); // 1h

    await this.entityManager.save(Booking, booking1);

    const booking2 = new Booking();
    booking2.room = room2;
    booking2.user = user2;
    booking2.startTime = new Date();
    booking2.endTime = new Date(Date.now() + 1000 * 60 * 60);

    await this.entityManager.save(Booking, booking2);

    const booking3 = new Booking();
    booking3.room = room1;
    booking3.user = user2;
    booking3.startTime = new Date();
    booking3.endTime = new Date(Date.now() + 1000 * 60 * 60);

    await this.entityManager.save(Booking, booking3);

    const booking4 = new Booking();
    booking4.room = room2;
    booking4.user = user1;
    booking4.startTime = new Date();
    booking4.endTime = new Date(Date.now() + 1000 * 60 * 60);

    await this.entityManager.save(Booking, booking4);
  }

}
