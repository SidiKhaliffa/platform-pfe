-- CreateEnum
CREATE TYPE "PingStatus" AS ENUM ('UP', 'DOWN');

-- CreateTable
CREATE TABLE "MonitoredServer" (
    "id" TEXT NOT NULL,
    "serverId" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "hostname" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MonitoredServer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthCheck" (
    "id" TEXT NOT NULL,
    "serverId" TEXT NOT NULL,
    "status" "PingStatus" NOT NULL,
    "latencyMs" INTEGER,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HealthCheck_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MonitoredServer_serverId_key" ON "MonitoredServer"("serverId");

-- CreateIndex
CREATE INDEX "HealthCheck_serverId_checkedAt_idx" ON "HealthCheck"("serverId", "checkedAt" DESC);

-- AddForeignKey
ALTER TABLE "HealthCheck" ADD CONSTRAINT "HealthCheck_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "MonitoredServer"("serverId") ON DELETE RESTRICT ON UPDATE CASCADE;
