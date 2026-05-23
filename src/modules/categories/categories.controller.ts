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
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { ListCategoriesDto } from './dto/list-categories.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Controller('categories')
@UseGuards(JwtAuthGuard)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @ResponseMessage('Category created successfully')
  create(@Req() request: AuthenticatedRequest, @Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(request.user.userId, dto);
  }

  @Get()
  @ResponseMessage('Categories retrieved successfully')
  findAll(
    @Req() request: AuthenticatedRequest,
    @Query() query: ListCategoriesDto,
  ) {
    return this.categoriesService.findAll(request.user.userId, query);
  }

  @Get(':id')
  @ResponseMessage('Category retrieved successfully')
  findOne(@Req() request: AuthenticatedRequest, @Param('id') id: string) {
    return this.categoriesService.findOne(request.user.userId, id);
  }

  @Patch(':id')
  @ResponseMessage('Category updated successfully')
  update(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(request.user.userId, id, dto);
  }

  @Delete(':id')
  @ResponseMessage('Category deleted successfully')
  remove(@Req() request: AuthenticatedRequest, @Param('id') id: string) {
    return this.categoriesService.remove(request.user.userId, id);
  }
}
