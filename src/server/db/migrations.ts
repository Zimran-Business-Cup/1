// Schema migrations, applied in order on the first query after the app
// starts (see ./index.ts). Never edit an applied migration: add a new one.
// Kept as strings so Next.js standalone output ships them without extra files.

export interface Migration {
  id: number;
  name: string;
  sql: string;
}

export const MIGRATIONS: Migration[] = [
  {
    id: 1,
    name: "users, profiles, attempts, events",
    sql: `
      create table users (
        id            uuid primary key,
        created_at    timestamptz not null default now(),
        last_seen_at  timestamptz not null default now()
      );

      -- One interview result per learner and role.
      create table profiles (
        user_id         uuid not null references users(id) on delete cascade,
        role            text not null,
        current_job     text not null,
        experience      text not null,
        tools           text[] not null default '{}',
        hours_per_week  numeric,
        goal            text not null,
        level           text,
        created_at      timestamptz not null default now(),
        updated_at      timestamptz not null default now(),
        primary key (user_id, role)
      );

      -- Every Submit and its verdict. passed comes from code checks only.
      create table attempts (
        id          bigint generated always as identity primary key,
        user_id     uuid not null references users(id) on delete cascade,
        task_id     text not null,
        role        text not null,
        workspace   text not null,
        passed      boolean not null,
        checks      jsonb not null,
        submission  jsonb not null,
        created_at  timestamptz not null default now()
      );
      create index attempts_user_task on attempts (user_id, task_id, created_at);

      -- Hints, runs and interest ratings reported by the browser.
      create table events (
        id          bigint generated always as identity primary key,
        user_id     uuid not null references users(id) on delete cascade,
        session_id  text not null,
        task_id     text,
        type        text not null,
        payload     jsonb not null,
        created_at  timestamptz not null default now()
      );
      create index events_user_type on events (user_id, type, created_at);
    `,
  },
];
