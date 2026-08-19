import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Headers,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { ProjectsService } from "./projects.service";

@Controller("api/projects")
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  async findAll(@Headers("x-user-id") userIdHeader: string) {
    const ownerId = (userIdHeader || "guest").toString().slice(0, 200);
    return await this.projectsService.findAll(ownerId);
  }

  @Post()
  async create(
    @Headers("x-user-id") userIdHeader: string,
    @Body() body: any,
  ) {
    const ownerId = (userIdHeader || "guest").toString().slice(0, 200);
    if (!body.name || !String(body.name).trim()) {
      throw new BadRequestException("Project name is required");
    }
    return await this.projectsService.create(ownerId, body);
  }

  @Post("claim-guest")
  async claimGuest(@Headers("x-user-id") userIdHeader: string) {
    const ownerId = (userIdHeader || "guest").toString().slice(0, 200);
    return await this.projectsService.claimGuest(ownerId);
  }

  @Put(":id")
  async update(
    @Param("id") id: string,
    @Body() body: any,
  ) {
    if (body.name !== undefined && !String(body.name).trim()) {
      throw new BadRequestException("Project name is required");
    }
    const project = await this.projectsService.update(id, body);
    if (!project) throw new NotFoundException("Project not found");
    return project;
  }

  @Delete(":id")
  async remove(@Param("id") id: string) {
    const project = await this.projectsService.remove(id);
    if (!project) throw new NotFoundException("Project not found");
    return { message: "Project deleted" };
  }
}
