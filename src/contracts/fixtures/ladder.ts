import type { CodeLanguageSchema, PublicTask } from "../task";
import type { z } from "zod";
import { doublePayTask } from "./tasks";

// Backend task ladders, from a first function to the "Double payment" ticket.
// The interview picks the language and the starting rung; each pass unlocks the next.
// Hidden tests and solutions are in src/server/tasks/ladder-private.ts.

export type LadderLanguage = z.infer<typeof CodeLanguageSchema>;

interface Rung {
  id: string;
  title: string;
  summary: string;
  minutes: number;
  from: string;
  body: string;
  requirements: string[];
  file: string;
  starter: string;
  visibleTests: string;
}

const codeTask = (language: LadderLanguage, r: Rung): PublicTask => ({
  card: { id: r.id, role: "backend-engineer", title: r.title, summary: r.summary, workspace: "code", language, minutes: r.minutes },
  ticket: { from: r.from, body: r.body, requirements: r.requirements },
  code: { entry: r.file, files: [{ path: r.file, readonly: false, content: r.starter }], visibleTests: r.visibleTests },
  design: null,
  board: null,
});

// First steps for people who have never coded: print, variables, math, text, if, loops.
// Tests read what the program printed (__output__) and its code (__source__).
const PYTHON_BASICS: Rung[] = [
  {
    id: "py-hello-world",
    title: "Hello, World!",
    summary: "Your first line of code: make the program print a greeting.",
    minutes: 3,
    from: "Sam, your team lead",
    body: "Every engineer's first program prints a greeting. Change the line in the editor so the program prints exactly **Hello, World!** Then press **Run** to see it.",
    requirements: ["The program prints `Hello, World!`", "Same capital letters, comma and exclamation mark"],
    file: "hello.py",
    starter: `# Your first line of code!
# print("...") shows the text in quotes on the screen.
# Change the text so it says exactly: Hello, World!
print("Hello")
`,
    visibleTests: `_out = __output__.strip().splitlines()
assert _out, "the program didn't print anything: use print(...)"
assert _out[0] == "Hello, World!", f'expected "Hello, World!", got {_out[0]!r}'
`,
  },
  {
    id: "py-print-lines",
    title: "Receipt header",
    summary: "Print the three header lines of a coffee shop receipt.",
    minutes: 3,
    from: "Priya, checkout team",
    body: "Our receipt printer needs a header. Print these three lines, in this order:\n\n```\nCorner Coffee\n123 Main St\nThank you!\n```",
    requirements: ["Three lines, one `print` each", "Same text and order as above"],
    file: "receipt.py",
    starter: `# Each print(...) shows one line.
# Print these three lines, in this order:
#   Corner Coffee
#   123 Main St
#   Thank you!
print("Corner Coffee")
`,
    visibleTests: `_out = [line.strip() for line in __output__.strip().splitlines()]
assert _out == ["Corner Coffee", "123 Main St", "Thank you!"], f"expected the three header lines, got {_out}"
`,
  },
  {
    id: "py-variables",
    title: "Greet a customer by name",
    summary: "Use a variable so the greeting shows the customer's name.",
    minutes: 5,
    from: "Sam, support lead",
    body: "The customer's name is stored in the variable `name`. Print a greeting that uses it: **Hello, Ana!** Use the variable, not the word Ana, so it still works when the name changes.",
    requirements: ["Prints `Hello, Ana!`", "Uses the `name` variable"],
    file: "greet.py",
    starter: `name = "Ana"

# A variable keeps a value under a name, like a labeled box.
# + glues text together: "Good " + "morning" gives "Good morning".
# Print a greeting that uses the name variable.
print("Hello!")
`,
    visibleTests: `_out = __output__.strip().splitlines()
assert _out and _out[0] == "Hello, Ana!", f'expected "Hello, Ana!", got {_out[0] if _out else "nothing"!r}'
`,
  },
  {
    id: "py-arithmetic",
    title: "Three lattes",
    summary: "Let the program work out how much 3 lattes at $4 cost.",
    minutes: 5,
    from: "Priya, checkout team",
    body: "A customer orders 3 lattes at $4 each. The price and the quantity are already in variables. Print the total, worked out by the program: **12**.",
    requirements: ["Prints `12`", "Works it out from `price` and `quantity`"],
    file: "order.py",
    starter: `price = 4
quantity = 3

# Python can do math: + adds, - subtracts, * multiplies.
# Print the total cost: price times quantity.
print(price + quantity)
`,
    visibleTests: `_out = __output__.strip().splitlines()
assert _out and _out[0] == "12", f"3 lattes at $4 should be 12, got {_out[0] if _out else 'nothing'}"
`,
  },
  {
    id: "py-format",
    title: "Receipt line",
    summary: "Build the receipt line Latte: $12 from two variables.",
    minutes: 5,
    from: "Priya, checkout team",
    body: "Each receipt line shows the item and its total, like **Latte: $12**. Build it from the variables `item` and `total`.",
    requirements: ["Prints `Latte: $12`", "Uses `item` and `total`, not fixed text"],
    file: "receipt_line.py",
    starter: `item = "Latte"
total = 12

# An f-string puts variables inside text:
#   f"{name} is {age}"
# Print the receipt line: Latte: $12
print(item, total)
`,
    visibleTests: `_out = __output__.strip().splitlines()
assert _out and _out[0] == "Latte: $12", f'expected "Latte: $12", got {_out[0] if _out else "nothing"!r}'
`,
  },
  {
    id: "py-if-else",
    title: "In stock or not",
    summary: "Show In stock or Out of stock depending on the stock count.",
    minutes: 5,
    from: "Omar, product page",
    body: "The product page should say **In stock** when `stock` is above 0, and **Out of stock** when it's 0. Right now it always says In stock.",
    requirements: ["Stock above 0: prints `In stock`", "Stock 0: prints `Out of stock`", "Prints only one line"],
    file: "stock.py",
    starter: `stock = 0

# if / else lets the program choose between two paths. For example:
#   if age >= 18:
#       print("Adult")
#   else:
#       print("Minor")
# Print "In stock" when stock is above 0, otherwise "Out of stock".
print("In stock")
`,
    visibleTests: `_out = __output__.strip().splitlines()
assert _out == ["Out of stock"], f'with stock = 0 it should print "Out of stock", got {_out}'
`,
  },
  {
    id: "py-for-loop",
    title: "Print the menu",
    summary: "Print every drink on the menu, one per line.",
    minutes: 5,
    from: "Nina, operations",
    body: "The menu board shows every drink, one per line. Print each drink from the `menu` list, in order. It has to work for any menu, not just these three.",
    requirements: ["Prints every drink, one per line", "Keeps the order of the list", "Works for any menu"],
    file: "menu.py",
    starter: `menu = ["Espresso", "Latte", "Mocha"]

# A for loop repeats code for every item in a list. For example:
#   for color in ["red", "blue"]:
#       print(color)
# Print every drink on the menu, one per line.
print(menu[0])
`,
    visibleTests: `_out = [line.strip() for line in __output__.strip().splitlines()]
assert _out == ["Espresso", "Latte", "Mocha"], f"expected the 3 drinks, one per line, got {_out}"
`,
  },
];

