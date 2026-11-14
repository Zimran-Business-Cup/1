import type { Profession } from "@/lib/catalog";
import type { Exercise, TutorRequest, TutorTurn } from "./schema";

// Offline demo mentor, used when no ANTHROPIC_API_KEY is configured.
// It follows the same protocol as the Claude mentor and reacts to the
// learner's real answers and real test results, but its questions and tasks
// come from a fixed bank. The UI labels this mode as a demo.

interface QuizQuestion {
  q: string;
  options: string[];
  answer: number;
}

interface RoleScript {
  quiz: QuizQuestion[];
  tasks: { intro: string; exercise: Exercise; praise: string }[];
}

const EXPERIENCE = ["Never tried it", "Played with it a bit", "I do some of this at work", "I've done it for a job"];
const FIT = ["I enjoyed it", "It was OK", "Not for me"];
export const PASS_MARK = "result: passed";

const written = (title: string, task: string): Exercise => ({ title, task, kind: "written", starterCode: "", tests: "" });

const SCRIPTS: Record<string, RoleScript> = {
  "backend-engineer": {
    quiz: [
      { q: "An API returns status **404**. What does that usually mean?", options: ["The server crashed", "The resource wasn't found", "You're not logged in", "The request was too slow"], answer: 1 },
      { q: "Which SQL statement reads rows from a table?", options: ["INSERT", "SELECT", "UPDATE", "DROP"], answer: 1 },
      { q: "In Python, what does `len([3, 5, 8])` return?", options: ["3", "16", "8", "An error"], answer: 0 },
    ],
    tasks: [
      {
        intro: "Every signup endpoint checks the request before saving anything. In Python, a function can collect problems in a list and return it; an empty list means \"all good\".",
        exercise: {
          title: "Validate a signup request",
          task: "Write `validate_signup(data)`. Return a list of errors: add `\"invalid email\"` if the email is missing or has no `@`, and `\"password too short\"` if the password has fewer than 8 characters.",
          kind: "python",
          starterCode: 'def validate_signup(data):\n    errors = []\n    email = data.get("email", "")\n    password = data.get("password", "")\n    # add checks here\n    return errors\n\nprint(validate_signup({"email": "sam@mail.com", "password": "123"}))\n',
          tests: 'assert validate_signup({"email": "sam@mail.com", "password": "longpassword"}) == [], "a valid request should return no errors"\nassert "invalid email" in validate_signup({"email": "sam.mail.com", "password": "longpassword"}), "an email without @ is invalid"\nassert "password too short" in validate_signup({"email": "sam@mail.com", "password": "123"}), "a 3-character password is too short"\nassert len(validate_signup({})) == 2, "an empty request has both errors"',
        },
        praise: "You used `.get()` with defaults, so a request with missing fields doesn't crash your API.",
      },
      {
        intro: "APIs rarely return 10,000 rows at once: they return one page. With list slicing, `items[start:end]` gives you part of a list.",
        exercise: {
          title: "Paginate API results",
          task: "Write `paginate(items, page, per_page)` for a 1-based `page`. `paginate([1,2,3,4,5], 2, 2)` returns `[3, 4]`. A page past the end returns `[]`.",
          kind: "python",
          starterCode: "def paginate(items, page, per_page):\n    # work out where the page starts and ends\n    return []\n\nprint(paginate([1, 2, 3, 4, 5], 2, 2))\n",
          tests: 'assert paginate([1, 2, 3, 4, 5], 1, 2) == [1, 2], "page 1 starts at the first item"\nassert paginate([1, 2, 3, 4, 5], 2, 2) == [3, 4], "page 2 holds items 3 and 4"\nassert paginate([1, 2, 3, 4, 5], 3, 2) == [5], "the last page can be short"\nassert paginate([1, 2, 3], 5, 2) == [], "a page past the end is empty"',
        },
        praise: "Your start index math is right for every page, including the short last one.",
      },
    ],
  },
  "frontend-developer": {
    quiz: [
      { q: "Which language styles a web page?", options: ["HTML", "CSS", "SQL", "Python"], answer: 1 },
      { q: "What does `[1, 2, 3].map(n => n * 2)` return?", options: ["[2, 4, 6]", "6", "[1, 2, 3]", "An error"], answer: 0 },
      { q: "A button does nothing when clicked. Where do you look first?", options: ["The database", "The browser console", "The CSS file", "The server logs"], answer: 1 },
    ],
    tasks: [
      {
        intro: "Shops store prices in cents to avoid rounding bugs, and the page formats them for people. `toFixed(2)` turns a number into text with two decimals.",
        exercise: {
          title: "Format a cart price",
          task: "Write `formatPrice(cents)` that returns a string like `\"$12.50\"` for `1250`.",
          kind: "javascript",
          starterCode: "function formatPrice(cents) {\n  // turn cents into dollars text\n}\n\nconsole.log(formatPrice(1250));\n",
          tests: 'assert(formatPrice(1250) === "$12.50", "1250 cents is $12.50");\nassert(formatPrice(5) === "$0.05", "5 cents is $0.05");\nassert(formatPrice(100000) === "$1000.00", "large prices keep two decimals");',
        },
        praise: "You divided before formatting, so every price keeps exactly two decimals.",
      },
      {
        intro: "Search boxes filter a list as you type. `filter` keeps matching items; compare in lowercase so \"Mug\" matches \"mug\".",
        exercise: {
          title: "Filter products by search",
          task: "Write `search(products, query)` that returns the products whose `name` contains `query`, ignoring case. An empty query returns all products.",
          kind: "javascript",
          starterCode: 'const products = [{ name: "Blue Mug" }, { name: "Notebook" }, { name: "mug warmer" }];\n\nfunction search(products, query) {\n  // keep the products that match\n}\n\nconsole.log(search(products, "mug"));\n',
          tests: 'const items = [{ name: "Blue Mug" }, { name: "Notebook" }, { name: "mug warmer" }];\nassert(search(items, "mug").length === 2, "\\"mug\\" should match both mugs");\nassert(search(items, "NOTE").length === 1, "search ignores case");\nassert(search(items, "").length === 3, "an empty query returns everything");',
        },
        praise: "Lowercasing both sides is exactly how real search boxes avoid missed matches.",
      },
    ],
  },
  "data-analyst": {
    quiz: [
      { q: "What's the average of 2, 4 and 9?", options: ["5", "4", "15", "6"], answer: 0 },
      { q: "Which chart best shows a metric changing over 12 months?", options: ["Pie chart", "Line chart", "Scatter plot", "Table"], answer: 1 },
      { q: "Sales rose 20% after a price cut. What's the safest conclusion?", options: ["The price cut caused it", "Check other factors first", "Cut prices again", "The data is wrong"], answer: 1 },
    ],
    tasks: [
      {
        intro: "Analysts group rows and add them up all day. In Python, a dict works like a pivot table: one key per month, a running total as the value.",
        exercise: {
          title: "Revenue by month",
          task: "Write `total_by_month(rows)`. Each row is `(month, amount)`. Return a dict of month → total.",
          kind: "python",
          starterCode: 'def total_by_month(rows):\n    totals = {}\n    # add each amount to its month\n    return totals\n\nprint(total_by_month([("Jan", 120), ("Feb", 80), ("Jan", 30)]))\n',
          tests: 'assert total_by_month([("Jan", 120), ("Feb", 80), ("Jan", 30)]) == {"Jan": 150, "Feb": 80}, "Jan should add up to 150"\nassert total_by_month([]) == {}, "no rows gives an empty result"',
        },
        praise: "That's the same logic as a pivot table, written so it runs on a million rows.",
      },
      {
        intro: "Flagging unusual values is a daily task. First compute the mean, then keep the values above it.",
        exercise: {
          title: "Flag above-average days",
          task: "Write `above_average(values)` that returns the values strictly greater than the mean, in their original order. An empty list returns `[]`.",
          kind: "python",
          starterCode: "def above_average(values):\n    # compute the mean, then filter\n    return []\n\nprint(above_average([10, 20, 30, 40]))\n",
          tests: 'assert above_average([10, 20, 30, 40]) == [30, 40], "the mean is 25"\nassert above_average([5, 5, 5]) == [], "nothing is above an even average"\nassert above_average([]) == [], "empty input is safe"',
        },
        praise: "You handled the empty list before dividing, which is the bug that breaks most dashboards.",
      },
    ],
  },
  "product-designer": {
    quiz: [
      { q: "What should a designer understand before drawing screens?", options: ["The brand colors", "The user's problem", "The tech stack", "The launch date"], answer: 1 },
      { q: "3 of 5 test users can't find the coupon field. Best next step?", options: ["Ship anyway", "Move the field and retest", "Add a tutorial popup", "Test 50 more users"], answer: 1 },
      { q: "What's a wireframe?", options: ["A polished final screen", "A rough layout of a screen", "A coded prototype", "A logo sketch"], answer: 1 },
    ],
    tasks: [
      { intro: "Designers start from the data and the user, then propose changes they can test.", exercise: written("Fix the shipping step", "30% of users abandon checkout at the shipping step. Describe 3 changes you'd test there, and why each might help."), praise: "Each change came with a reason you could test, which is how design reviews go." },
      { intro: "Usability tests live or die on the questions. Good ones ask people to do things, not to give opinions.", exercise: written("Plan a usability test", "Write the 3 tasks you'd give people in a 15-minute test of a banking app's \"send money\" flow."), praise: "Your tasks ask people to act, not to guess what they'd like." },
    ],
  },
  "marketing-specialist": {
    quiz: [
      { q: "An ad cost **$500** and brought **25** customers. Cost per customer?", options: ["$20", "$25", "$12.50", "$50"], answer: 0 },
      { q: "What does an A/B test compare?", options: ["Two versions, to see which performs better", "Two platforms' prices", "Old and new customers", "Two competitors"], answer: 0 },
      { q: "Best subject line for a sale email to busy parents?", options: ["Newsletter #42", "20% off school lunch kits, today only", "Hello!", "Our company update"], answer: 1 },
    ],
    tasks: [
      { intro: "Good ads speak to one person with one problem, and every campaign has one number that tells you if it worked.", exercise: written("Write an ad", "Write a Facebook ad (a headline and 2 sentences) for a meal-kit service aimed at busy parents, then name the one metric you'd watch."), praise: "You wrote to one specific person and picked a metric you can act on." },
      { intro: "Funnels leak at different steps. Fix the biggest leak first.", exercise: written("Fix an email campaign", "Your campaign has a 22% open rate and a 0.8% click rate. Which number would you work on first, and what would you test?"), praise: "You went after the weakest step in the funnel first." },
    ],
  },
  "graphic-designer": {
    quiz: [
      { q: "Which pairing is usually easiest to read?", options: ["Dark text on a light background", "Yellow text on white", "Red text on green", "Light gray on white"], answer: 0 },
      { q: "What do brand guidelines define?", options: ["Salaries", "Logo use, colors and fonts", "Office hours", "Ad budgets"], answer: 1 },
      { q: "Which file type keeps a logo sharp at any size?", options: ["JPG", "PNG", "SVG (vector)", "GIF"], answer: 2 },
    ],
    tasks: [
      { intro: "Before opening any tool, designers decide hierarchy: what people should see first, second, third.", exercise: written("Plan a poster", "Brief: a poster for a neighborhood farmers market. Describe the layout, the 2 fonts and 3 colors you'd use, and why."), praise: "You explained choices by what people should notice first." },
      { intro: "Half the job is handling feedback without losing the design.", exercise: written("Answer a client", "A client says \"make the logo bigger\". Write your reply: your view, and one option you'd offer."), praise: "You took the feedback seriously and still protected the design." },
    ],
  },
  "business-development-manager": {
    quiz: [
      { q: "What's the main goal of a first cold email?", options: ["Close the deal", "Book a short call", "Send the price list", "Explain every feature"], answer: 1 },
      { q: "A prospect says \"It's too expensive.\" Best first response?", options: ["Offer 50% off", "Ask what they're comparing it to", "End the call", "Repeat the price"], answer: 1 },
      { q: "What does a CRM track?", options: ["Code changes", "Deals and customer conversations", "Employee hours", "Website traffic"], answer: 1 },
    ],
    tasks: [
      { intro: "A cold email has one job: earn a short call. Lead with their problem, not your product.", exercise: written("Write a cold email", "Write a cold email (max 90 words) to the operations director of a 50-person dental chain, offering appointment-reminder software. Goal: book a 15-minute call."), praise: "You led with their problem and asked for one small, clear next step." },
      { intro: "\"We already use something\" is the most common objection. Get curious instead of pushing.", exercise: written("Handle an objection", "The prospect replies: \"We already use another tool.\" Write your 2-3 sentence answer."), praise: "You asked a question instead of arguing, which keeps the deal alive." },
    ],
  },
  "product-manager": {
    quiz: [
      { q: "Users ask for 10 features. You can build 2. How do you choose?", options: ["Build the loudest requests", "Compare impact against effort", "Let engineers pick", "Build the easiest"], answer: 1 },
      { q: "What makes a good success metric?", options: ["Measurable and tied to the goal", "It's always revenue", "Easy to make go up", "Set by design"], answer: 0 },
      { q: "Who does a PM work with most, day to day?", options: ["Lawyers", "Engineers and designers", "Accountants", "Recruiters"], answer: 1 },
    ],
    tasks: [
      { intro: "PMs start with the problem, not the solution: who struggles, with what, and how you'd know it got better.", exercise: written("Write a problem statement", "30% of users abandon checkout. Write a 2-3 sentence problem statement: who is affected, what goes wrong, and one number you'd use to measure success."), praise: "You named a measurable outcome, which turns an opinion into something a team can check." },
      { intro: "Write down the criteria first, then decide. It makes the choice easy to explain to leadership.", exercise: written("Pick one and defend it", "You can ship one thing this month: (A) Apple Pay at checkout, or (B) a saved-cart reminder email. Choose one and give two reasons."), praise: "You tied your choice back to the problem, which is what interviewers listen for." },
    ],
  },
  "project-manager": {
    quiz: [
      { q: "A task slips two weeks and blocks two others. First move?", options: ["Wait and see", "Tell stakeholders and re-plan", "Hide it until it's fixed", "Cancel the project"], answer: 1 },
      { q: "What is a project's critical path?", options: ["The longest chain of dependent tasks", "The most expensive task", "The manager's to-do list", "The final meeting"], answer: 0 },
      { q: "What belongs in a weekly status update?", options: ["Progress, risks and decisions needed", "Every task detail", "Only good news", "Everyone's hours"], answer: 0 },
    ],
    tasks: [
      { intro: "Bad news travels best early, with a plan attached.", exercise: written("Flag a risk", "The website launch is in 3 weeks and the designer is out sick for a week. Write a 3-sentence update to your boss: the risk and your plan."), praise: "You flagged the risk early and came with a plan, not just a problem." },
      { intro: "A plan is tasks, owners and dates. Owners are roles, not \"the team\".", exercise: written("Plan a launch", "List the first 5 tasks, each with an owner (by role), for launching a company newsletter in 4 weeks."), praise: "Every task has one owner, so nothing falls between people." },
    ],
  },
};

