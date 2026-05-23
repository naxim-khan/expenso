-- CreateIndex
CREATE INDEX "Transaction_userId_createdAt_type_idx" ON "Transaction"("userId", "createdAt", "type");

-- CreateIndex
CREATE INDEX "Transaction_userId_categoryId_createdAt_idx" ON "Transaction"("userId", "categoryId", "createdAt");
