import type { PublicTask } from "../task";
import type { Fill, SceneNode } from "../workspace";
import { payButtonTask } from "./tasks";

// The product designer ladder: ten small screens, from rounding one corner to a dark-mode card.
// Each task is graded by the rule checks in src/server/grading/design-rules.ts.

const INK = "#141A27";
const SOFT = "#586176";
const MIST = "#EEF0F4";
const WASH = "#E8EDFF";
const BLUE = "#3D5AFE";
const WHITE = "#FFFFFF";

const solid = (color: string): Fill => ({ type: "solid", color });

const screen = (name: string, height: number, fill = WHITE): SceneNode => ({
  id: "screen",
  name,
  type: "frame",
  parentId: null,
  x: 0,
  y: 0,
  width: 390,
  height,
  radius: 16,
  fill: solid(fill),
  text: null,
  textColor: null,
  fontSize: null,
});

const text = (id: string, name: string, x: number, y: number, width: number, fontSize: number, content: string, color = INK, parentId = "screen"): SceneNode => ({
  id,
  name,
  type: "text",
  parentId,
  x,
  y,
  width,
  height: Math.round(fontSize * 1.5),
  radius: 0,
  fill: null,
  text: content,
  textColor: color,
  fontSize,
});

const rect = (
  id: string,
  name: string,
  x: number,
  y: number,
  width: number,
  height: number,
  o: { radius?: number; fill?: string; text?: string; textColor?: string; fontSize?: number; parentId?: string } = {},
): SceneNode => ({
  id,
  name,
  type: "rect",
  parentId: o.parentId ?? "screen",
  x,
  y,
  width,
  height,
  radius: o.radius ?? 0,
  fill: o.fill ? solid(o.fill) : null,
  text: o.text ?? null,
  textColor: o.text ? (o.textColor ?? WHITE) : null,
  fontSize: o.text ? (o.fontSize ?? 16) : null,
});

interface DesignRung {
  id: string;
  title: string;
  summary: string;
  minutes: number;
  from: string;
  body: string;
  requirements: string[];
  nodes: SceneNode[];
}

const designTask = (r: DesignRung): PublicTask => {
  const frame = r.nodes[0];
  return {
    card: { id: r.id, role: "product-designer", title: r.title, summary: r.summary, workspace: "design", language: null, minutes: r.minutes },
    ticket: { from: r.from, body: r.body, requirements: r.requirements },
    code: null,
    design: { scene: { width: frame.width, height: frame.height, nodes: r.nodes } },
    board: null,
  };
};

