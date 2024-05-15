import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, MaxLength } from "class-validator";

export class CreateMeetingRoomDto {

    @ApiProperty()
    @IsNotEmpty()
    @MaxLength(10, { message: '会议室名称最长为 10 字符' })
    name: string;

    @ApiProperty()
    @IsNotEmpty()
    capacity: number;

    @ApiProperty()
    @MaxLength(50, { message: '位置最长为 50 字符' })
    @IsNotEmpty()
    location: string;

    @ApiProperty()
    @MaxLength(50, { message: '设备最长为 50 字符' })
    equipment: string;
    
    @ApiProperty()
    @MaxLength(100, { message: '描述最长为 100 字符' })
    description: string;

}
