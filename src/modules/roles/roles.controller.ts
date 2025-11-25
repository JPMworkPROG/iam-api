import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  ParseEnumPipe,
  Post,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { Public } from '@shared/decorators/public.decorator';
import { RolesService } from './roles.service';
import { CheckRolePermissionRequestDto } from './dto/in/checkRolePermissionRequest.dto';
import { RolePermissionResponseDto } from './dto/out/rolePermissionResponse.dto';
import { CheckRolePermissionResponseDto } from './dto/out/checkRolePermissionResponse.dto';

@Controller('roles')
export class RolesController {
  private readonly logger = new Logger(RolesController.name);

  constructor(private readonly rolesService: RolesService) { }

  @Get()
  @Public()
  @HttpCode(HttpStatus.OK)
  getAllRoles(): RolePermissionResponseDto[] {
    this.logger.log('Listing permissions grouped by role');
    return this.rolesService.listPermissions();
  }

  @Get(':role')
  @Public()
  @HttpCode(HttpStatus.OK)
  getRolePermissions(
    @Param('role', new ParseEnumPipe(Role)) role: Role,
  ): RolePermissionResponseDto {
    this.logger.log(`Fetching permissions for role: ${role}`);
    return this.rolesService.getRolePermissions(role);
  }

  @Post('check-permission')
  @Public()
  @HttpCode(HttpStatus.OK)
  checkPermission(
    @Body() body: CheckRolePermissionRequestDto,
  ): CheckRolePermissionResponseDto {
    this.logger.log(`Checking permission ${body.permission} for role ${body.role}`);
    return this.rolesService.checkPermission(body.role, body.permission);
  }
}
