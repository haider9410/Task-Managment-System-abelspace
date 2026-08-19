import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Headers,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { TasksService } from "./tasks.service";

@Controller("api/tasks")
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  async findAll(
    @Headers("x-user-id") userIdHeader: string,
    @Query("projectId") projectId?: string,
  ) {
    const ownerId = (userIdHeader || "guest").toString().slice(0, 200);
    return await this.tasksService.findAll(ownerId, projectId);
  }

  @Post()
  async create(
    @Headers("x-user-id") userIdHeader: string,
    @Body() body: any,
  ) {
    const ownerId = (userIdHeader || "guest").toString().slice(0, 200);
    if (!body.title || !String(body.title).trim()) {
      throw new BadRequestException("Title is required");
    }
    return await this.tasksService.create(ownerId, body);
  }

  @Put(":id")
  async update(
    @Headers("x-user-id") userIdHeader: string,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    if (body.title !== undefined && !String(body.title).trim()) {
      throw new BadRequestException("Title is required");
    }
    const task = await this.tasksService.update(id, body);
    if (!task) throw new NotFoundException("Task not found");
    return task;
  }

  @Delete(":id")
  async remove(
    @Param("id") id: string,
  ) {
    const task = await this.tasksService.remove(id);
    if (!task) throw new NotFoundException("Task not found");
    return { message: "Task deleted" };
  }
}
