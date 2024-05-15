import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateMeetingRoomDto } from './create-meeting-room.dto';
import { IsNotEmpty } from 'class-validator';

export class UpdateMeetingRoomDto extends PartialType(CreateMeetingRoomDto) {

    // 可以其他都不要
    // 用 PartialType 继承，然后添加一个 id 
    @ApiProperty()
    @IsNotEmpty({ message: 'id 不能为空' })
    id: number;
}
