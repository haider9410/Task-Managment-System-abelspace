import { Module } from "@nestjs/common";
import { DatabaseModule } from "./database/database.module";
import { TasksModule } from "./tasks/tasks.module";
import { ProjectsModule } from "./projects/projects.module";
import { ProfilesModule } from "./profiles/profiles.module";
import { HealthController } from "./health/health.controller";

@Module({
  imports: [DatabaseModule, TasksModule, ProjectsModule, ProfilesModule],
  controllers: [HealthController],
})
export class AppModule {}
