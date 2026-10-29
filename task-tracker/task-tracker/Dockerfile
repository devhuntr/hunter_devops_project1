FROM node:22-slim

WORKDIR /usr/src/app

# Install production dependencies first so this layer is cached between builds
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY . .

EXPOSE 8080
CMD [ "npm", "start" ]
