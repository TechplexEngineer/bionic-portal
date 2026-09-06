/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck — standalone Node CLI; better-sqlite3 has no installed typings.
import Database from "better-sqlite3";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const DATA_TABLES = [
  "user",
  "students",
  "events",
  "attendance",
  "event_registrations",
  "hotel_rooms",
  "room_assignments",
  "carpool_spots",
  "carpool_assignments",
  "parent_student_links",
  "parent_profiles"
];

const LOCAL_PASSWORD_HASH = "$2b$10$7EqJtq98hPqEX7fNZaFWoO4n2Y4rHqj2jV6S8c2P8n5W4Wk5Gm4yK";

function hasTable(db, table) {
  return Boolean(
    db.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?").get(table)
  );
}

function quote(value) {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "number") return String(value);
  if (Buffer.isBuffer(value)) return `X'${value.toString("hex")}'`;
  return `'${String(value).replaceAll("'", "''")}'`;
}

function updateStudentReferences(db, oldId, newId) {
  for (const [table, column] of [
    ["attendance", "userid"],
    ["event_registrations", "student_id"],
    ["room_assignments", "student_id"],
    ["carpool_assignments", "student_id"],
    ["parent_student_links", "student_id"]
  ]) {
    if (hasTable(db, table))
      db.prepare(`UPDATE "${table}" SET "${column}" = ? WHERE "${column}" = ?`).run(newId, oldId);
  }
}

function sanitizeDatabase(db) {
  if (!hasTable(db, "students"))
    throw new Error("Production export does not contain students table");
  const students = db.prepare("SELECT * FROM students ORDER BY userid LIMIT 5").all();
  if (students.length !== 5)
    throw new Error(`Expected at least five students, found ${students.length}`);

  db.pragma("foreign_keys = OFF");
  const selectedIds = new Set(students.map((student) => student.userid));
  for (const table of [
    "attendance",
    "event_registrations",
    "room_assignments",
    "carpool_assignments",
    "parent_student_links"
  ]) {
    if (hasTable(db, table)) {
      const column =
        table === "attendance"
          ? "userid"
          : table === "event_registrations"
            ? "student_id"
            : "student_id";
      const ids = [...selectedIds].map(quote).join(", ");
      db.exec(`DELETE FROM "${table}" WHERE "${column}" NOT IN (${ids})`);
    }
  }
  db.exec(`DELETE FROM students WHERE userid NOT IN (${[...selectedIds].map(quote).join(", ")})`);

  const studentMap = new Map();
  students.forEach((student, index) => {
    const newId = `fixture-student-${String(index + 1).padStart(3, "0")}@example.test`;
    studentMap.set(student.userid, newId);
    updateStudentReferences(db, student.userid, newId);
    db.prepare(
      `UPDATE students SET userid = ?, first_name = ?, last_name = ?, parent_names = ?, parent_emails = ?, phone = ?, parent_phone = ?, dietary_restrictions = ?, intolerance_level = ?, graduation_year = ?, tshirt_size = ?, custom_fields = ?, current_grade = ?, gender = ? WHERE userid = ?`
    ).run(
      newId,
      `Fixture${index + 1}`,
      "Student",
      `Fixture Parent ${index + 1}`,
      `fixture-parent-${String(index + 1).padStart(3, "0")}@example.test`,
      `555-010-${String(index + 1).padStart(2, "0")}`,
      `555-020-${String(index + 1).padStart(2, "0")}`,
      "none",
      "prefer_not",
      "2035",
      "M",
      JSON.stringify({ source: "fixture" }),
      "9",
      "unspecified",
      student.userid
    );
  });

  if (hasTable(db, "event_registrations")) {
    db.exec("UPDATE event_registrations SET invoice_id = NULL, invoice_payment_link = NULL");
  }

  const retainedUserIds = new Set();
  for (const table of ["parent_student_links", "carpool_spots", "room_assignments"]) {
    if (!hasTable(db, table)) continue;
    const column =
      table === "parent_student_links"
        ? "parent_id"
        : table === "carpool_spots"
          ? "mentor_id"
          : "user_id";
    const rows = db
      .prepare(`SELECT "${column}" AS id FROM "${table}" WHERE "${column}" IS NOT NULL`)
      .all();
    rows.forEach((row) => retainedUserIds.add(row.id));
  }
  if (hasTable(db, "user")) {
    const users = db.prepare("SELECT id FROM user").all();
    const userMap = new Map();
    let index = 1;
    for (const user of users) {
      if (!retainedUserIds.has(user.id)) {
        db.prepare("DELETE FROM user WHERE id = ?").run(user.id);
        continue;
      }
      const newId = `fixture-user-${String(index++).padStart(3, "0")}`;
      userMap.set(user.id, newId);
      db.prepare("UPDATE user SET id = ?, username = ?, password_hash = ? WHERE id = ?").run(
        newId,
        `${newId}@example.test`,
        LOCAL_PASSWORD_HASH,
        user.id
      );
    }
    for (const [oldId, newId] of userMap) {
      for (const [table, column] of [
        ["parent_student_links", "parent_id"],
        ["parent_profiles", "user_id"],
        ["carpool_spots", "mentor_id"],
        ["room_assignments", "user_id"]
      ]) {
        if (hasTable(db, table))
          db.prepare(`UPDATE "${table}" SET "${column}" = ? WHERE "${column}" = ?`).run(
            newId,
            oldId
          );
      }
    }
  }
  if (hasTable(db, "parent_profiles")) db.exec("UPDATE parent_profiles SET phone = '555-030-01'");
  if (hasTable(db, "carpool_spots")) {
    const spots = db.prepare("SELECT id FROM carpool_spots ORDER BY id").all();
    spots.forEach((spot, index) =>
      db
        .prepare("UPDATE carpool_spots SET driver_name = ? WHERE id = ?")
        .run(`Fixture Driver ${index + 1}`, spot.id)
    );
  }

  return { studentMap };
}

function dumpData(db) {
  const statements = ["BEGIN TRANSACTION;"];
  for (const table of DATA_TABLES) {
    if (!hasTable(db, table)) continue;
    const columns = db
      .prepare(`PRAGMA table_info("${table}")`)
      .all()
      .map((column) => column.name);
    const rows = db.prepare(`SELECT * FROM "${table}"`).all();
    for (const row of rows) {
      statements.push(
        `INSERT INTO "${table}" ("${columns.join('", "')}") VALUES (${columns.map((column) => quote(row[column])).join(", ")});`
      );
    }
  }
  statements.push("COMMIT;");
  return `${statements.join("\n")}\n`;
}

export async function sanitizeSqlExport(sourceSql, outputPath) {
  const directory = mkdtempSync(join(tmpdir(), "bionic-fixture-"));
  const dbPath = join(directory, "source.sqlite");
  try {
    const db = new Database(dbPath);
    db.pragma("foreign_keys = OFF");
    db.exec(sourceSql);
    sanitizeDatabase(db);
    const result = dumpData(db);
    db.close();
    if (outputPath) writeFileSync(outputPath, result);
    return result;
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

if (process.argv[1]?.endsWith("anonymize-d1-export.mjs")) {
  const [, , sourcePath, outputPath] = process.argv;
  if (!sourcePath || !outputPath)
    throw new Error("Usage: node scripts/anonymize-d1-export.mjs <source.sql> <fixture.sql>");
  await sanitizeSqlExport(readFileSync(sourcePath, "utf8"), outputPath);
}
