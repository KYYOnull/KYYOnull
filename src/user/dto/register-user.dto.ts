import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, MinLength } from "class-validator";

export class RegisterUserDto {

    @ApiProperty() // swagger 请求体的属性
    @IsNotEmpty({ message: "用户名不能为空" })
    username: string;
    
    @ApiProperty()
    @IsNotEmpty({ message: '昵称不能为空' })
    nickName: string;
    
    @ApiProperty()
    @IsNotEmpty({ message: '密码不能为空' })
    @MinLength(6, {message: '密码不能少于 6 位'})
    password: string;
    
    @ApiProperty()
    @IsNotEmpty({ message: '邮箱不能为空' })
    @IsEmail({}, {message: '不是合法的邮箱格式'})
    email: string;
    
    @ApiProperty()
    @IsNotEmpty({ message: '验证码不能为空' })
    captcha: string;
}
