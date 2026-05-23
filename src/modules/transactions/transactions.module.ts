import { Module } from '@nestjs/common';
import { TransactionsCommandRepository } from './repositories/command.repository';
import { TransactionsQueryRepository } from './repositories/query.repository';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';

@Module({
  controllers: [TransactionsController],
  providers: [
    TransactionsService,
    TransactionsCommandRepository,
    TransactionsQueryRepository,
  ],
  exports: [
    TransactionsService,
    TransactionsCommandRepository,
    TransactionsQueryRepository,
  ],
})
export class TransactionsModule {}
