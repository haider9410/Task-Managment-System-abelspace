import "dotenv/config";
import { connectDb } from "./db.js";
import Task from "./models/Task.js";

const SEED_TASKS = [
  { title: "Write API Documentation", desc: "Create clear and detailed API documentation to guide developers.", status: "todo", priority: "Medium", memberId: "m1", dueDate: "2026-07-29", tags: ["API", "Docs"] },
  { title: "Implement Search Function", desc: "Add full text search across tasks and projects.", status: "todo", priority: "High", memberId: "m1", dueDate: "2026-07-29", tags: ["Backend", "Feature"] },
  { title: "Deploy to Production", desc: "Ship the latest release to the production environment.", status: "todo", priority: "High", memberId: "m1", dueDate: "2026-07-29", tags: ["Deployment", "Release"] },
  { title: "Code Review Completed", desc: "Review open pull requests before merge.", status: "doing", priority: "Medium", memberId: "m1", dueDate: "2026-07-29", tags: ["Review", "Code"] },
  { title: "Design Mockups Finalized", desc: "Finalize high fidelity mockups for the dashboard.", status: "doing", priority: "Low", memberId: "m1", dueDate: "2026-07-29", tags: ["Design", "UI"] },
  { title: "Feature Testing Passed", desc: "Regression suite passed for the new release.", status: "completed", priority: "Medium", memberId: "m2", dueDate: "2026-07-30", tags: ["Testing", "Passed"] },
  { title: "UI Design Updated", desc: "Refresh the component library with new tokens.", status: "completed", priority: "Low", memberId: "m3", dueDate: "2026-07-31", tags: ["Design", "Updated"] },
  { title: "Security Audit Scheduled", desc: "Book the quarterly third-party security audit.", status: "completed", priority: "High", memberId: "m4", dueDate: "2026-08-01", tags: ["Audit", "Scheduled"] },
  { title: "UI Review Pending", desc: "Awaiting design sign-off on the settings screen.", status: "onhold", priority: "Medium", memberId: "m3", dueDate: "2026-08-05", tags: ["Design", "Review"] },
  { title: "Backend Dev Blocked", desc: "Blocked on the third-party payments API access.", status: "onhold", priority: "High", memberId: "m5", dueDate: "2026-08-06", tags: ["Backend", "Dev"] },
  { title: "User Feedback Review", desc: "Triage feedback collected from the last survey.", status: "onhold", priority: "Low", memberId: "m6", dueDate: "2026-08-07", tags: ["Product", "Research"] },
  { title: "Performance Optimization", desc: "Investigate slow queries on the reporting endpoint.", status: "onhold", priority: "High", memberId: "m7", dueDate: "2026-08-08", tags: ["Engineering", "Optimize"] },
];

async function seed() {
  try {
    await connectDb();
    console.log("Connected to MySQL database");
    await Task.deleteMany({ ownerId: "guest" });
    await Task.insertMany(
      SEED_TASKS.map((t) => ({ ...t, ownerId: "guest" }))
    );
    console.log(`Seeded ${SEED_TASKS.length} tasks for guest user in MySQL`);
    process.exit(0);
  } catch (err) {
    console.error("Seeding failed:", err.message);
    process.exit(1);
  }
}

seed();