const PYTHON: Rung[] = [
  {
    id: "py-welcome",
    title: "Welcome message",
    summary: "Greet new customers by name on their account page.",
    minutes: 5,
    from: "Sam, support lead",
    body: "New customers see a welcome line at the top of their account page. Right now everyone gets just **Welcome!**. Make it greet them by name.",
    requirements: ['`welcome("Ana")` returns `"Welcome, Ana!"`', "Keep the comma and the exclamation mark", "Return the text, don't print it"],
    file: "welcome.py",
    starter: `# A function is a named piece of code: it takes input (name)
# and gives a result back with return.
def welcome(name):
    # TODO: put the customer's name into the message
    # Tip: f"Hello, {name}" puts a variable inside text
    return "Welcome!"
`,
    visibleTests: `assert welcome("Ana") == "Welcome, Ana!", f'expected "Welcome, Ana!", got {welcome("Ana")!r}'
`,
  },
  {
    id: "py-free-shipping",
    title: "Free shipping over $50",
    summary: "Orders of $50 or more ship free; smaller ones pay $5.99.",
    minutes: 10,
    from: "Leo, marketing",
    body: "We're launching **free shipping on orders of $50 or more**. Below that, shipping stays **$5.99**. The checkout still charges everyone.",
    requirements: ["$50 or more ships free (returns 0)", "Under $50 pays 5.99", "Exactly $50 counts as free"],
    file: "shipping.py",
    starter: `def shipping_cost(order_total):
    # TODO: orders of $50 or more ship free
    # Tip: if order_total >= 50: ...
    return 5.99
`,
    visibleTests: `assert shipping_cost(80) == 0, f"an $80 order should ship free, got {shipping_cost(80)}"
assert shipping_cost(20) == 5.99, f"a $20 order should pay 5.99, got {shipping_cost(20)}"
`,
  },
  {
    id: "py-cart-total",
    title: "Cart total",
    summary: "Add up everything in the cart: price times quantity for each item.",
    minutes: 10,
    from: "Priya, checkout team",
    body: "The cart page needs one number: the total of everything in the cart. Each item has a `price` and a `qty`.",
    requirements: ["Adds price × qty for every item", "An empty cart totals 0"],
    file: "cart.py",
    starter: `def cart_total(items):
    total = 0
    # TODO: add price * qty for every item in the cart
    # Tip: for item in items: ...
    return total
`,
    visibleTests: `cart = [{"name": "Mug", "price": 12, "qty": 2}, {"name": "Beans", "price": 18, "qty": 1}]
assert cart_total(cart) == 42, f"2 mugs at $12 and 1 bag at $18 should be 42, got {cart_total(cart)}"
`,
  },
  {
    id: "py-status-count",
    title: "Orders by status",
    summary: "Count how many orders are in each status for the morning report.",
    minutes: 15,
    from: "Nina, operations",
    body: "Every morning I count orders by status by hand. Write a function that tells me how many orders are in each status.",
    requirements: ['Returns a dict like `{"shipped": 2, "pending": 1}`', "Only statuses that appear are in the result", "No orders gives `{}`"],
    file: "report.py",
    starter: `def count_by_status(orders):
    counts = {}
    # TODO: count how many orders have each status
    return counts
`,
    visibleTests: `orders = [{"id": 1, "status": "shipped"}, {"id": 2, "status": "pending"}, {"id": 3, "status": "shipped"}]
assert count_by_status(orders) == {"shipped": 2, "pending": 1}, f"got {count_by_status(orders)}"
`,
  },
  {
    id: "py-email-check",
    title: "Check sign-up emails",
    summary: "Reject sign-up emails that are clearly broken, like ana.gmail.com.",
    minutes: 15,
    from: "Omar, growth",
    body: "People sign up with typos like `ana.gmail.com` or `ana@gmailcom`, and we can never reach them. Reject emails that are clearly broken.",
    requirements: ["Exactly one `@`", "Something before the `@`", "A dot in the part after the `@`", "Spaces around the email are ignored"],
    file: "signup.py",
    starter: `def is_valid_email(email):
    # TODO: return True only for emails that look real
    return "@" in email
`,
    visibleTests: `assert is_valid_email("ana@shop.com") is True, "ana@shop.com is a real email"
assert is_valid_email("ana@shopcom") is False, "ana@shopcom has no dot after the @"
`,
  },
  {
    id: "py-find-customer",
    title: "Find a customer by id",
    summary: "The support tool crashes when a customer id doesn't exist.",
    minutes: 15,
    from: "Sam, support lead",
    body: "The support tool crashes when an agent types an id that doesn't exist. `find_customer` should return the customer, or `None` when there's no such customer. Ids from the address bar arrive as text, like `\"102\"`.",
    requirements: ["Returns the customer for a known id", "Returns `None` for an unknown id", 'Accepts ids that arrive as text, like `"102"`', "Returns `None` for text that isn't a number"],
    file: "customers.py",
    starter: `customers = [
    {"id": 101, "name": "Ana Silva", "email": "ana@shop.com"},
    {"id": 102, "name": "Jordan Lee", "email": "jordan@mail.com"},
    {"id": 103, "name": "Mei Chen", "email": "mei@shop.com"},
]


def find_customer(customer_id):
    for customer in customers:
        if customer["id"] == customer_id:
            return customer
    # Bug: an unknown id crashes the support tool
    raise KeyError(customer_id)
`,
    visibleTests: `assert find_customer(102)["name"] == "Jordan Lee", "id 102 is Jordan Lee"
assert find_customer(999) is None, "an unknown id should give None, not an error"
`,
  },
  {
    id: "py-discount-codes",
    title: "Discount codes",
    summary: "Make the newsletter promo codes SAVE10 and FLAT5 work at checkout.",
    minutes: 20,
    from: "Leo, marketing",
    body: "Tomorrow's newsletter has two promo codes: `SAVE10` takes **10% off** and `FLAT5` takes **$5 off**. People type codes in any case. Unknown codes change nothing, and a total can never go below $0.",
    requirements: ["`SAVE10`: 10% off", "`FLAT5`: $5 off", "Codes work in any letter case", "Unknown code: total unchanged", "Never below 0, rounded to cents"],
    file: "promo.py",
    starter: `def apply_discount(total, code):
    # TODO: SAVE10 takes 10% off, FLAT5 takes $5 off
    return total
`,
    visibleTests: `assert apply_discount(40, "SAVE10") == 36, f"SAVE10 on $40 should give 36, got {apply_discount(40, 'SAVE10')}"
assert apply_discount(40, "FLAT5") == 35, f"FLAT5 on $40 should give 35, got {apply_discount(40, 'FLAT5')}"
`,
  },
  {
    id: "py-paginate",
    title: "Page through orders",
    summary: "The orders list loads 3,000 orders at once. Return one page at a time.",
    minutes: 20,
    from: "Nina, operations",
    body: "The orders list loads all 3,000 orders at once and the page freezes. Return one page at a time: pages start at 1, with `per_page` orders on each.",
    requirements: ["Page 1 has the first `per_page` items", "The last page can be shorter", "A page past the end, or page 0 and below, is empty"],
    file: "orders.py",
    starter: `def paginate(items, page, per_page):
    # TODO: return only the items on this page (pages start at 1)
    return items
`,
    visibleTests: `orders = list(range(1, 26))
assert paginate(orders, 1, 10) == list(range(1, 11)), f"page 1 should be orders 1-10, got {paginate(orders, 1, 10)}"
assert paginate(orders, 3, 10) == [21, 22, 23, 24, 25], f"page 3 should be orders 21-25, got {paginate(orders, 3, 10)}"
`,
  },
];

