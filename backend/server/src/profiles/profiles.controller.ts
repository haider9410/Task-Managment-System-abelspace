import {
  Controller,
  Get,
  Put,
  Delete,
  Body,
  Headers,
} from "@nestjs/common";
import { ProfilesService } from "./profiles.service";

@Controller("api/profile")
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Get()
  async findOne(@Headers("x-user-id") userIdHeader: string) {
    const ownerId = (userIdHeader || "guest").toString().slice(0, 200);
    return await this.profilesService.findOne(ownerId);
  }

  @Put()
  async update(
    @Headers("x-user-id") userIdHeader: string,
    @Body() body: any,
  ) {
    const ownerId = (userIdHeader || "guest").toString().slice(0, 200);
    return await this.profilesService.update(ownerId, body);
  }

  @Delete()
  async remove(@Headers("x-user-id") userIdHeader: string) {
    const ownerId = (userIdHeader || "guest").toString().slice(0, 200);
    return await this.profilesService.remove(ownerId);
  }
}
