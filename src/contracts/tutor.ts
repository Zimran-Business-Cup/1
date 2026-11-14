// The mentor's chat contract. It still lives in src/lib/tutor/schema.ts so the
// working app keeps compiling; import it from here in new code.
//
// Planned change (Anuar, first contracts PR): TutorTurn gets
//   stage: "interview" instead of "quiz",
//   task: TaskCard | null instead of an inline exercise,
// and the schema moves into this file.
export * from "@/lib/tutor/schema";
