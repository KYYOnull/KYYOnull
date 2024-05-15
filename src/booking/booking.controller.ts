import { Controller, Get, Post, Body, Patch, Param, Delete, Query, DefaultValuePipe, Request } from '@nestjs/common';
import { BookingService } from './booking.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { generateParseIntPipe } from 'src/utils';
import { UserInfo } from 'src/custom.decorator';

@Controller('booking')
export class BookingController {
  constructor(private readonly bookingService: BookingService) { }

  @Get('list') // 查询预定
  async list( // 传入分页参数、搜索参数
    @Query('pageNo', new DefaultValuePipe(1), generateParseIntPipe('pageNo')) pageNo: number,
    @Query('pageSize', new DefaultValuePipe(10), generateParseIntPipe('pageSize')) pageSize: number,
    @Query('username') username: string,
    @Query('meetingRoomName') meetingRoomName: string,
    @Query('meetingRoomPosition') meetingRoomPosition: string,
    @Query('bookingTimeRangeStart') bookingTimeRangeStart: number,
    @Query('bookingTimeRangeEnd') bookingTimeRangeEnd: number,
  ) {
    return this.bookingService.find(pageNo, pageSize, username, meetingRoomName, meetingRoomPosition, bookingTimeRangeStart, bookingTimeRangeEnd);
  }

  @Post('add') // 前端预定时 自带userid + 表单
  async add(@Body() booking: CreateBookingDto, @UserInfo('userId') userId: number) {
    await this.bookingService.add(booking, userId);
    return 'success'
  }

  // admin 修改预定状态的三个接口 通过、驳回、解除
  @Get(["apply/:id", "reject/:id", "unbind/:id"])
  async apply(@Param('id') id: number, @Request() req) {
    const ops: string = req.path.split('/').pop().pop();
    console.log(ops);
    return this.bookingService.ops(id, ops);
  }

  @Get('urge/:id') // user 催办 使用redis+email
  async urge(@Param('id') id: number) {
      return this.bookingService.urge(id);
  }
  

}
