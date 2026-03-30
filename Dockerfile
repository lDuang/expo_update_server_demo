FROM node:20-slim

WORKDIR /app

# 复制 package.json 并安装依赖
COPY package.json ./
RUN npm install --production

# 复制源代码并构建
COPY . .
RUN npm run build

# 运行编译后的代码
CMD ["npm", "start"]