const JAVASCRIPT_BASICS: Rung[] = [
  {
    id: "js-hello-world",
    title: "Hello, World!",
    summary: "Your first line of code: make the program print a greeting.",
    minutes: 3,
    from: "Sam, your team lead",
    body: "Every engineer's first program prints a greeting. Change the line in the editor so the program prints exactly **Hello, World!** Then press **Run** to see it.",
    requirements: ["The program prints `Hello, World!`", "Same capital letters, comma and exclamation mark"],
    file: "hello.js",
    starter: `// Your first line of code!
// console.log("...") shows the text in quotes.
// Change the text so it says exactly: Hello, World!
console.log("Hello");
`,
    visibleTests: `const printed = __output__.trim().split("\\n");
assert(printed[0] === "Hello, World!", 'expected "Hello, World!", got ' + JSON.stringify(printed[0]));
`,
  },
  {
    id: "js-print-lines",
    title: "Receipt header",
    summary: "Print the three header lines of a coffee shop receipt.",
    minutes: 3,
    from: "Priya, checkout team",
    body: "Our receipt printer needs a header. Print these three lines, in this order:\n\n```\nCorner Coffee\n123 Main St\nThank you!\n```",
    requirements: ["Three lines, one `console.log` each", "Same text and order as above"],
    file: "receipt.js",
    starter: `// Each console.log(...) shows one line.
// Print these three lines, in this order:
//   Corner Coffee
//   123 Main St
//   Thank you!
console.log("Corner Coffee");
`,
    visibleTests: `const printed = __output__.trim().split("\\n").map((l) => l.trim());
assert(JSON.stringify(printed) === JSON.stringify(["Corner Coffee", "123 Main St", "Thank you!"]), "expected the three header lines, got " + JSON.stringify(printed));
`,
  },
  {
    id: "js-variables",
    title: "Greet a customer by name",
    summary: "Use a variable so the greeting shows the customer's name.",
    minutes: 5,
    from: "Sam, support lead",
    body: "The customer's name is stored in the variable `name`. Print a greeting that uses it: **Hello, Ana!** Use the variable, not the word Ana, so it still works when the name changes.",
    requirements: ["Prints `Hello, Ana!`", "Uses the `name` variable"],
    file: "greet.js",
    starter: `const name = "Ana";

// A variable keeps a value under a name, like a labeled box.
// + glues text together: "Good " + "morning" gives "Good morning".
// Print a greeting that uses the name variable.
console.log("Hello!");
`,
    visibleTests: `const printed = __output__.trim().split("\\n");
assert(printed[0] === "Hello, Ana!", 'expected "Hello, Ana!", got ' + JSON.stringify(printed[0]));
`,
  },
  {
    id: "js-arithmetic",
    title: "Three lattes",
    summary: "Let the program work out how much 3 lattes at $4 cost.",
    minutes: 5,
    from: "Priya, checkout team",
    body: "A customer orders 3 lattes at $4 each. The price and the quantity are already in variables. Print the total, worked out by the program: **12**.",
    requirements: ["Prints `12`", "Works it out from `price` and `quantity`"],
    file: "order.js",
    starter: `const price = 4;
const quantity = 3;

// JavaScript can do math: + adds, - subtracts, * multiplies.
// Print the total cost: price times quantity.
console.log(price + quantity);
`,
    visibleTests: `const printed = __output__.trim().split("\\n");
assert(printed[0] === "12", "3 lattes at $4 should be 12, got " + printed[0]);
`,
  },
  {
    id: "js-format",
    title: "Receipt line",
    summary: "Build the receipt line Latte: $12 from two variables.",
    minutes: 5,
    from: "Priya, checkout team",
    body: "Each receipt line shows the item and its total, like **Latte: $12**. Build it from the variables `item` and `total`.",
    requirements: ["Prints `Latte: $12`", "Uses `item` and `total`, not fixed text"],
    file: "receipt-line.js",
    starter: `const item = "Latte";
const total = 12;

// + joins text and variables:
//   name + " is " + age
// Print the receipt line: Latte: $12
console.log(item, total);
`,
    visibleTests: `const printed = __output__.trim().split("\\n");
assert(printed[0] === "Latte: $12", 'expected "Latte: $12", got ' + JSON.stringify(printed[0]));
`,
  },
  {
    id: "js-if-else",
    title: "In stock or not",
    summary: "Show In stock or Out of stock depending on the stock count.",
    minutes: 5,
    from: "Omar, product page",
    body: "The product page should say **In stock** when `stock` is above 0, and **Out of stock** when it's 0. Right now it always says In stock.",
    requirements: ["Stock above 0: prints `In stock`", "Stock 0: prints `Out of stock`", "Prints only one line"],
    file: "stock.js",
    starter: `const stock = 0;

// if / else lets the program choose between two paths. For example:
//   if (age >= 18) {
//     console.log("Adult");
//   } else {
//     console.log("Minor");
//   }
// Print "In stock" when stock is above 0, otherwise "Out of stock".
console.log("In stock");
`,
    visibleTests: `const printed = __output__.trim().split("\\n");
assert(printed.length === 1 && printed[0] === "Out of stock", 'with stock = 0 it should print "Out of stock", got ' + JSON.stringify(printed));
`,
  },
  {
    id: "js-for-loop",
    title: "Print the menu",
    summary: "Print every drink on the menu, one per line.",
    minutes: 5,
    from: "Nina, operations",
    body: "The menu board shows every drink, one per line. Print each drink from the `menu` list, in order. It has to work for any menu, not just these three.",
    requirements: ["Prints every drink, one per line", "Keeps the order of the list", "Works for any menu"],
    file: "menu.js",
    starter: `const menu = ["Espresso", "Latte", "Mocha"];

// A for loop repeats code for every item in a list. For example:
//   for (const color of ["red", "blue"]) {
//     console.log(color);
//   }
// Print every drink on the menu, one per line.
console.log(menu[0]);
`,
    visibleTests: `const printed = __output__.trim().split("\\n").map((l) => l.trim());
assert(JSON.stringify(printed) === JSON.stringify(["Espresso", "Latte", "Mocha"]), "expected the 3 drinks, one per line, got " + JSON.stringify(printed));
`,
  },
];

