import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateShopDto } from './dto/create-shop.dto';
import { QueryShopDto } from './dto/query-shop.dto';
import { UpdateShopDto } from './dto/update-shop.dto';
import { ShopsService } from './shops.service';

@Controller('api/shops')
export class ShopsController {
  constructor(private readonly shopsService: ShopsService) {}

  @Post()
  @UseInterceptors(FileInterceptor('image'))
  create(
    @Body() dto: CreateShopDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.shopsService.createWithImage(dto, file);
  }

  @Get()
  findAll(@Query() query: QueryShopDto) {
    return this.shopsService.findAll(query);
  }

  @Get('stats')
  stats() {
    return this.shopsService.stats();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.shopsService.findOne(id);
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('image'))
  update(
    @Param('id') id: string,
    @Body() dto: UpdateShopDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.shopsService.updateWithImage(id, dto, file);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.shopsService.remove(id);
  }
}
