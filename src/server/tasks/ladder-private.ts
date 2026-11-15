// Server-only: hidden tests and reference solutions for the task ladders in
// src/contracts/fixtures/ladder.ts. Never send these to the browser.
// Python checks are test_* functions labelled by their docstring; JavaScript
// checks are test("label", fn) calls with the runner's assert().

import type { PrivateTask } from "./private";

const py = (file: string, hiddenTests: string, solution: string): PrivateTask => ({ hiddenTests, solution: [{ path: file, content: solution }] });
const js = py;

// For the first-steps rungs: what the program printed, and a re-run with one starting
// value changed, so a hard-coded answer doesn't pass.
const PY_PRINTED = `
import contextlib, io, re


def _lines(text=None):
    return [line.strip() for line in (__output__ if text is None else text).strip().splitlines()]


def _rerun(pattern, replacement):
    src, found = re.subn(pattern, replacement, __source__, count=1, flags=re.M)
    assert found, "keep the line that sets the starting value, so the check can try another one"
    buf = io.StringIO()
    with contextlib.redirect_stdout(buf):
        exec(src, {"__name__": "__main__"})
    return _lines(buf.getvalue())
`;

const JS_PRINTED = `
const printed = (text = __output__) => text.trim().split("\\n").map((l) => l.trim()).filter((l) => l.length);
const rerun = (pattern, replacement) => {
  const src = __source__.replace(pattern, replacement);
  assert(src !== __source__, "keep the line that sets the starting value, so the check can try another one");
  const out = [];
  const say = (...a) => out.push(a.join(" "));
  new Function("console", src)({ log: say, error: say, warn: say });
  return printed(out.join("\\n"));
};
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
`;

