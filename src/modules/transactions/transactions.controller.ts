import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { ListTransactionsDto } from './dto/list-transactions.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { TransactionsService } from './transactions.service';

@Controller('transactions')
@UseGuards(JwtAuthGuard)
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  @ResponseMessage('Transaction created successfully')
  create(
    @Req() request: AuthenticatedRequest,
    @Body() dto: CreateTransactionDto,
  ) {
    return this.transactionsService.create(request.user.userId, dto);
  }

  @Get()
  @ResponseMessage('Transactions retrieved successfully')
  findAll(
    @Req() request: AuthenticatedRequest,
    @Query() query: ListTransactionsDto,
  ) {
    return this.transactionsService.findAll(request.user.userId, query);
  }

  @Get(':id')
  @ResponseMessage('Transaction retrieved successfully')
  findOne(@Req() request: AuthenticatedRequest, @Param('id') id: string) {
    return this.transactionsService.findOne(request.user.userId, id);
  }

  @Patch(':id')
  @ResponseMessage('Transaction updated successfully')
  update(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateTransactionDto,
  ) {
    return this.transactionsService.update(request.user.userId, id, dto);
  }

  @Delete(':id')
  @ResponseMessage('Transaction deleted successfully')
  remove(@Req() request: AuthenticatedRequest, @Param('id') id: string) {
    return this.transactionsService.remove(request.user.userId, id);
  }
}
