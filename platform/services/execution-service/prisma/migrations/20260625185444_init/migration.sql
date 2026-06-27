-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('PENDING', 'RUNNING', 'SUCCESS', 'FAILED');

-- CreateEnum
CREATE TYPE "AuthType" AS ENUM ('PASSWORD', 'KEY');

-- CreateTable
CREATE TABLE "InstallationJob" (
    "id" TEXT NOT NULL,
    "serverId" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "hostname" TEXT NOT NULL,
    "softwareKey" TEXT NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'PENDING',
    "output" TEXT,
    "errorMessage" TEXT,
    "requestedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InstallationJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SshCredential" (
    "id" TEXT NOT NULL,
    "serverId" TEXT NOT NULL,
    "sshUser" TEXT NOT NULL,
    "host" TEXT,
    "port" INTEGER NOT NULL DEFAULT 22,
    "authType" "AuthType" NOT NULL,
    "secretEncrypted" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SshCredential_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InstallationJob_serverId_idx" ON "InstallationJob"("serverId");

-- CreateIndex
CREATE INDEX "InstallationJob_status_idx" ON "InstallationJob"("status");

-- CreateIndex
CREATE INDEX "InstallationJob_requestedBy_idx" ON "InstallationJob"("requestedBy");

-- CreateIndex
CREATE UNIQUE INDEX "SshCredential_serverId_key" ON "SshCredential"("serverId");
