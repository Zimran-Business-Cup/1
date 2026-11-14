# content/tasks/ — owners: Anuar (format), Alpamys (writing)

Seed tasks per role. The model writes new tasks for each learner using these as examples, and the server falls back to them when a generated task fails the self-check.

One folder per task:

```
content/tasks/backend-engineer/double-pay/
  task.json          card + ticket (matches PublicTask in src/contracts/task.ts)
  starter/           files the learner starts from
  tests.visible.py   shown and run in the browser
  tests.hidden.py    server only, decides the verdict
  solution/          reference solution, server only
content/tasks/product-designer/pay-button/
  task.json          card + ticket + starting scene
  rules.json         code checks: fill type, radius, contrast
  rubric.md          what the model judges: composition, hierarchy
content/tasks/project-manager/sprint-at-risk/
  task.json          card + ticket + starting board
  rules.json         capacity, every P0 in sprint, dependencies
  rubric.md          clarity of status, risks with dates, a concrete ask
```

The repo is public, so hidden tests are visible on GitHub. That is fine for the hackathon; they never reach the browser.