const RUNGS: DesignRung[] = [
  {
    id: "design-corners-1",
    title: "Softer corners",
    summary: "Round the corners of the promo card so it matches the rest of the app.",
    minutes: 3,
    from: "Anya, lead designer",
    body: "Our cards have rounded corners now, but the promo card on the home screen is still sharp and looks out of place. Round its corners to match the rest of the app.",
    requirements: ["Promo card corner radius 16"],
    nodes: [
      screen("Home", 330),
      text("greeting", "Greeting", 24, 28, 342, 24, "Good morning, Ana"),
      rect("promo", "Card / Promo", 24, 84, 342, 150, { fill: WASH }),
      text("promo-title", "Promo title", 44, 104, 302, 18, "Free delivery this week", INK, "promo"),
      text("promo-body", "Promo text", 44, 136, 302, 15, "On every order over $20", SOFT, "promo"),
      rect("promo-cta", "Button / Order now", 44, 176, 140, 40, { radius: 20, fill: BLUE, text: "Order now", fontSize: 15, parentId: "promo" }),
    ],
  },
  {
    id: "design-brand-color-1",
    title: "New brand blue",
    summary: "Switch the Sign up button to the new brand blue.",
    minutes: 4,
    from: "Leo, marketing",
    body: "We refreshed the brand: our blue is now **#3D5AFE**. The Sign up button on the welcome screen still uses the old blue. Switch it to the new one.",
    requirements: ["Sign up fill: solid #3D5AFE", "Button text contrast at least 4.5:1"],
    nodes: [
      screen("Welcome", 400),
      rect("hero", "Image / Hero", 24, 24, 342, 150, { radius: 16, fill: WASH }),
      text("title", "Title", 24, 196, 342, 24, "Welcome to Corner Coffee"),
      text("subtitle", "Subtitle", 24, 236, 342, 16, "Order ahead and skip the line.", SOFT),
      rect("signup", "Button / Sign up", 24, 300, 342, 52, { radius: 12, fill: "#1E88E5", text: "Sign up", fontSize: 17 }),
      text("login", "Log in link", 24, 362, 342, 15, "I already have an account", BLUE),
    ],
  },
  {
    id: "design-contrast-1",
    title: "Readable fine print",
    summary: "Customers can't read the delivery note. Fix its contrast, keep it small.",
    minutes: 5,
    from: "Omar, product page",
    body: "Customers over 50 tell us they can't read the delivery note under the price. Make it readable, but keep it small: it's fine print.",
    requirements: ["Delivery note contrast at least 4.5:1", "Keep the note at size 13"],
    nodes: [
      screen("Product", 380),
      rect("photo", "Image / Product", 24, 24, 342, 140, { radius: 12, fill: WASH }),
      text("name", "Product name", 24, 184, 342, 22, "Cold brew, 1 litre"),
      text("price", "Price", 24, 222, 342, 20, "$14.00"),
      text("note", "Note / Delivery", 24, 258, 342, 13, "Free delivery tomorrow before 10 am", "#B4BAC6"),
      rect("add", "Button / Add to cart", 24, 304, 342, 52, { radius: 12, fill: BLUE, text: "Add to cart" }),
    ],
  },
  {
    id: "design-type-scale-1",
    title: "Type hierarchy",
    summary: "The title and the body text are the same size. Apply the type scale.",
    minutes: 5,
    from: "Anya, lead designer",
    body: "On the article screen the title and the body text are the same size, so nothing stands out. Use our type scale: titles are **28**, body text is **16**.",
    requirements: ["Title size 28", "Body text size 16"],
    nodes: [
      screen("Article", 330),
      rect("cover", "Image / Cover", 24, 24, 342, 150, { radius: 12, fill: WASH }),
      { ...text("title", "Title", 24, 192, 342, 18, "Our roasting process"), height: 44 },
      text("body", "Body", 24, 248, 342, 18, "Small batches, roasted every Monday."),
      text("meta", "Read time", 24, 284, 342, 13, "5 min read", SOFT),
    ],
  },
  {
    id: "design-align-1",
    title: "Line up the edges",
    summary: "The name, email and button start at different places. Align them.",
    minutes: 5,
    from: "Anya, lead designer",
    body: "The profile screen looks messy: the name, the email and the button each start at a different place. Line their left edges up with the avatar, on our 24 px margin.",
    requirements: ["Name, email and Edit profile start at x 24"],
    nodes: [
      screen("Profile", 400),
      rect("avatar", "Avatar", 24, 32, 64, 64, { radius: 32, fill: WASH, text: "AS", textColor: "#2843E6", fontSize: 20 }),
      text("name", "Name", 31, 116, 300, 22, "Ana Silva"),
      text("email", "Email", 19, 154, 300, 15, "ana@shop.com", SOFT),
      text("since", "Member since", 24, 182, 300, 13, "Member since 2024", SOFT),
      rect("edit", "Button / Edit profile", 28, 316, 334, 52, { radius: 12, fill: MIST, text: "Edit profile", textColor: INK }),
    ],
  },
  {
    id: "design-tap-target-1",
    title: "Big enough to tap",
    summary: "People keep missing the tiny close button. Make it a proper touch target.",
    minutes: 6,
    from: "Nina, operations",
    body: "People keep missing the close button on the cart. Apple and Google both recommend touch targets of at least **44 × 44**. Make it bigger, and keep it in the top right corner on our 24 px margin.",
    requirements: ["Close button at least 44 × 44", "Its right edge stays at x 366", "It stays inside the screen"],
    nodes: [
      screen("Cart", 420),
      text("title", "Title", 24, 28, 260, 24, "Your cart"),
      rect("close", "Button / Close", 342, 32, 24, 24, { radius: 12, fill: MIST, text: "✕", textColor: INK, fontSize: 12 }),
      text("item-1", "Item / Cold brew", 24, 100, 342, 16, "Cold brew, 1 litre    $14.00"),
      text("item-2", "Item / Croissant", 24, 134, 342, 16, "Croissant    $3.50"),
      text("total", "Total", 24, 184, 342, 18, "Total    $17.50"),
      rect("checkout", "Button / Checkout", 24, 344, 342, 52, { radius: 12, fill: BLUE, text: "Checkout" }),
    ],
  },
  {
    id: "design-spacing-1",
    title: "Even spacing",
    summary: "The gaps between the settings rows jump around. Make them even.",
    minutes: 7,
    from: "Anya, lead designer",
    body: "The settings list feels uneven: the gaps between the rows jump around. Our spacing scale is 8, 16 and 24. Make every gap between two rows exactly **16**.",
    requirements: ["16 px between every two rows", "Rows keep their size, 342 × 56"],
    nodes: [
      screen("Settings", 400),
      text("title", "Title", 24, 24, 342, 24, "Settings"),
      rect("row-1", "Row / Notifications", 24, 80, 342, 56, { radius: 12, fill: MIST, text: "Notifications", textColor: INK }),
      rect("row-2", "Row / Privacy", 24, 146, 342, 56, { radius: 12, fill: MIST, text: "Privacy", textColor: INK }),
      rect("row-3", "Row / Payment", 24, 222, 342, 56, { radius: 12, fill: MIST, text: "Payment methods", textColor: INK }),
      rect("row-4", "Row / Help", 24, 290, 342, 56, { radius: 12, fill: MIST, text: "Help", textColor: INK }),
    ],
  },
  {
    id: "design-center-1",
    title: "Center the button",
    summary: "The Start shopping button sits off to the left. Center it on the screen.",
    minutes: 6,
    from: "Omar, product page",
    body: "On the empty cart screen, the **Start shopping** button sits off to the left. Center it horizontally on the screen, without changing its size.",
    requirements: ["Same space to the left and to the right of the button", "The button stays 220 wide"],
    nodes: [
      screen("Empty cart", 400),
      rect("art", "Illustration", 135, 56, 120, 120, { radius: 60, fill: WASH }),
      text("title", "Title", 92, 200, 220, 22, "Your cart is empty"),
      text("body", "Text", 92, 240, 230, 15, "Find something you'll love.", SOFT),
      rect("shop", "Button / Start shopping", 40, 300, 220, 52, { radius: 26, fill: BLUE, text: "Start shopping" }),
    ],
  },
  {
    id: "design-dark-card-1",
    title: "Dark mode card",
    summary: "The order card glares in dark mode. Make it dark and keep it readable.",
    minutes: 8,
    from: "Anya, lead designer",
    body: "We're shipping dark mode. The order card is still bright white and glares on the dark screen. Make the card dark and keep both lines of text readable. In dark mode, titles need extra contrast: **7:1**.",
    requirements: ["Card fill: solid and dark (white text on it reaches 7:1)", "Order title contrast at least 7:1", "Subtitle contrast at least 4.5:1"],
    nodes: [
      screen("Orders", 300, "#0E1220"),
      text("heading", "Heading", 24, 28, 342, 24, "Orders", WHITE),
      rect("card", "Card / Order", 24, 84, 342, 120, { radius: 16, fill: WHITE }),
      text("card-title", "Order title", 44, 106, 302, 18, "Order #1042", INK, "card"),
      text("card-sub", "Order subtitle", 44, 142, 302, 15, "Arriving today, 2–4 pm", SOFT, "card"),
    ],
  },
];

const tasks = RUNGS.map(designTask);
const [corners, brand, contrast, type, align, tap, spacing, center, dark] = tasks;

/** The new design tasks; the Pay button task lives in tasks.ts. */
export const DESIGN_TASKS: PublicTask[] = tasks;

/** Ten rungs, easiest first. The Pay button ticket combines gradient, radius and contrast. */
export const DESIGN_LADDER: string[] = [corners, brand, contrast, type, align, tap, spacing, center, payButtonTask, dark].map((t) => t.card.id);
