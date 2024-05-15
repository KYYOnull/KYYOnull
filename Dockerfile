FROM node:18.0-alpine3.14 as build-stage

WORKDIR /app

COPY package.json .

RUN npm config set registry https://registry.npmmirror.com/
RUN npm install

COPY . .
RUN npm run build 
# 生成 dist 目录

# production stage
FROM node:18.0-alpine3.14 as production-stage

# 第二个镜像复制第一个镜像的 dist 目录和 package.json
COPY --from=build-stage /app/dist /app
COPY --from=build-stage /app/package.json /app/package.json

WORKDIR /app

RUN npm config set registry https://registry.npmmirror.com/
RUN npm install --production

EXPOSE 8001

CMD ["node", "/app/main.js"]