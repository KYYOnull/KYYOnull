import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty } from "class-validator";

export class UpdateUserDto {

    // 可空约束 可以不改
    @ApiProperty()
    headPic: string;
    @ApiProperty()
    nickName: string;
    
    @IsNotEmpty({ message: '邮箱不能为空'})
    @IsEmail({}, {message: '不是合法的邮箱格式'})
    @ApiProperty()
    email: string;
    
    @IsNotEmpty({message: '验证码不能为空'})
    @ApiProperty()
    captcha: string;
}