function turn(partial: Partial<TutorTurn> & Pick<TutorTurn, "message" | "stage">): TutorTurn {
  return { quickReplies: [], level: null, exercise: null, taskCompleted: false, ...partial };
}

const quizQuestion = (script: RoleScript, i: number) =>
  turn({
    message: `Question ${i + 1} of 3: ${script.quiz[i].q}`,
    quickReplies: script.quiz[i].options,
    stage: "quiz",
  });

function levelFor(score: number, experience: string): string {
  const exp = EXPERIENCE.indexOf(experience);
  if (score === 3 && exp >= 2) return "Junior-ready basics";
  if (score >= 2) return "Beginner with good instincts";
  return "Complete beginner";
}

export function demoTutor(p: Profession, req: TutorRequest): TutorTurn {
  const script = SCRIPTS[p.slug];
  const answers = req.history.filter((m) => m.role === "user").map((m) => m.content);
  const role = p.name.toLowerCase();

  if (answers.length === 0) {
    return turn({
      message: `Hi! Let's see what a **${role}** really does, and whether you'd enjoy it. The role is summed up above. First, how much have you done this kind of work?`,
      quickReplies: EXPERIENCE,
      stage: "intro",
    });
  }
  if (answers.length === 1) {
    return turn({ message: `Thanks. Three quick questions so I can pitch the tasks at the right level.\n\n${quizQuestion(script, 0).message}`, quickReplies: script.quiz[0].options, stage: "quiz" });
  }
  if (answers.length <= 3) return quizQuestion(script, answers.length - 1);

  const quizAnswers = answers.slice(1, 4);
  const score = quizAnswers.filter((a, i) => a === script.quiz[i].options[script.quiz[i].answer]).length;
  const level = levelFor(score, answers[0]);

  if (answers.length === 4) {
    const misses = script.quiz
      .map((q, i) => (quizAnswers[i] === q.options[q.answer] ? null : `- ${q.q.replace(/\*\*/g, "")} → **${q.options[q.answer]}**`))
      .filter(Boolean);
    const first = script.tasks[0];
    return turn({
      message: `You got **${score} of 3**. Your level: **${level}**.${misses.length ? `\n\nWorth remembering:\n${misses.join("\n")}` : ""}\n\nNow a real task a junior ${role} gets in week one. ${first.intro}`,
      stage: "tasks",
      level,
      exercise: first.exercise,
    });
  }

  const last = answers[answers.length - 1];
  const doneTasks = req.tasksCompleted;

  if (FIT.includes(last) && doneTasks >= script.tasks.length) {
    const verdict =
      last === FIT[0]
        ? `That's a good sign. You passed ${doneTasks} real tasks and liked the work. The next step is a structured path: the skills a hiring manager checks, in order, with a project for your portfolio.`
        : last === FIT[1]
          ? `Fair. "OK" often means the work is fine but the domain doesn't excite you. Try one neighbouring role, then compare how each felt.`
          : `That's a useful answer too: you found out in 20 minutes, not after a $10,000 bootcamp. Try a role from another direction and compare.`;
    return turn({ message: verdict, stage: "done", level, quickReplies: [] });
  }

  if (last.startsWith("[Submission]")) {
    const current = script.tasks[doneTasks];
    if (!current) {
      return turn({ message: "You've finished this role's tasks. How did the work feel?", quickReplies: FIT, stage: "fit", level });
    }
    const passed = last.includes(PASS_MARK);
    if (current.exercise.kind === "written") {
      const answer = last.split("\n").slice(1).join("\n").trim();
      const words = answer.split(/\s+/).filter(Boolean).length;
      if (words < 20) {
        return turn({
          message: "Good start, but it's too short to judge. A hiring manager would want the *why* behind each point. Add a sentence or two and submit again.",
          stage: "tasks",
          level,
        });
      }
    } else if (!passed) {
      const why = last.match(/error: (.*)/)?.[1] ?? "a check failed";
      return turn({
        message: `Close. The check says: *${why}*. Look at what your code returns for that case, fix it and run the checks again.`,
        quickReplies: ["Give me a hint"],
        stage: "tasks",
        level,
      });
    }
    const next = script.tasks[doneTasks + 1];
    if (next) {
      return turn({
        message: `Passed. ${current.praise}\n\nNext task. ${next.intro}`,
        stage: "tasks",
        level,
        exercise: next.exercise,
        taskCompleted: true,
      });
    }
    return turn({
      message: `Passed. ${current.praise}\n\nThat's ${doneTasks + 1} real tasks done. Honestly: how did this work feel?`,
      quickReplies: FIT,
      stage: "fit",
      level,
      taskCompleted: true,
    });
  }

  if (/hint/i.test(last)) {
    return turn({
      message: "Start with the smallest case: write what your code should return for the first check, run it, then handle the next case.",
      stage: "tasks",
      level,
    });
  }

  return turn({
    message: "In demo mode I can only run the built-in tasks. With the AI mentor connected you can ask me anything; for now, try the task above.",
    stage: "tasks",
    level,
  });
}
