-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "actorId" TEXT,
    "actorEmail" TEXT,
    "quizId" TEXT,
    "originalQuizId" TEXT,
    "languagesFound" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "languagesPruned" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "forcedMultilingual" BOOLEAN NOT NULL DEFAULT false,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AuditLog_quizId_idx" ON "AuditLog"("quizId");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_idx" ON "AuditLog"("actorId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");
