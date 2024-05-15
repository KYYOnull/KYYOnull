import { BadRequestException, Body, Controller, DefaultValuePipe, Get, HttpStatus, Inject, Post, Query, Request, UploadedFile, UseInterceptors } from '@nestjs/common';
import { UserService } from './user.service';
import { RegisterUserDto } from './dto/register-user.dto';

import { LoginUserDto } from './dto/login-user.dto';
import { LoginUserVo } from './vo/login-user.vo';

import { User } from './entities/user.entity';
import { generateParseIntPipe } from 'src/utils';
import { RequireLogin, UserInfo } from 'src/custom.decorator';
import { UserDetailVo } from './vo/user-info.vo';
import { UpdateUserPasswordDto } from './dto/update-user-password.dto';
import { UpdateUserDto } from './dto/udpate-user-info.dto';
import { ApiBody, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RefreshTokenVo } from './vo/refresh-token.vo';
import { CaptchaService } from 'src/captcha/captcha.service';
import { TokenService } from 'src/token/token.service';
import { FileInterceptor } from '@nestjs/platform-express';
import * as path from 'path'; // 使用了命名空间
import { storage } from 'src/my-file-storage';


@ApiTags('用户管理模块') // 装饰器让 swagger 分组
@Controller('user')
export class UserController {

  constructor(private readonly userSvc: UserService) { } // UserService 可能为开放给其他 service使用 此时不能 inject 要构造

  @Inject(CaptchaService)
  private captchaSvc: CaptchaService;
  @Inject(TokenService)
  private tokenSvc: TokenService;

  // 注册
  @ApiBody({ type: RegisterUserDto })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '验证码已失效/验证码不正确/用户已存在', type: String })
  @ApiResponse({ status: HttpStatus.OK, description: '注册成功/失败', type: String })
  @Post('register') // dto 封装 body 里的请求参数
  async register(@Body() registerUser: RegisterUserDto) {
    return await this.userSvc.register(registerUser);
  }

  // 不登录 注册+忘记密码 的验证码 swagger描述 query 参数 描述响应
  @ApiQuery({ name: 'address', type: String, description: '邮箱地址', required: true, example: 'xxx@xx.com' })
  @ApiResponse({ status: HttpStatus.OK, description: '发送成功', type: String })
  @Get(['register_captcha', 'update_password_captcha']) // 如何合并发送验证码的逻辑
  async captchaNoLogin(@Query('address') address: string, @Request() req: any) {
    const captchaType: string = req.path.split('/').pop(); // /user/update_password_captcha
    return await this.captchaSvc.sendCaptcha2Mail(captchaType, address)
  }
  // 基于登录 更新信息的验证码
  @ApiQuery({ name: 'address', type: String, description: '邮箱地址', required: true, example: 'xxx@xx.com' })
  @ApiResponse({ status: HttpStatus.OK, description: '发送成功', type: String })
  @RequireLogin()
  @Get(['update_userinfo_captcha']) // 如何合并发送验证码的逻辑
  async captchaLogin(@UserInfo('email') email: string, @Request() req: any) {
    const captchaType: string = req.path.split('/').pop(); // /user/update_password_captcha
    console.log(email, captchaType);
    return await this.captchaSvc.sendCaptcha2Mail(captchaType, email)
  }

  // 登录账户 
  // 在 jwt 里放 email 的信息 这样后面所有基于登录的业务
  // 如果用到邮箱 都能在被LoginGuard 改造的req中 取出邮箱 注入 controller
  @ApiBody({ type: LoginUserDto }) // swagger标识两种响应 标识请求体
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '用户不存在/密码错误', type: String })
  @ApiResponse({ status: HttpStatus.OK, description: '用户信息和 token', type: LoginUserVo })
  @Post(['login', 'admin/login'])
  async userLogin(@Body() loginUser: LoginUserDto, @Request() req: any) :Promise<LoginUserVo>{

    let isAdmin: boolean = true;
    let path: string = req.path;
    if (path.split('/').length == 3) isAdmin = false;
    let userVo: LoginUserVo = await this.userSvc.login(loginUser, isAdmin);

    return this.tokenSvc.jwtSign2Vo(userVo); // vo= userInfo + two tokens
  }

  // 查询接口 实现查询用户信息，回显数据
  @RequireLogin() // LoginGuard 做登录检查
  @Get('info') // 无参 从token解析id
  async info(@UserInfo('userId') userId: number) {
    const user: User = await this.userSvc.findUserDetailById(userId);
    const userVo: UserDetailVo = new UserDetailVo(user);
    return userVo;
  }

  // user admin 修改密码 忘记密码 此时未登录 使用用户名+email
  @ApiBody({ type: UpdateUserPasswordDto }) // 封装dto
  @ApiResponse({ type: String, description: '验证码已失效/不正确' })
  @Post(['update_password', 'admin/update_password']) // 两个路由同一 handler处理
  async updatePassword(@Body() passwordDto: UpdateUserPasswordDto) { // 传的是id + 新的 邮箱、密码、验证码
    return await this.userSvc.updatePassword(passwordDto);
  }
  // user admin 修改个人信息
  @RequireLogin()
  @Post(['update_userinfo', 'admin/update_userinfo']) // 定义两个 post 接口
  async update(@UserInfo('userId') userId: number, @Body() updateUserDto: UpdateUserDto) {
    return await this.userSvc.updateInfo(userId, updateUserDto);
  }

  // user admin 复用一套刷新tk
  @ApiQuery({ name: 'refreshToken', type: String, description: '刷新token', required: true, example: 'xxxyyyzzz' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'token失效，请重新登录' })
  @ApiResponse({ status: HttpStatus.OK, description: '刷新成功', type: RefreshTokenVo })
  @Get(['refresh', 'admin/refresh'])
  async refresh(@Query('refreshToken') reftk: string, @Request() req: any) :Promise<RefreshTokenVo>{
    let isAdmin: boolean = true;
    let path: string = req.path;
    if (path.split('/').length == 3) isAdmin = false;

    return await this.tokenSvc.refresh(reftk, isAdmin); // RefreshTokenVo
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', {
    dest: 'uploads',
    limits: {
      fileSize: 1024 * 1024 * 3
    },
    storage: storage, // 指定存储配置
    fileFilter(req, file, callback) {
      const extname = path.extname(file.originalname);
      if (['.png', '.jpg', '.gif'].includes(extname)) {
        callback(null, true);
      } else {
        callback(new BadRequestException('只能上传图片'), false);
      }
    }
  }))
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    return file.path;
  }

  @Get('freeze') // 冻结用户 不能预定会议室 只有管理员有调用权限 这个接口也需要登录
  async freeze(@Query('id') userId: number) {
    await this.userSvc.freezeUserById(userId);
    return 'success';
  }

  @Get('list') // 分页查询 返回对应页的数据
  async list( // 支持根据 username、nickName、email 的搜索
    @Query('pageNo', new DefaultValuePipe(1), generateParseIntPipe('pageNo')) pageNo: number,
    @Query('pageSize', new DefaultValuePipe(2), generateParseIntPipe('pageSize')) pageSize: number,
    @Query('username') username: string,
    @Query('nickName') nickName: string,
    @Query('email') email: string) {

    return await this.userSvc.findUsersByPage(username, nickName, email, pageNo, pageSize);
  }

  @Get("init-data")
  async initData() {
    await this.userSvc.initData();
    return 'done';
  }


}
