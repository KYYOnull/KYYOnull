import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, Transporter} from 'nodemailer';


@Injectable() // 发邮件的服务
export class EmailService {

    transporter: Transporter;

    constructor(private configSvc: ConfigService){
        this.transporter= createTransport({
            host: configSvc.get('nodemailer_host'),
            port: configSvc.get('nodemailer_port'),
            secure: false, // smtp 服务的域名和端口
            auth:{
                user: configSvc.get('nodemailer_auth_user'),
                pass: this.configSvc.get('nodemailer_auth_pass'),
            }, 
        })
    }

    async sendMail({to, subject, html}){
        await this.transporter.sendMail({
            from:{
                name: '会议室预定系统',
                address: this.configSvc.get('nodemailer_auth_user'),
            },
            to, 
            subject,
            html
        });
        console.log('EmailService 邮件发送成功');
    }
}