const JAVASCRIPT: Rung[] = [
  {
    id: "js-welcome",
    title: "Welcome message",
    summary: "Greet new customers by name on their account page.",
    minutes: 5,
    from: "Sam, support lead",
    body: "New customers see a welcome line at the top of their account page. Right now everyone gets just **Welcome!**. Make it greet them by name.",
    requirements: ['`welcome("Ana")` returns `"Welcome, Ana!"`', "Keep the comma and the exclamation mark", "Return the text, don't log it"],
    file: "welcome.js",
    starter: `// A function is a named piece of code: it takes input (name)
// and gives a result back with return.
function welcome(name) {
  // TODO: put the customer's name into the message
  // Tip: "Hello, " + name joins text and a variable
  return "Welcome!";
}
`,
    visibleTests: `assert(welcome("Ana") === "Welcome, Ana!", 'expected "Welcome, Ana!", got ' + JSON.stringify(welcome("Ana")));
`,
  },
  {
    id: "js-free-shipping",
    title: "Free shipping over $50",
    summary: "Orders of $50 or more ship free; smaller ones pay $5.99.",
    minutes: 10,
    from: "Leo, marketing",
    body: "We're launching **free shipping on orders of $50 or more**. Below that, shipping stays **$5.99**. The checkout still charges everyone.",
    requirements: ["$50 or more ships free (returns 0)", "Under $50 pays 5.99", "Exactly $50 counts as free"],
    file: "shipping.js",
    starter: `function shippingCost(orderTotal) {
  // TODO: orders of $50 or more ship free
  // Tip: if (orderTotal >= 50) { ... }
  return 5.99;
}
`,
    visibleTests: `assert(shippingCost(80) === 0, "an $80 order should ship free, got " + shippingCost(80));
assert(shippingCost(20) === 5.99, "a $20 order should pay 5.99, got " + shippingCost(20));
`,
  },
  {
    id: "js-cart-total",
    title: "Cart total",
    summary: "Add up everything in the cart: price times quantity for each item.",
    minutes: 10,
    from: "Priya, checkout team",
    body: "The cart page needs one number: the total of everything in the cart. Each item has a `price` and a `qty`.",
    requirements: ["Adds price × qty for every item", "An empty cart totals 0"],
    file: "cart.js",
    starter: `function cartTotal(items) {
  let total = 0;
  // TODO: add price * qty for every item in the cart
  // Tip: for (const item of items) { ... }
  return total;
}
`,
    visibleTests: `const cart = [{ name: "Mug", price: 12, qty: 2 }, { name: "Beans", price: 18, qty: 1 }];
assert(cartTotal(cart) === 42, "2 mugs at $12 and 1 bag at $18 should be 42, got " + cartTotal(cart));
`,
  },
  {
    id: "js-status-count",
    title: "Orders by status",
    summary: "Count how many orders are in each status for the morning report.",
    minutes: 15,
    from: "Nina, operations",
    body: "Every morning I count orders by status by hand. Write a function that tells me how many orders are in each status.",
    requirements: ['Returns an object like `{ shipped: 2, pending: 1 }`', "Only statuses that appear are in the result", "No orders gives `{}`"],
    file: "report.js",
    starter: `function countByStatus(orders) {
  const counts = {};
  // TODO: count how many orders have each status
  return counts;
}
`,
    visibleTests: `const orders = [{ id: 1, status: "shipped" }, { id: 2, status: "pending" }, { id: 3, status: "shipped" }];
const report = countByStatus(orders);
assert(report.shipped === 2 && report.pending === 1 && Object.keys(report).length === 2, "expected { shipped: 2, pending: 1 }, got " + JSON.stringify(report));
`,
  },
  {
    id: "js-email-check",
    title: "Check sign-up emails",
    summary: "Reject sign-up emails that are clearly broken, like ana.gmail.com.",
    minutes: 15,
    from: "Omar, growth",
    body: "People sign up with typos like `ana.gmail.com` or `ana@gmailcom`, and we can never reach them. Reject emails that are clearly broken.",
    requirements: ["Exactly one `@`", "Something before the `@`", "A dot in the part after the `@`", "Spaces around the email are ignored"],
    file: "signup.js",
    starter: `function isValidEmail(email) {
  // TODO: return true only for emails that look real
  return email.includes("@");
}
`,
    visibleTests: `assert(isValidEmail("ana@shop.com") === true, "ana@shop.com is a real email");
assert(isValidEmail("ana@shopcom") === false, "ana@shopcom has no dot after the @");
`,
  },
  {
    id: "js-find-customer",
    title: "Find a customer by id",
    summary: "The support tool crashes when a customer id doesn't exist.",
    minutes: 15,
    from: "Sam, support lead",
    body: "The support tool crashes when an agent types an id that doesn't exist. `findCustomer` should return the customer, or `null` when there's no such customer. Ids from the address bar arrive as text, like `\"102\"`.",
    requirements: ["Returns the customer for a known id", "Returns `null` for an unknown id", 'Accepts ids that arrive as text, like `"102"`', "Returns `null` for text that isn't a number"],
    file: "customers.js",
    starter: `const customers = [
  { id: 101, name: "Ana Silva", email: "ana@shop.com" },
  { id: 102, name: "Jordan Lee", email: "jordan@mail.com" },
  { id: 103, name: "Mei Chen", email: "mei@shop.com" },
];

function findCustomer(customerId) {
  for (const customer of customers) {
    if (customer.id === customerId) return customer;
  }
  // Bug: an unknown id crashes the support tool
  throw new Error("No customer " + customerId);
}
`,
    visibleTests: `assert(findCustomer(102).name === "Jordan Lee", "id 102 is Jordan Lee");
let missing;
try { missing = findCustomer(999); } catch (e) { missing = "an error: " + e.message; }
assert(missing === null, "an unknown id should give null, got " + missing);
`,
  },
  {
    id: "js-discount-codes",
    title: "Discount codes",
    summary: "Make the newsletter promo codes SAVE10 and FLAT5 work at checkout.",
    minutes: 20,
    from: "Leo, marketing",
    body: "Tomorrow's newsletter has two promo codes: `SAVE10` takes **10% off** and `FLAT5` takes **$5 off**. People type codes in any case. Unknown codes change nothing, and a total can never go below $0.",
    requirements: ["`SAVE10`: 10% off", "`FLAT5`: $5 off", "Codes work in any letter case", "Unknown code: total unchanged", "Never below 0, rounded to cents"],
    file: "promo.js",
    starter: `function applyDiscount(total, code) {
  // TODO: SAVE10 takes 10% off, FLAT5 takes $5 off
  return total;
}
`,
    visibleTests: `assert(applyDiscount(40, "SAVE10") === 36, "SAVE10 on $40 should give 36, got " + applyDiscount(40, "SAVE10"));
assert(applyDiscount(40, "FLAT5") === 35, "FLAT5 on $40 should give 35, got " + applyDiscount(40, "FLAT5"));
`,
  },
  {
    id: "js-paginate",
    title: "Page through orders",
    summary: "The orders list loads 3,000 orders at once. Return one page at a time.",
    minutes: 20,
    from: "Nina, operations",
    body: "The orders list loads all 3,000 orders at once and the page freezes. Return one page at a time: pages start at 1, with `perPage` orders on each.",
    requirements: ["Page 1 has the first `perPage` items", "The last page can be shorter", "A page past the end, or page 0 and below, is empty"],
    file: "orders.js",
    starter: `function paginate(items, page, perPage) {
  // TODO: return only the items on this page (pages start at 1)
  return items;
}
`,
    visibleTests: `const orders = Array.from({ length: 25 }, (_, i) => i + 1);
assert(JSON.stringify(paginate(orders, 1, 10)) === "[1,2,3,4,5,6,7,8,9,10]", "page 1 should be orders 1-10, got " + JSON.stringify(paginate(orders, 1, 10)));
assert(JSON.stringify(paginate(orders, 3, 10)) === "[21,22,23,24,25]", "page 3 should be orders 21-25, got " + JSON.stringify(paginate(orders, 3, 10)));
`,
  },
  {
    id: "js-double-pay",
    title: "Double payment",
    summary: "A customer tapped Pay twice and got charged twice. Make retries safe.",
    minutes: 20,
    from: "Maria, payments team lead",
    body: "A customer tapped **Pay** twice and we charged them twice. Fix the handler so a retry with the same key doesn't create a second payment.",
    requirements: ["The key comes in the `Idempotency-Key` header", "A retry returns the first payment", "Don't change the payments table"],
    file: "handler.js",
    starter: `const payments = []; // in-memory "payments" table

function createPayment(orderId, amount, key) {
  const payment = { id: payments.length + 1, orderId, amount, key };
  payments.push(payment);
  return payment;
}

function handlePay(request) {
  const key = request.headers["Idempotency-Key"];
  const body = request.body;
  // TODO: a retry with the same key must not charge twice
  const payment = createPayment(body.orderId, body.amount, key);
  return [201, payment];
}
`,
    visibleTests: `const req = { headers: { "Idempotency-Key": "k-1" }, body: { orderId: "A-7", amount: 48 } };
const [status, first] = handlePay(req);
assert(status === 201, "the first request should create a payment (201)");
const [, second] = handlePay(req);
assert(payments.length === 1, "expected 1 payment after a retry, found " + payments.length);
assert(second.id === first.id, "a retry should return the first payment");
`,
  },
];

const PYTHON_TASKS = [...PYTHON_BASICS, ...PYTHON].map((r) => codeTask("python", r));
const JAVASCRIPT_TASKS = [...JAVASCRIPT_BASICS, ...JAVASCRIPT].map((r) => codeTask("javascript", r));

export const LADDER_TASKS: PublicTask[] = [...PYTHON_TASKS, ...JAVASCRIPT_TASKS];

/** Task ids in order, easiest first. The Python ladder ends with the original seed task. */
export const LADDERS: Record<LadderLanguage, string[]> = {
  python: [...PYTHON_TASKS.map((t) => t.card.id), doublePayTask.card.id],
  javascript: JAVASCRIPT_TASKS.map((t) => t.card.id),
};