export const LADDER_PRIVATE: Record<string, PrivateTask> = {
  "py-hello-world": py(
    "hello.py",
    `${PY_PRINTED}

def test_prints_something():
    """The program prints something"""
    assert _lines(), "the program didn't print anything: use print(...)"


def test_prints_hello_world():
    """It prints exactly Hello, World!"""
    got = _lines()[0] if _lines() else "nothing"
    assert got == "Hello, World!", f'expected "Hello, World!", got {got!r}'
`,
    `print("Hello, World!")
`,
  ),

  "py-print-lines": py(
    "receipt.py",
    `${PY_PRINTED}
HEADER = ["Corner Coffee", "123 Main St", "Thank you!"]


def test_three_lines():
    """Prints three lines"""
    assert len(_lines()) == 3, f"expected 3 lines, got {len(_lines())}"


def test_header_text():
    """The lines match the header, in order"""
    assert _lines() == HEADER, f"expected {HEADER}, got {_lines()}"
`,
    `print("Corner Coffee")
print("123 Main St")
print("Thank you!")
`,
  ),

  "py-variables": py(
    "greet.py",
    `${PY_PRINTED}

def test_greets_ana():
    """Prints Hello, Ana!"""
    got = _lines()[0] if _lines() else "nothing"
    assert got == "Hello, Ana!", f'expected "Hello, Ana!", got {got!r}'


def test_uses_name_variable():
    """Uses the name variable, not fixed text"""
    got = _rerun(r"^name\\s*=.*$", 'name = "Jordan"')
    assert got[:1] == ["Hello, Jordan!"], f'with name = "Jordan" it should print "Hello, Jordan!", got {got}'
`,
    `name = "Ana"

print("Hello, " + name + "!")
`,
  ),

  "py-arithmetic": py(
    "order.py",
    `${PY_PRINTED}

def test_prints_total():
    """Prints the total: 12"""
    assert _lines()[:1] == ["12"], f"3 lattes at $4 should be 12, got {_lines()}"


def test_uses_price_and_quantity():
    """Works the total out from price and quantity"""
    got = _rerun(r"^price\\s*=.*$", "price = 5")
    assert got[:1] == ["15"], f"with price = 5 the total should be 15, got {got}"
    got = _rerun(r"^quantity\\s*=.*$", "quantity = 2")
    assert got[:1] == ["8"], f"with quantity = 2 the total should be 8, got {got}"
`,
    `price = 4
quantity = 3

print(price * quantity)
`,
  ),

  "py-format": py(
    "receipt_line.py",
    `${PY_PRINTED}

def test_prints_line():
    """Prints Latte: $12"""
    assert _lines()[:1] == ["Latte: $12"], f'expected "Latte: $12", got {_lines()}'


def test_uses_item_and_total():
    """Builds the line from item and total"""
    got = _rerun(r"^item\\s*=.*$", 'item = "Mocha"')
    assert got[:1] == ["Mocha: $12"], f'with item = "Mocha" it should print "Mocha: $12", got {got}'
    got = _rerun(r"^total\\s*=.*$", "total = 9")
    assert got[:1] == ["Latte: $9"], f'with total = 9 it should print "Latte: $9", got {got}'
`,
    `item = "Latte"
total = 12

print(f"{item}: \${total}")
`,
  ),

  "py-if-else": py(
    "stock.py",
    `${PY_PRINTED}

def test_out_of_stock():
    """Says Out of stock when stock is 0"""
    assert _lines() == ["Out of stock"], f'with stock = 0 it should print "Out of stock", got {_lines()}'


def test_in_stock():
    """Says In stock when there is stock"""
    got = _rerun(r"^stock\\s*=.*$", "stock = 5")
    assert got == ["In stock"], f'with stock = 5 it should print "In stock", got {got}'
`,
    `stock = 0

if stock > 0:
    print("In stock")
else:
    print("Out of stock")
`,
  ),

  "py-for-loop": py(
    "menu.py",
    `${PY_PRINTED}

def test_prints_menu():
    """Prints every drink, in order"""
    assert _lines() == ["Espresso", "Latte", "Mocha"], f"expected the 3 drinks, got {_lines()}"


def test_any_menu():
    """Works for any menu"""
    got = _rerun(r"^menu\\s*=.*$", 'menu = ["Tea", "Cocoa"]')
    assert got == ["Tea", "Cocoa"], f'with menu = ["Tea", "Cocoa"] it should print Tea and Cocoa, got {got}'
`,
    `menu = ["Espresso", "Latte", "Mocha"]

for drink in menu:
    print(drink)
`,
  ),

  "js-hello-world": js(
    "hello.js",
    `${JS_PRINTED}
test("The program prints something", () => {
  assert(printed().length > 0, "the program didn't print anything: use console.log(...)");
});
test("It prints exactly Hello, World!", () => {
  assert(printed()[0] === "Hello, World!", 'expected "Hello, World!", got ' + JSON.stringify(printed()[0]));
});
`,
    `console.log("Hello, World!");
`,
  ),

  "js-print-lines": js(
    "receipt.js",
    `${JS_PRINTED}
const HEADER = ["Corner Coffee", "123 Main St", "Thank you!"];
test("Prints three lines", () => {
  assert(printed().length === 3, "expected 3 lines, got " + printed().length);
});
test("The lines match the header, in order", () => {
  assert(same(printed(), HEADER), "expected " + JSON.stringify(HEADER) + ", got " + JSON.stringify(printed()));
});
`,
    `console.log("Corner Coffee");
console.log("123 Main St");
console.log("Thank you!");
`,
  ),

  "js-variables": js(
    "greet.js",
    `${JS_PRINTED}
test("Prints Hello, Ana!", () => {
  assert(printed()[0] === "Hello, Ana!", 'expected "Hello, Ana!", got ' + JSON.stringify(printed()[0]));
});
test("Uses the name variable, not fixed text", () => {
  const got = rerun(/^\\s*(const|let|var)\\s+name\\s*=.*$/m, 'const name = "Jordan";');
  assert(got[0] === "Hello, Jordan!", 'with name = "Jordan" it should print "Hello, Jordan!", got ' + JSON.stringify(got));
});
`,
    `const name = "Ana";

console.log("Hello, " + name + "!");
`,
  ),

  "js-arithmetic": js(
    "order.js",
    `${JS_PRINTED}
test("Prints the total: 12", () => {
  assert(printed()[0] === "12", "3 lattes at $4 should be 12, got " + JSON.stringify(printed()));
});
test("Works the total out from price and quantity", () => {
  let got = rerun(/^\\s*(const|let|var)\\s+price\\s*=.*$/m, "const price = 5;");
  assert(got[0] === "15", "with price = 5 the total should be 15, got " + JSON.stringify(got));
  got = rerun(/^\\s*(const|let|var)\\s+quantity\\s*=.*$/m, "const quantity = 2;");
  assert(got[0] === "8", "with quantity = 2 the total should be 8, got " + JSON.stringify(got));
});
`,
    `const price = 4;
const quantity = 3;

console.log(price * quantity);
`,
  ),

  "js-format": js(
    "receipt-line.js",
    `${JS_PRINTED}
test("Prints Latte: $12", () => {
  assert(printed()[0] === "Latte: $12", 'expected "Latte: $12", got ' + JSON.stringify(printed()));
});
test("Builds the line from item and total", () => {
  let got = rerun(/^\\s*(const|let|var)\\s+item\\s*=.*$/m, 'const item = "Mocha";');
  assert(got[0] === "Mocha: $12", 'with item = "Mocha" it should print "Mocha: $12", got ' + JSON.stringify(got));
  got = rerun(/^\\s*(const|let|var)\\s+total\\s*=.*$/m, "const total = 9;");
  assert(got[0] === "Latte: $9", 'with total = 9 it should print "Latte: $9", got ' + JSON.stringify(got));
});
`,
    `const item = "Latte";
const total = 12;

console.log(item + ": $" + total);
`,
  ),

  "js-if-else": js(
    "stock.js",
    `${JS_PRINTED}
test("Says Out of stock when stock is 0", () => {
  assert(same(printed(), ["Out of stock"]), 'with stock = 0 it should print "Out of stock", got ' + JSON.stringify(printed()));
});
test("Says In stock when there is stock", () => {
  const got = rerun(/^\\s*(const|let|var)\\s+stock\\s*=.*$/m, "const stock = 5;");
  assert(same(got, ["In stock"]), 'with stock = 5 it should print "In stock", got ' + JSON.stringify(got));
});
`,
    `const stock = 0;

if (stock > 0) {
  console.log("In stock");
} else {
  console.log("Out of stock");
}
`,
  ),

  "js-for-loop": js(
    "menu.js",
    `${JS_PRINTED}
test("Prints every drink, in order", () => {
  assert(same(printed(), ["Espresso", "Latte", "Mocha"]), "expected the 3 drinks, got " + JSON.stringify(printed()));
});
test("Works for any menu", () => {
  const got = rerun(/^\\s*(const|let|var)\\s+menu\\s*=.*$/m, 'const menu = ["Tea", "Cocoa"];');
  assert(same(got, ["Tea", "Cocoa"]), 'with menu = ["Tea", "Cocoa"] it should print Tea and Cocoa, got ' + JSON.stringify(got));
});
`,
    `const menu = ["Espresso", "Latte", "Mocha"];

for (const drink of menu) {
  console.log(drink);
}
`,
  ),

  "py-welcome": py(
    "welcome.py",
    `
def test_greets_by_name():
    """Greets the customer by name"""
    assert welcome("Ana") == "Welcome, Ana!", f'expected "Welcome, Ana!", got {welcome("Ana")!r}'


def test_any_name():
    """Works for any name"""
    assert welcome("Jordan Lee") == "Welcome, Jordan Lee!", f"got {welcome('Jordan Lee')!r}"


def test_returns_text():
    """Returns the message instead of printing it"""
    assert isinstance(welcome("Bo"), str), "welcome() should return the text"
`,
    `def welcome(name):
    return f"Welcome, {name}!"
`,
  ),

  "py-free-shipping": py(
    "shipping.py",
    `
def test_free_over_50():
    """Orders over $50 ship free"""
    assert shipping_cost(80) == 0, f"an $80 order should ship free, got {shipping_cost(80)}"


def test_paid_under_50():
    """Orders under $50 pay 5.99"""
    assert shipping_cost(20) == 5.99, f"a $20 order should pay 5.99, got {shipping_cost(20)}"
    assert shipping_cost(49.99) == 5.99, f"a $49.99 order should pay 5.99, got {shipping_cost(49.99)}"


def test_exactly_50():
    """An order of exactly $50 ships free"""
    assert shipping_cost(50) == 0, f"a $50 order should ship free, got {shipping_cost(50)}"
`,
    `def shipping_cost(order_total):
    if order_total >= 50:
        return 0
    return 5.99
`,
  ),

  "py-cart-total": py(
    "cart.py",
    `
def test_sums_items():
    """Adds price × qty for every item"""
    cart = [{"name": "Mug", "price": 12, "qty": 2}, {"name": "Beans", "price": 18, "qty": 1}]
    assert cart_total(cart) == 42, f"expected 42, got {cart_total(cart)}"


def test_empty_cart():
    """An empty cart totals 0"""
    assert cart_total([]) == 0, f"an empty cart should be 0, got {cart_total([])}"


def test_big_cart():
    """Works for a big cart"""
    cart = [{"name": f"Item {i}", "price": 1, "qty": 3} for i in range(10)]
    assert cart_total(cart) == 30, f"10 items at $1 × 3 should be 30, got {cart_total(cart)}"
`,
    `def cart_total(items):
    total = 0
    for item in items:
        total += item["price"] * item["qty"]
    return total
`,
  ),

  "py-status-count": py(
    "report.py",
    `
def test_counts_each_status():
    """Counts orders in each status"""
    orders = [{"id": 1, "status": "shipped"}, {"id": 2, "status": "pending"}, {"id": 3, "status": "shipped"}]
    assert count_by_status(orders) == {"shipped": 2, "pending": 1}, f"got {count_by_status(orders)}"


def test_no_orders():
    """No orders gives an empty report"""
    assert count_by_status([]) == {}, f"expected {{}}, got {count_by_status([])}"


def test_one_status():
    """Works when every order has the same status"""
    orders = [{"id": i, "status": "delivered"} for i in range(4)]
    assert count_by_status(orders) == {"delivered": 4}, f"got {count_by_status(orders)}"
`,
    `def count_by_status(orders):
    counts = {}
    for order in orders:
        status = order["status"]
        counts[status] = counts.get(status, 0) + 1
    return counts
`,
  ),

  "py-email-check": py(
    "signup.py",
    `
def test_accepts_real_emails():
    """Accepts normal emails"""
    for email in ["ana@shop.com", "j.lee@mail.co.uk"]:
        assert is_valid_email(email) is True, f"{email} is a real email"


def test_needs_one_at():
    """Rejects emails with no @ or more than one"""
    for email in ["ana.gmail.com", "ana@@shop.com", "a@b@shop.com"]:
        assert is_valid_email(email) is False, f"{email} should be rejected"


def test_needs_name_and_dot():
    """Needs a name before the @ and a dot after it"""
    for email in ["@shop.com", "ana@shopcom"]:
        assert is_valid_email(email) is False, f"{email} should be rejected"


def test_ignores_spaces():
    """Ignores spaces around the email"""
    assert is_valid_email("  ana@shop.com ") is True, "spaces around a real email should be ignored"
`,
    `def is_valid_email(email):
    email = email.strip()
    if email.count("@") != 1:
        return False
    name, domain = email.split("@")
    return bool(name) and "." in domain
`,
  ),

  "py-find-customer": py(
    "customers.py",
    `
def test_known_id():
    """Finds a customer by id"""
    assert find_customer(102)["name"] == "Jordan Lee", "id 102 is Jordan Lee"


def test_unknown_id():
    """Returns None for an unknown id"""
    assert find_customer(999) is None, "an unknown id should give None, not an error"


def test_id_as_text():
    """Accepts an id that arrives as text"""
    customer = find_customer("103")
    assert customer is not None and customer["name"] == "Mei Chen", 'find_customer("103") should find Mei Chen'


def test_text_not_a_number():
    """Returns None for text that isn't a number"""
    assert find_customer("abc") is None, 'find_customer("abc") should give None'
`,
    `customers = [
    {"id": 101, "name": "Ana Silva", "email": "ana@shop.com"},
    {"id": 102, "name": "Jordan Lee", "email": "jordan@mail.com"},
    {"id": 103, "name": "Mei Chen", "email": "mei@shop.com"},
]


def find_customer(customer_id):
    try:
        customer_id = int(customer_id)
    except (TypeError, ValueError):
        return None
    for customer in customers:
        if customer["id"] == customer_id:
            return customer
    return None
`,
  ),

  "py-discount-codes": py(
    "promo.py",
    `
def test_save10():
    """SAVE10 takes 10% off"""
    assert apply_discount(40, "SAVE10") == 36, f"SAVE10 on $40 should give 36, got {apply_discount(40, 'SAVE10')}"
    assert apply_discount(19.99, "SAVE10") == 17.99, f"SAVE10 on $19.99 should give 17.99, got {apply_discount(19.99, 'SAVE10')}"


def test_flat5():
    """FLAT5 takes $5 off"""
    assert apply_discount(40, "FLAT5") == 35, f"FLAT5 on $40 should give 35, got {apply_discount(40, 'FLAT5')}"


def test_any_case():
    """Codes work in any letter case"""
    assert apply_discount(40, "save10") == 36, f"save10 should work like SAVE10, got {apply_discount(40, 'save10')}"


def test_unknown_code():
    """An unknown code changes nothing"""
    assert apply_discount(40, "HELLO") == 40, f"an unknown code should keep 40, got {apply_discount(40, 'HELLO')}"


def test_never_below_zero():
    """The total never goes below $0"""
    assert apply_discount(3, "FLAT5") == 0, f"FLAT5 on $3 should give 0, got {apply_discount(3, 'FLAT5')}"
`,
    `def apply_discount(total, code):
    code = code.strip().upper()
    if code == "SAVE10":
        total = total * 0.9
    elif code == "FLAT5":
        total = total - 5
    return round(max(total, 0), 2)
`,
  ),

  "py-paginate": py(
    "orders.py",
    `
ORDERS = list(range(1, 26))


def test_first_page():
    """The first page has the first items"""
    assert paginate(ORDERS, 1, 10) == list(range(1, 11)), f"got {paginate(ORDERS, 1, 10)}"


def test_last_page_shorter():
    """The last page can be shorter"""
    assert paginate(ORDERS, 3, 10) == [21, 22, 23, 24, 25], f"got {paginate(ORDERS, 3, 10)}"


def test_past_the_end():
    """A page past the end is empty"""
    assert paginate(ORDERS, 4, 10) == [], f"page 4 of 25 orders should be empty, got {paginate(ORDERS, 4, 10)}"


def test_page_zero_or_below():
    """Page 0 and below are empty"""
    assert paginate(ORDERS, 0, 10) == [], f"page 0 should be empty, got {paginate(ORDERS, 0, 10)}"
    assert paginate(ORDERS, -1, 10) == [], f"page -1 should be empty, got {paginate(ORDERS, -1, 10)}"
`,
    `def paginate(items, page, per_page):
    if page < 1:
        return []
    start = (page - 1) * per_page
    return items[start:start + per_page]
`,
  ),

  "js-welcome": js(
    "welcome.js",
    `
test("Greets the customer by name", () => {
  assert(welcome("Ana") === "Welcome, Ana!", 'expected "Welcome, Ana!", got ' + JSON.stringify(welcome("Ana")));
});
test("Works for any name", () => {
  assert(welcome("Jordan Lee") === "Welcome, Jordan Lee!", "got " + JSON.stringify(welcome("Jordan Lee")));
});
test("Returns the message instead of logging it", () => {
  assert(typeof welcome("Bo") === "string", "welcome() should return the text");
});
`,
    `function welcome(name) {
  return "Welcome, " + name + "!";
}
`,
  ),

  "js-free-shipping": js(
    "shipping.js",
    `
test("Orders over $50 ship free", () => {
  assert(shippingCost(80) === 0, "an $80 order should ship free, got " + shippingCost(80));
});
test("Orders under $50 pay 5.99", () => {
  assert(shippingCost(20) === 5.99, "a $20 order should pay 5.99, got " + shippingCost(20));
  assert(shippingCost(49.99) === 5.99, "a $49.99 order should pay 5.99, got " + shippingCost(49.99));
});
test("An order of exactly $50 ships free", () => {
  assert(shippingCost(50) === 0, "a $50 order should ship free, got " + shippingCost(50));
});
`,
    `function shippingCost(orderTotal) {
  if (orderTotal >= 50) return 0;
  return 5.99;
}
`,
  ),

  "js-cart-total": js(
    "cart.js",
    `
test("Adds price × qty for every item", () => {
  const cart = [{ name: "Mug", price: 12, qty: 2 }, { name: "Beans", price: 18, qty: 1 }];
  assert(cartTotal(cart) === 42, "expected 42, got " + cartTotal(cart));
});
test("An empty cart totals 0", () => {
  assert(cartTotal([]) === 0, "an empty cart should be 0, got " + cartTotal([]));
});
test("Works for a big cart", () => {
  const cart = Array.from({ length: 10 }, (_, i) => ({ name: "Item " + i, price: 1, qty: 3 }));
  assert(cartTotal(cart) === 30, "10 items at $1 × 3 should be 30, got " + cartTotal(cart));
});
`,
    `function cartTotal(items) {
  let total = 0;
  for (const item of items) total += item.price * item.qty;
  return total;
}
`,
  ),

  "js-status-count": js(
    "report.js",
    `
const same = (a, b) => JSON.stringify(Object.entries(a).sort()) === JSON.stringify(Object.entries(b).sort());
test("Counts orders in each status", () => {
  const orders = [{ id: 1, status: "shipped" }, { id: 2, status: "pending" }, { id: 3, status: "shipped" }];
  const report = countByStatus(orders);
  assert(same(report, { shipped: 2, pending: 1 }), "got " + JSON.stringify(report));
});
test("No orders gives an empty report", () => {
  const report = countByStatus([]);
  assert(same(report, {}), "expected {}, got " + JSON.stringify(report));
});
test("Works when every order has the same status", () => {
  const orders = Array.from({ length: 4 }, (_, i) => ({ id: i, status: "delivered" }));
  const report = countByStatus(orders);
  assert(same(report, { delivered: 4 }), "got " + JSON.stringify(report));
});
`,
    `function countByStatus(orders) {
  const counts = {};
  for (const order of orders) counts[order.status] = (counts[order.status] || 0) + 1;
  return counts;
}
`,
  ),

  "js-email-check": js(
    "signup.js",
    `
test("Accepts normal emails", () => {
  for (const email of ["ana@shop.com", "j.lee@mail.co.uk"]) assert(isValidEmail(email) === true, email + " is a real email");
});
test("Rejects emails with no @ or more than one", () => {
  for (const email of ["ana.gmail.com", "ana@@shop.com", "a@b@shop.com"]) assert(isValidEmail(email) === false, email + " should be rejected");
});
test("Needs a name before the @ and a dot after it", () => {
  for (const email of ["@shop.com", "ana@shopcom"]) assert(isValidEmail(email) === false, email + " should be rejected");
});
test("Ignores spaces around the email", () => {
  assert(isValidEmail("  ana@shop.com ") === true, "spaces around a real email should be ignored");
});
`,
    `function isValidEmail(email) {
  const parts = email.trim().split("@");
  if (parts.length !== 2) return false;
  const [name, domain] = parts;
  return name.length > 0 && domain.includes(".");
}
`,
  ),

  "js-find-customer": js(
    "customers.js",
    `
const call = (id) => { try { return findCustomer(id); } catch (e) { return "an error: " + e.message; } };
test("Finds a customer by id", () => {
  const customer = call(102);
  assert(customer && customer.name === "Jordan Lee", "id 102 is Jordan Lee");
});
test("Returns null for an unknown id", () => {
  assert(call(999) === null, "an unknown id should give null, got " + call(999));
});
test("Accepts an id that arrives as text", () => {
  const customer = call("103");
  assert(customer && customer.name === "Mei Chen", 'findCustomer("103") should find Mei Chen');
});
test("Returns null for text that isn't a number", () => {
  assert(call("abc") === null, 'findCustomer("abc") should give null, got ' + call("abc"));
});
`,
    `const customers = [
  { id: 101, name: "Ana Silva", email: "ana@shop.com" },
  { id: 102, name: "Jordan Lee", email: "jordan@mail.com" },
  { id: 103, name: "Mei Chen", email: "mei@shop.com" },
];

function findCustomer(customerId) {
  const id = Number(customerId);
  if (!Number.isInteger(id)) return null;
  return customers.find((customer) => customer.id === id) || null;
}
`,
  ),

  "js-discount-codes": js(
    "promo.js",
    `
test("SAVE10 takes 10% off", () => {
  assert(applyDiscount(40, "SAVE10") === 36, "SAVE10 on $40 should give 36, got " + applyDiscount(40, "SAVE10"));
  assert(applyDiscount(19.99, "SAVE10") === 17.99, "SAVE10 on $19.99 should give 17.99, got " + applyDiscount(19.99, "SAVE10"));
});
test("FLAT5 takes $5 off", () => {
  assert(applyDiscount(40, "FLAT5") === 35, "FLAT5 on $40 should give 35, got " + applyDiscount(40, "FLAT5"));
});
test("Codes work in any letter case", () => {
  assert(applyDiscount(40, "save10") === 36, "save10 should work like SAVE10, got " + applyDiscount(40, "save10"));
});
test("An unknown code changes nothing", () => {
  assert(applyDiscount(40, "HELLO") === 40, "an unknown code should keep 40, got " + applyDiscount(40, "HELLO"));
});
test("The total never goes below $0", () => {
  assert(applyDiscount(3, "FLAT5") === 0, "FLAT5 on $3 should give 0, got " + applyDiscount(3, "FLAT5"));
});
`,
    `function applyDiscount(total, code) {
  const c = code.trim().toUpperCase();
  if (c === "SAVE10") total = total * 0.9;
  else if (c === "FLAT5") total = total - 5;
  return Math.round(Math.max(total, 0) * 100) / 100;
}
`,
  ),

  "js-paginate": js(
    "orders.js",
    `
const ORDERS = Array.from({ length: 25 }, (_, i) => i + 1);
const show = (v) => JSON.stringify(v);
test("The first page has the first items", () => {
  assert(show(paginate(ORDERS, 1, 10)) === "[1,2,3,4,5,6,7,8,9,10]", "got " + show(paginate(ORDERS, 1, 10)));
});
test("The last page can be shorter", () => {
  assert(show(paginate(ORDERS, 3, 10)) === "[21,22,23,24,25]", "got " + show(paginate(ORDERS, 3, 10)));
});
test("A page past the end is empty", () => {
  assert(show(paginate(ORDERS, 4, 10)) === "[]", "page 4 of 25 orders should be empty, got " + show(paginate(ORDERS, 4, 10)));
});
test("Page 0 and below are empty", () => {
  assert(show(paginate(ORDERS, 0, 10)) === "[]", "page 0 should be empty, got " + show(paginate(ORDERS, 0, 10)));
  assert(show(paginate(ORDERS, -1, 10)) === "[]", "page -1 should be empty, got " + show(paginate(ORDERS, -1, 10)));
});
`,
    `function paginate(items, page, perPage) {
  if (page < 1) return [];
  const start = (page - 1) * perPage;
  return items.slice(start, start + perPage);
}
`,
  ),

  "js-double-pay": js(
    "handler.js",
    `
const req = (key, orderId = "A-7", amount = 48) => ({ headers: { "Idempotency-Key": key }, body: { orderId, amount } });
test("The first request creates a payment", () => {
  const [status, payment] = handlePay(req("k-1"));
  assert(status === 201, "the first request should answer 201, got " + status);
  assert(payments.length === 1, "expected 1 payment, found " + payments.length);
  assert(payment.amount === 48, "the payment should keep the amount");
});
test("A retry with the same key keeps one payment", () => {
  handlePay(req("k-1"));
  handlePay(req("k-1"));
  assert(payments.length === 1, "expected 1 payment after a retry, found " + payments.length);
});
test("A retry returns the first payment", () => {
  const [, first] = handlePay(req("k-1"));
  const [, second] = handlePay(req("k-1"));
  assert(second.id === first.id, "a retry should return the first payment, not a new one");
});
test("A new key creates a new payment", () => {
  handlePay(req("k-1"));
  handlePay(req("k-2", "A-8"));
  assert(payments.length === 2, "two different keys should give 2 payments, found " + payments.length);
});
`,
    `const payments = []; // in-memory "payments" table

function createPayment(orderId, amount, key) {
  const payment = { id: payments.length + 1, orderId, amount, key };
  payments.push(payment);
  return payment;
}

function handlePay(request) {
  const key = request.headers["Idempotency-Key"];
  const body = request.body;
  const existing = payments.find((p) => p.key === key);
  if (existing) return [200, existing];
  const payment = createPayment(body.orderId, body.amount, key);
  return [201, payment];
}
`,
  ),
};
