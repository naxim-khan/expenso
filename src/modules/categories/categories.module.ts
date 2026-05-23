import { Module } from '@nestjs/common';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { CategoriesCommandRepository } from './repositories/command.repository';
import { CategoriesQueryRepository } from './repositories/query.repository';

@Module({
  controllers: [CategoriesController],
  providers: [
    CategoriesService,
    CategoriesCommandRepository,
    CategoriesQueryRepository,
  ],
  exports: [
    CategoriesService,
    CategoriesCommandRepository,
    CategoriesQueryRepository,
  ],
})
export class CategoriesModule {}
