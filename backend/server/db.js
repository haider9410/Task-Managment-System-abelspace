import mysql from "mysql2/promise";

const MYSQL_HOST = process.env.MYSQL_HOST || "localhost";
const MYSQL_PORT = parseInt(process.env.MYSQL_PORT || "3306", 10);
const MYSQL_USER = process.env.MYSQL_USER || "root";
const MYSQL_PASSWORD = process.env.MYSQL_PASSWORD || "";
const MYSQL_DATABASE = process.env.MYSQL_DATABASE || "pyramid_task_db";

let pool = null;

export async function getPool() {
  if (!pool) {
    // 1. Ensure database exists
    const sysConn = await mysql.createConnection({
      host: MYSQL_HOST,
      port: MYSQL_PORT,
      user: MYSQL_USER,
      password: MYSQL_PASSWORD,
    });
    await sysConn.query(`CREATE DATABASE IF NOT EXISTS \`${MYSQL_DATABASE}\`;`);
    await sysConn.end();

    // 2. Create database pool
    pool = mysql.createPool({
      host: MYSQL_HOST,
      port: MYSQL_PORT,
      user: MYSQL_USER,
      password: MYSQL_PASSWORD,
      database: MYSQL_DATABASE,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });

    // 3. Initialize tables
    await initTables(pool);
  }
  return pool;
}

async function initTables(dbPool) {
  const createProjects = `
    CREATE TABLE IF NOT EXISTS projects (
      id INT AUTO_INCREMENT PRIMARY KEY,
      ownerId VARCHAR(255) NOT NULL,
      name VARCHAR(255) NOT NULL,
      \`desc\` TEXT,
      color VARCHAR(50) DEFAULT '#171717',
      private TINYINT(1) DEFAULT 0,
      priority VARCHAR(50) DEFAULT 'no_priority',
      dueDate VARCHAR(100) DEFAULT '',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_owner (ownerId)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;

  const createTasks = `
    CREATE TABLE IF NOT EXISTS tasks (
      id INT AUTO_INCREMENT PRIMARY KEY,
      ownerId VARCHAR(255) NOT NULL,
      projectId VARCHAR(255) DEFAULT '',
      title VARCHAR(255) NOT NULL,
      \`desc\` TEXT,
      status VARCHAR(50) DEFAULT 'todo',
      priority VARCHAR(50) DEFAULT 'Medium',
      memberId VARCHAR(255) DEFAULT 'm1',
      dueDate VARCHAR(100) DEFAULT '',
      tags JSON,
      subtasks JSON,
      comments JSON,
      resources JSON,
      watchers JSON,
      locked TINYINT(1) DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_owner (ownerId),
      INDEX idx_project (projectId)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;

  const createProfiles = `
    CREATE TABLE IF NOT EXISTS profiles (
      id INT AUTO_INCREMENT PRIMARY KEY,
      ownerId VARCHAR(255) NOT NULL UNIQUE,
      email VARCHAR(255) DEFAULT '',
      name VARCHAR(255) DEFAULT '',
      title VARCHAR(255) DEFAULT '',
      username VARCHAR(255) DEFAULT '',
      picture TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_owner (ownerId)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;

  await dbPool.query(createProjects);
  await dbPool.query(createTasks);
  await dbPool.query(createProfiles);
}

export async function connectDb() {
  const dbPool = await getPool();
  // Quick ping check
  const [rows] = await dbPool.query("SELECT 1 + 1 AS solution");
  return { via: "mysql", solution: rows[0]?.solution };
}
