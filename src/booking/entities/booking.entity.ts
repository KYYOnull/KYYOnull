import { MeetingRoom } from "src/meeting-room/entities/meeting-room.entity";
import { User } from "src/user/entities/user.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

// 预定表 关联 会议室表 和 用户表

@Entity()
export class Booking {

    @PrimaryGeneratedColumn()
    id: number;

    @Column({ comment: '会议开始时间' })
    startTime: Date;

    @Column({ comment: '会议结束时间' })
    endTime: Date;

    @Column({ length: 20, comment: '状态（申请中、审批通过、审批驳回、已解除）', default: '' })
    status: string;

    @Column({ length: 100, comment: '备注', default: '' })
    note: string;

    @ManyToOne(() => User) // 一个用户多个预定
    user: User;
    @ManyToOne(() => MeetingRoom) // 一个会议室被多个预定
    room: MeetingRoom;

    @CreateDateColumn({ comment: '创建时间' })
    createTime: Date;

    @UpdateDateColumn({ comment: '更新时间' })
    updateTime: Date;
}
