FROM node:20-alpine
RUN apk add --no-cache openssl
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY prisma/ ./prisma/
RUN npx prisma generate
COPY src/ ./src/
EXPOSE 3001
# migrate → seed (idempotent) → démarrer le serveur
CMD ["sh", "-c", "npx prisma migrate deploy && node prisma/seed.js && node src/server.js"]
