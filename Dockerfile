FROM node:20-slim

WORKDIR /app

# 复制 package.json 并安装所有依赖（包括 devDependencies）
COPY package.json ./
RUN npm install

# 复制源代码并构建
COPY . .
RUN npm run build

# 重新安装 production 依赖（更小镜像）
RUN npm install --omit=dev

# 运行编译后的代码
CMD ["npm", "start"]
