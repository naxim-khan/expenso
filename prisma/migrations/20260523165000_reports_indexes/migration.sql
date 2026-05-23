-- CreateIndex
CREATE INDEX "Transaction_userId_amount_idx" ON "Transaction"("userId", "amount");

-- CreateIndex
CREATE INDEX "Transaction_userId_title_idx" ON "Transaction"("userId", "title");
