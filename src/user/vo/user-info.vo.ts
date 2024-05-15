
// 只显示部分查询数据

import { User } from "../entities/user.entity";

export class UserDetailVo { // 8
    id: number;
    username: string;
    nickName: string;
    email: string;
    headPic: string;
    phoneNumber: string;
    isFrozen: boolean;
    createTime: Date;

    constructor(user: User) {
        this.id = user.id;
        this.email = user.email;
        this.username = user.username;
        this.headPic = user.headPic;
        this.phoneNumber = user.phoneNumber;
        this.nickName = user.nickName;
        this.createTime = user.createTime;
        this.isFrozen = user.isFrozen;
    }
}
