// The mentor's chat contract. It lives in src/lib/tutor/schema.ts so the
// working app keeps compiling; import it from here in new code.
//
// MVP roles (backend-engineer, product-designer, project-manager):
//   - stage "intro" is the interview (job, experience, tools, time, goal); no quiz;
//   - the turn that ends the interview carries `profile` and `task` (a TaskCard);
//   - that turn also carries `exercise` built from the same task, so the old
//     inline task UI keeps working until the full-screen workspace replaces it.
// Other roles keep the old flow: quiz, then model-written exercises, task: null.
export * from "@/lib/tutor/schema";
