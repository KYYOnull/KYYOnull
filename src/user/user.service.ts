import { HttpException, HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { md5 } from 'src/utils';
import { FindOperator, Like, Repository } from 'typeorm';
import { RegisterUserDto } from './dto/register-user.dto';
import { User } from './entities/user.entity';
import { RedisService } from '../redis/redis.service';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { LoginUserDto } from './dto/login-user.dto';
import { LoginUserVo } from './vo/login-user.vo';
import { UpdateUserPasswordDto } from './dto/update-user-password.dto';
import { UpdateUserDto } from './dto/udpate-user-info.dto';


@Injectable()
export class UserService {

    private logger = new Logger();

    @InjectRepository(Role)
    private roleRepo: Repository<Role>;
    @InjectRepository(User)
    private userRepo: Repository<User>; // 关联user entity
    @InjectRepository(Permission)
    private permissionRepo: Repository<Permission>;

    @Inject(RedisService) // 全局可用
    private redisSvc: RedisService;

    async register(user: RegisterUserDto) {
        // await redis
        const captcha: string = await this.redisSvc.get(`register_captcha_${user.email}`);

        if (!captcha) throw new HttpException('验证码失效', HttpStatus.BAD_REQUEST); // 400
        if (user.captcha !== captcha) throw new HttpException('验证码不正确', HttpStatus.BAD_REQUEST);

        // mapper await库  利用唯一名户名查User记录
        const foundUser = await this.userRepo.findOneBy({ username: user.username });
        if (foundUser) throw new HttpException('用户已存在', HttpStatus.BAD_REQUEST);

        const newUser = new User();
        newUser.username = user.username; // dto
        newUser.password = md5(user.password);
        newUser.email = user.email;
        newUser.nickName = user.nickName;

        try {
            await this.userRepo.save(newUser); // save= insert+ select
            return '注册成功';
        } catch (e) {
            this.logger.error(e, UserService); // 报错位置
            return '注册失败';
        }
    }

    // user admin 复用一套登录
    async login(loginUserDto: LoginUserDto, isAdmin: boolean) {
        const user = await this.userRepo.findOne({
            where: {
                username: loginUserDto.username,
                isAdmin 
            },
            relations: ['roles', 'roles.permissions']
            // 级联查询 roles 和 roles.permissions
        });
        if (!user) throw new HttpException('用户不存在', HttpStatus.BAD_REQUEST);
        if (user.password !== md5(loginUserDto.password)) throw new HttpException('密码错误', HttpStatus.BAD_REQUEST);

        const userVo = new LoginUserVo(); // response VO
        userVo.userInfo = {
            id: user.id,
            username: user.username,
            nickName: user.nickName,
            email: user.email,
            phoneNumber: user.phoneNumber,
            headPic: user.headPic,
            createTime: user.createTime.getTime(),
            isFrozen: user.isFrozen,
            isAdmin: user.isAdmin,
            roles: user.roles.map(it => it.name), // 所担任的所有角色名
            permissions: user.roles.reduce((arr, it: Role) => {
                // 对于每个身份下面的权限
                it.permissions.forEach(perm => {
                    if (arr.indexOf(perm) === -1) {
                        arr.push(perm); // 只添加一次权限
                    }
                })
                return arr;
            }, []), // permissions 是所有roles 的 permissions 合并，去重
            // 得到user 的所有身份和所有权限
        }
        console.log(userVo);
        return userVo;
    }

    // user admin 复用
    async findUserById(userId: number, isAdmin: boolean) {

        const user = await this.userRepo.findOne({
            where: {
                id: userId,
                isAdmin
            },
            relations: ['roles', 'roles.permissions'],
        });

        const userVo = new LoginUserVo();
        userVo.userInfo = {
            id: user.id,
            username: user.username,
            nickName: user.nickName,
            email: user.email,
            phoneNumber: user.phoneNumber,
            headPic: user.headPic,
            createTime: user.createTime.getTime(),
            isFrozen: user.isFrozen,
            isAdmin: user.isAdmin,
            roles: user.roles.map(it => it.name),
            permissions: user.roles.reduce((arr, item: Role) => {
                item.permissions.forEach(perm => { // 对于每个role 的所有权限 去重
                    if (arr.indexOf(perm) === -1) { // 是否存在与 perm 相等的元素
                        arr.push(perm); // 添加到数组末尾
                    }
                })
                return arr;
            }, [])
        }

        return userVo;
    }
    async findUserDetailById(userId: number) {
        const user: User = await this.userRepo.findOne({
            where: { id: userId }
        });

        return user;
    }
    async updatePassword(passwordDto: UpdateUserPasswordDto) {
        const captcha = await this.redisSvc.get(`update_password_captcha_${passwordDto.email}`);
        if (!captcha) throw new HttpException('验证码过期失效', HttpStatus.BAD_REQUEST);

        if (passwordDto.captcha != captcha) throw new HttpException('验证码输入错误', HttpStatus.BAD_REQUEST);

        const foundUser: User = await this.userRepo.findOneBy(
            { 
                username: passwordDto.username,
            }
        );

        if(foundUser.email!== passwordDto.email) throw new HttpException('邮箱不正确', HttpStatus.BAD_REQUEST);

        // 邮箱正确
        foundUser.password = md5(passwordDto.password);
        try {
            await this.userRepo.save(foundUser); // 写回
            return '密码修改成功';
        } catch (e) {
            this.logger.error(e, UserService);
            return '密码修改失败';
        }
    }
    async updateInfo(userId: number, updateUserDto: UpdateUserDto) {

        const captcha = await this.redisSvc.get(`update_userInfo_captcha_${updateUserDto.email}`);

        if (!captcha) throw new HttpException('验证码已失效', HttpStatus.BAD_REQUEST);
        if (updateUserDto.captcha !== captcha) throw new HttpException('验证码不正确', HttpStatus.BAD_REQUEST);

        const foundUser = await this.userRepo.findOneBy({ id: userId });
        if (updateUserDto.nickName) foundUser.nickName = updateUserDto.nickName;
        if (updateUserDto.headPic) foundUser.headPic = updateUserDto.headPic;

        try {
            await this.userRepo.save(foundUser);
            return '用户信息修改成功';
        } catch (e) {
            this.logger.error(e, UserService);
            return '用户信息修改成功';
        }
    }
    async freezeUserById(id: number) {
        const user: User = await this.userRepo.findOneBy({ id });
        user.isFrozen = true;
        await this.userRepo.save(user);
    }

    async findUsersByPage(
        username: string, nickName: string, email: string, 
        pageNo: number, pageSize: number) {

        const skipCnt= (pageNo-1)* pageSize; // 跳过的记录数
        const condition: Record<string, FindOperator<string>>= {};
        if(username) condition.username = Like(`%${username}%`);   
        if(nickName) condition.nickName = Like(`%${nickName}%`); 
        if(email)    condition.email = Like(`%${email}%`); // 使用模糊查询

        const [users, totCnt]= await this.userRepo.findAndCount({
            select: [
                'id', 'username', 'nickName', 
                'email', 'phoneNumber', 'isFrozen', 
                'headPic', 'createTime'
            ],
            skip: skipCnt,
            take: pageSize,
            where: condition,
        }); // 还会查询总记录数

        // 先查出来再分页 因此一定是pageSize=4一定是4条
        return { users, totCnt };
    }

    async initData() {

        // 管理员，有 ccc 和 ddd 接口访问权限
        const user1 = new User();
        user1.username = 'zhangsan';
        user1.password = md5("111111");
        user1.email = "xxx@xx.com";
        user1.isAdmin = true; // default false
        user1.nickName = '张三';
        user1.phoneNumber = '13233323333';

        // 普通用户，只有 ccc 接口的访问权限
        const user2 = new User();
        user2.username = 'lisi';
        user2.password = md5("222222");
        user2.email = "yy@yy.com";
        user2.nickName = '李四';

        const role1 = new Role();
        role1.name = '管理员';
        const role2 = new Role();
        role2.name = '普通用户';

        const permission1 = new Permission();
        permission1.code = 'ccc';
        permission1.description = '访问 ccc 接口';

        const permission2 = new Permission();
        permission2.code = 'ddd';
        permission2.description = '访问 ddd 接口';

        // 关联表
        user1.roles = [role1]; // user->role bind
        user2.roles = [role2];
        role1.permissions = [permission1, permission2]; // role->permission bind
        role2.permissions = [permission1]; // 11 12 21 id关联

        // repository 异步
        await this.permissionRepo.save([permission1, permission2]);
        await this.roleRepo.save([role1, role2]);
        await this.userRepo.save([user1, user2]);
    }
}
