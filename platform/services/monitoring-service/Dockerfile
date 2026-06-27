FROM node:20-alpine
# openssl requis par Prisma ; iputils pour avoir le vrai ping (busybox ping ne supporte pas -w)
RUN apk add --no-cache openssl iputils
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY prisma/ ./prisma/
RUN npx prisma generate
COPY src/ ./src/
EXPOSE 3003
CMD ["sh", "-c", "npx prisma migrate deploy && node src/server.js"]
