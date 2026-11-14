// Shared contracts between the browser (Alsheri's zone) and the server
// (Anuar's zone). Change them only in a small separate PR that the other
// person reviews. See docs/ARCHITECTURE.md → "Contracts and API".
export * from "./workspace";
export * from "./task";
export * from "./flicky";
export * from "./events";
export * from "./tutor";
export * from "./billing";
