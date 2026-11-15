// Short lessons shown when a task is handed out: the idea behind it on a different
// example, then questions that lead to the answer. They never solve the task itself.
// Shown on the task card in the chat and at the top of the ticket in the workspace.
// Keyed by task id; the server adds them to the cards.

export const TASK_INTROS: Record<string, string> = {
  "py-hello-world": `**\`print\` shows text on the screen.** Whatever you put between the brackets appears in the terminal when the program runs.

\`\`\`python
print("Good morning")
\`\`\`

This prints \`Good morning\`.

**Why the quotes?** Quotes mark a piece of text, which programmers call a *string*. Without them, Python reads \`Good\` as the name of something in your code and stops with an error. Everything inside the quotes is printed exactly as written: capital letters, commas and spaces too.

**Your turn**
- Press **Run** first. What does the program print right now?
- Change it so it prints exactly what the ticket asks. Every letter, comma and exclamation mark counts.
- When the terminal matches the ticket, press **Submit**.`,
  "py-print-lines": `**Each \`print\` makes one line.** Python runs your code from top to bottom, one line at a time, so the lines come out in the order you wrote them.

\`\`\`python
print("Monday")
print("Tuesday")
\`\`\`

This prints \`Monday\`, then \`Tuesday\` on the next line.

**Your turn**
- One line of the header is already printed. How many more do you need?
- Each line of text needs its own quotes.
- **Run** it and compare the terminal with the ticket, line by line and in order.`,
  "py-variables": `**A variable is a name for a value**, like a labeled box. \`city = "Paris"\` puts the text Paris into a box called \`city\`. Later you write \`city\` without quotes and Python uses what's inside.

\`\`\`python
city = "Paris"
print("I live in " + city)
\`\`\`

This prints \`I live in Paris\`. The \`+\` glues pieces of text together, and it adds nothing in between: the space before Paris comes from the quoted part.

**Quotes or no quotes?** \`"city"\` in quotes is just the word city. \`city\` without quotes is the variable, so you get Paris.

**Your turn**
- Look at the greeting the ticket asks for. Which part is the customer's name, and which parts never change?
- Glue the pieces together the way the example does. Watch the spaces and the punctuation.
- **Run** it, then change \`name\` to your own name and run again. If the greeting changes too, you used the variable.`,
  "py-arithmetic": `**Python can do the math.** \`+\` adds, \`-\` subtracts, \`*\` multiplies and \`/\` divides. Numbers go without quotes: \`4\` is a number, \`"4"\` is text.

\`\`\`python
width = 5
height = 2
print(width + height)  # 7
print(width - height)  # 3
\`\`\`

The program works the answer out from the variables, so when a value changes, the result follows.

**Your turn**
- **Run** the code first. What does it print, and why isn't that what 3 lattes cost?
- Which operation gives the price of several cups that cost the same?
- Fix the line and run it again. Does the number match the ticket?`,
  "py-format": `**An f-string puts variables inside text.** Write \`f\` right before the opening quote, then put variable names in curly braces \`{}\`. Python swaps each \`{...}\` for the variable's value.

\`\`\`python
name = "Ana"
age = 30
print(f"{name} is {age} years old")
\`\`\`

This prints \`Ana is 30 years old\`. Everything outside the braces is printed as is: spaces, commas, and symbols like \`$\` or \`:\`.

**Your turn**
- Look at the line the ticket wants. Which parts come from the variables, and which characters are always the same?
- Write the whole line as one f-string.
- **Run** it and compare it with the ticket character by character, spaces included.`,
  "py-if-else": `**\`if\` lets the program choose.** Python checks a condition. When it's true, it runs the lines under \`if\`; otherwise it runs the lines under \`else\`.

\`\`\`python
temperature = 30
if temperature > 25:
    print("Hot")
else:
    print("Nice")
\`\`\`

This prints \`Hot\`. Comparisons: \`>\` more than, \`<\` less than, \`>=\` at least, \`==\` equal to.

**Mind the shape.** A colon \`:\` ends the \`if\` and \`else\` lines, and the lines under them start with 4 spaces. That indent is how Python knows which lines belong to which branch.

**Your turn**
- Which condition means "there's something in stock"?
- Put each message from the ticket in its own branch.
- **Run** it with \`stock = 0\`, then change \`stock\` to 5 and run again. You should see a different message each time.`,
  "py-for-loop": `**A list holds several values in order**, in square brackets: \`["Rome", "Oslo", "Lima"]\`. \`cities[0]\` is the first item, because counting starts at 0.

**A \`for\` loop repeats code for every item.** Each time round, the loop variable holds the next item.

\`\`\`python
for city in ["Rome", "Oslo"]:
    print(city)
\`\`\`

This prints \`Rome\`, then \`Oslo\`. The indented line runs once per item.

**Your turn**
- The code prints only one drink. Which part of the example repeats a line for every item?
- Use it on the \`menu\` list.
- **Run** it, then add a fourth drink to the list and run again. If it shows up without any other change, your code works for any menu.`,
  "py-welcome": `**A function is a named recipe.** It takes inputs, does some work and hands a result back with \`return\`. Other code calls it by name, with values in brackets.

\`\`\`python
def double(n):
    return n * 2

double(4)  # gives 8
\`\`\`

\`def\` starts the function, \`n\` is its input, and the indented lines are its body.

**\`return\` or \`print\`?** \`print\` only shows text in the terminal. \`return\` gives the value back to the code that called the function, so the website can put it on the page. The checks call your function and look at what it returns.

**Your turn**
- Right now \`welcome\` returns the same text for everyone. What should depend on \`name\`?
- Build that message from the name (you already know f-strings) and return it.
- **Run** it. The test calls \`welcome("Ana")\`: check the comma and the exclamation mark.`,
  "py-free-shipping": `**Functions often pick an answer with \`if\`.** As soon as a \`return\` runs, the function stops and hands back that value, so you can return early from inside an \`if\`.

\`\`\`python
def ticket_price(age):
    if age < 12:
        return 5
    return 10
\`\`\`

A 7-year-old pays 5, everyone else pays 10.

**Watch the edge.** \`>\` means "more than" and \`>=\` means "at least". They give different answers for the number right on the border.

**Your turn**
- Which order totals ship free? Write that as a condition.
- What should the function return in each case?
- Before you run it, work it out for 20, 50 and 80. Is exactly 50 free?`,
  "py-cart-total": `**Add things up with a running total.** Start at 0, loop over the items, add to the total each time, and use it after the loop.

\`\`\`python
prices = [3, 4, 5]
total = 0
for p in prices:
    total = total + p  # or: total += p
# total is now 12
\`\`\`

**Each cart item is a dictionary**: named values in curly braces, like \`{"name": "Mug", "price": 12, "qty": 2}\`. Read a value by its name: \`item["name"]\` gives \`"Mug"\`.

**Your turn**
- How much does one line of the cart cost? You know its price and how many were bought.
- Add that to \`total\` for every item.
- Where does \`return\` belong: inside the loop or after it? Think through what an empty cart should give.`,
  "py-status-count": `**A dictionary can count things.** Use each thing as a key and its count as the value.

\`\`\`python
counts = {}
for fruit in ["apple", "pear", "apple"]:
    counts[fruit] = counts.get(fruit, 0) + 1
# {"apple": 2, "pear": 1}
\`\`\`

\`counts.get(fruit, 0)\` reads the current count, or 0 if that fruit hasn't come up yet. Then 1 is added and stored back.

**Your turn**
- Each order is a dictionary too. Which of its values is the one you're counting?
- Count it the same way the fruit example counts fruit.
- What should come back when there are no orders at all?`,
  "py-email-check": `**Text comes with handy tools**, called with a dot after the text:

\`\`\`python
"  hi there ".strip()     # "hi there": spaces at the ends removed
"banana".count("a")       # 3
"2024-05-01".split("-")   # ["2024", "05", "01"]
"a" in "cat"              # True
\`\`\`

**Combine checks with \`and\`.** \`a and b\` is \`True\` only when both are true, and a check like \`x > 0\` already is \`True\` or \`False\`, so you can return it directly.

**Your turn**
- Turn each rule in the ticket into one check, using the tools above.
- Combine the checks and return the result.
- **Run** it, then try your own broken emails: \`ana.gmail.com\`, \`@shop.com\`, \`ana@shopcom\`, \`ana@@shop.com\`.`,
  "py-find-customer": `**\`None\` means "nothing found".** Instead of crashing, a function can return \`None\`, and the support tool shows "No such customer".

**Text or number?** \`"102"\` with quotes is text and \`102\` is a number, so \`"102" == 102\` is \`False\`. \`int("102")\` turns the text into the number 102. For text like \`"abc"\`, \`int\` raises an error, and you can catch an error instead of crashing:

\`\`\`python
try:
    age = int(answer)
except ValueError:
    print("That's not a number")
\`\`\`

**Your turn**
- Run it with an id that doesn't exist. Which line breaks the support tool?
- Ids can arrive as text. How do you compare them with the numbers in the list, safely?
- Make the function finish with "nothing found" instead of an error, for unknown ids and for text that isn't a number.`,
  "py-discount-codes": `**Clean up input before you compare it.** People type the same thing in different ways. \`.upper()\` and \`.strip()\` make text uniform: \`" Hello ".strip().upper()\` gives \`"HELLO"\`.

**Money math**
- A percentage off: 20% off is \`price * 0.8\`
- A fixed amount off: $3 off is \`price - 3\`
- \`max(a, b)\` gives the bigger of two numbers
- \`round(x, 2)\` keeps two decimals: \`round(3.14159, 2)\` is \`3.14\`

**Your turn**
- What should \`save10\`, \`Save10\` and \`SAVE10\` have in common before you compare them?
- Handle each code from the ticket. What happens to any other code?
- Last, make sure the total can never drop below 0 and ends up in whole cents.`,
  "py-paginate": `**Slicing takes a piece of a list.** \`items[start:end]\` gives the items from position \`start\` up to, but not including, \`end\`. Positions start at 0.

\`\`\`python
letters = ["a", "b", "c", "d", "e"]
letters[0:2]  # ["a", "b"]
letters[2:4]  # ["c", "d"]
letters[4:6]  # ["e"]: a slice past the end just stops
\`\`\`

**Your turn**
- Pages start at 1, positions start at 0. With 10 orders per page, at which position does page 1 start? Page 2? Page 3? Find the pattern.
- Slice one page's worth of items from that start.
- What should page 0, or a negative page, give? **Run** it with page 3 of 25 orders.`,
  "backend-double-pay-1": `**Payment requests get retried.** A shaky connection or a double tap sends the same request twice. So the app sends an *idempotency key*: one random id per payment attempt. The same key means "this is the same payment, don't charge again".

**The idea:** before doing something that can't be undone, check whether you've already done it for this key. If you have, answer with the result from the first time.

**Status codes** tell the app what happened: \`201 Created\` means a new payment was made; \`200 OK\` means "here it is, nothing new was created".

**Your turn**
- Every payment in the table keeps the key it came with. How can the handler find out whether this key was used before?
- If it was, what should the handler answer, and with which status?
- **Run** it: the test sends the same request twice and counts the payments.`,
  "js-hello-world": `**\`console.log\` shows text on the screen.** Whatever you put between the brackets appears in the terminal when the program runs.

\`\`\`js
console.log("Good morning");
\`\`\`

This prints \`Good morning\`. The \`;\` marks the end of the line of code.

**Why the quotes?** Quotes mark a piece of text, which programmers call a *string*. Without them, JavaScript reads \`Good\` as the name of a variable and stops with an error. Everything inside the quotes is printed exactly as written: capital letters, commas and spaces too.

**Your turn**
- Press **Run** first. What does the program print right now?
- Change it so it prints exactly what the ticket asks. Every letter, comma and exclamation mark counts.
- When the terminal matches the ticket, press **Submit**.`,
  "js-print-lines": `**Each \`console.log\` makes one line.** JavaScript runs your code from top to bottom, so the lines come out in the order you wrote them.

\`\`\`js
console.log("Monday");
console.log("Tuesday");
\`\`\`

This prints \`Monday\`, then \`Tuesday\` on the next line.

**Your turn**
- One line of the header is already printed. How many more do you need?
- Each line of text needs its own quotes.
- **Run** it and compare the terminal with the ticket, line by line and in order.`,
  "js-variables": `**A variable is a name for a value**, like a labeled box. \`const city = "Paris";\` puts the text Paris into a box called \`city\`. Later you write \`city\` without quotes and JavaScript uses what's inside.

\`\`\`js
const city = "Paris";
console.log("I live in " + city);
\`\`\`

This prints \`I live in Paris\`. The \`+\` glues pieces of text together, and it adds nothing in between: the space before Paris comes from the quoted part.

**Quotes or no quotes?** \`"city"\` in quotes is just the word city. \`city\` without quotes is the variable, so you get Paris.

**Your turn**
- Look at the greeting the ticket asks for. Which part is the customer's name, and which parts never change?
- Glue the pieces together the way the example does. Watch the spaces and the punctuation.
- **Run** it, then change \`name\` to your own name and run again. If the greeting changes too, you used the variable.`,
  "js-arithmetic": `**JavaScript can do the math.** \`+\` adds, \`-\` subtracts, \`*\` multiplies and \`/\` divides. Numbers go without quotes: \`4\` is a number, \`"4"\` is text.

\`\`\`js
const width = 5;
const height = 2;
console.log(width + height); // 7
console.log(width - height); // 3
\`\`\`

The program works the answer out from the variables, so when a value changes, the result follows.

**Your turn**
- **Run** the code first. What does it print, and why isn't that what 3 lattes cost?
- Which operation gives the price of several cups that cost the same?
- Fix the line and run it again. Does the number match the ticket?`,
  "js-format": `**Build text from pieces.** \`+\` joins text and variables into one line. Fixed parts go in quotes, variables go without them.

\`\`\`js
const name = "Ana";
const age = 30;
console.log(name + " is " + age + " years old");
\`\`\`

This prints \`Ana is 30 years old\`. Spaces and symbols like \`$\` or \`:\` belong inside the quoted parts.

**Another way:** a template string uses backticks and \`\${...}\`. \`\` \`\${name} is \${age}\` \`\` gives \`Ana is 30\`.

**Your turn**
- Look at the line the ticket wants. Which parts come from the variables, and which characters are always the same?
- Join them into one line.
- **Run** it and compare it with the ticket character by character, spaces included.`,
  "js-if-else": `**\`if\` lets the program choose.** JavaScript checks the condition in brackets. When it's true, it runs the code in the first pair of curly braces; otherwise it runs the code after \`else\`.

\`\`\`js
const temperature = 30;
if (temperature > 25) {
  console.log("Hot");
} else {
  console.log("Nice");
}
\`\`\`

This prints \`Hot\`. Comparisons: \`>\` more than, \`<\` less than, \`>=\` at least, \`===\` equal to.

**Mind the shape:** the condition goes in round brackets \`( )\`, each branch in curly braces \`{ }\`.

**Your turn**
- Which condition means "there's something in stock"?
- Put each message from the ticket in its own branch.
- **Run** it with \`stock = 0\`, then change \`stock\` to 5 and run again. You should see a different message each time.`,
  "js-for-loop": `**An array holds several values in order**, in square brackets: \`["Rome", "Oslo", "Lima"]\`. \`cities[0]\` is the first item, because counting starts at 0.

**A \`for...of\` loop repeats code for every item.** Each time round, the loop variable holds the next item.

\`\`\`js
for (const city of ["Rome", "Oslo"]) {
  console.log(city);
}
\`\`\`

This prints \`Rome\`, then \`Oslo\`. The code in the braces runs once per item.

**Your turn**
- The code prints only one drink. Which part of the example repeats a line for every item?
- Use it on the \`menu\` array.
- **Run** it, then add a fourth drink to the array and run again. If it shows up without any other change, your code works for any menu.`,
  "js-welcome": `**A function is a named recipe.** It takes inputs, does some work and hands a result back with \`return\`. Other code calls it by name, with values in brackets.

\`\`\`js
function double(n) {
  return n * 2;
}

double(4); // gives 8
\`\`\`

**\`return\` or \`console.log\`?** \`console.log\` only shows text in the terminal. \`return\` gives the value back to the code that called the function, so the website can put it on the page. The checks call your function and look at what it returns.

**Your turn**
- Right now \`welcome\` returns the same text for everyone. What should depend on \`name\`?
- Build that message from the name (you already know how to join text) and return it.
- **Run** it. The test calls \`welcome("Ana")\`: check the comma and the exclamation mark.`,
  "js-free-shipping": `**Functions often pick an answer with \`if\`.** As soon as a \`return\` runs, the function stops and hands back that value, so you can return early from inside an \`if\`.

\`\`\`js
function ticketPrice(age) {
  if (age < 12) {
    return 5;
  }
  return 10;
}
\`\`\`

A 7-year-old pays 5, everyone else pays 10.

**Watch the edge.** \`>\` means "more than" and \`>=\` means "at least". They give different answers for the number right on the border.

**Your turn**
- Which order totals ship free? Write that as a condition.
- What should the function return in each case?
- Before you run it, work it out for 20, 50 and 80. Is exactly 50 free?`,
  "js-cart-total": `**Add things up with a running total.** Start at 0, loop over the items, add to the total each time, and use it after the loop.

\`\`\`js
const prices = [3, 4, 5];
let total = 0;
for (const p of prices) {
  total += p;
}
// total is now 12
\`\`\`

\`let\` is a variable you can change later; \`const\` stays the same.

**Each cart item is an object**: named values in curly braces, like \`{ name: "Mug", price: 12, qty: 2 }\`. Read a value with a dot: \`item.name\` gives \`"Mug"\`.

**Your turn**
- How much does one line of the cart cost? You know its price and how many were bought.
- Add that to \`total\` for every item.
- Where does \`return\` belong: inside the loop or after it? Think through what an empty cart should give.`,
  "js-status-count": `**An object can count things.** Use each thing as a key and its count as the value.

\`\`\`js
const counts = {};
for (const fruit of ["apple", "pear", "apple"]) {
  counts[fruit] = (counts[fruit] || 0) + 1;
}
// { apple: 2, pear: 1 }
\`\`\`

\`counts[fruit] || 0\` reads the current count, or 0 if that fruit hasn't come up yet. Then 1 is added and stored back.

**Your turn**
- Each order is an object too. Which of its values is the one you're counting?
- Count it the same way the fruit example counts fruit.
- What should come back when there are no orders at all?`,
  "js-email-check": `**Text comes with handy tools**, called with a dot after the text:

\`\`\`js
"  hi there ".trim();       // "hi there": spaces at the ends removed
"2024-05-01".split("-");    // ["2024", "05", "01"]
"cat".includes("a");        // true
["x", "y"].length;          // 2
\`\`\`

**Combine checks with \`&&\`.** \`a && b\` is \`true\` only when both are true, and a check like \`x > 0\` already is \`true\` or \`false\`, so you can return it directly.

**Your turn**
- Turn each rule in the ticket into one check, using the tools above. How can \`split\` tell you how many \`@\` there are?
- Combine the checks and return the result.
- **Run** it, then try your own broken emails: \`ana.gmail.com\`, \`@shop.com\`, \`ana@shopcom\`, \`ana@@shop.com\`.`,
  "js-find-customer": `**\`null\` means "nothing found".** Instead of crashing, a function can return \`null\`, and the support tool shows "No such customer".

**Text or number?** \`"102"\` with quotes is text and \`102\` is a number, so \`"102" === 102\` is \`false\`. \`Number("102")\` turns the text into the number 102. Text that isn't a number becomes \`NaN\`, "not a number":

\`\`\`js
Number("42");                 // 42
Number("abc");                // NaN
Number.isNaN(Number("abc"));  // true
\`\`\`

**Your turn**
- Run it with an id that doesn't exist. Which line breaks the support tool?
- Ids can arrive as text. How do you compare them with the numbers in the list?
- Make the function finish with "nothing found" instead of an error, for unknown ids and for text that isn't a number.`,
  "js-discount-codes": `**Clean up input before you compare it.** People type the same thing in different ways. \`.trim()\` and \`.toUpperCase()\` make text uniform: \`" Hello ".trim().toUpperCase()\` gives \`"HELLO"\`.

**Money math**
- A percentage off: 20% off is \`price * 0.8\`
- A fixed amount off: $3 off is \`price - 3\`
- \`Math.max(a, b)\` gives the bigger of two numbers
- Two decimals: \`Math.round(3.14159 * 100) / 100\` is \`3.14\`

**Your turn**
- What should \`save10\`, \`Save10\` and \`SAVE10\` have in common before you compare them?
- Handle each code from the ticket. What happens to any other code?
- Last, make sure the total can never drop below 0 and ends up in whole cents.`,
  "js-paginate": `**\`slice\` takes a piece of an array.** \`items.slice(start, end)\` gives the items from position \`start\` up to, but not including, \`end\`. Positions start at 0.

\`\`\`js
const letters = ["a", "b", "c", "d", "e"];
letters.slice(0, 2); // ["a", "b"]
letters.slice(2, 4); // ["c", "d"]
letters.slice(4, 6); // ["e"]: a slice past the end just stops
\`\`\`

**Your turn**
- Pages start at 1, positions start at 0. With 10 orders per page, at which position does page 1 start? Page 2? Page 3? Find the pattern.
- Slice one page's worth of items from that start.
- What should page 0, or a negative page, give? **Run** it with page 3 of 25 orders.`,
  "js-double-pay": `**Payment requests get retried.** A shaky connection or a double tap sends the same request twice. So the app sends an *idempotency key*: one random id per payment attempt. The same key means "this is the same payment, don't charge again".

**The idea:** before doing something that can't be undone, check whether you've already done it for this key. If you have, answer with the result from the first time.

**Status codes** tell the app what happened: \`201 Created\` means a new payment was made; \`200 OK\` means "here it is, nothing new was created".

\`array.find(...)\` returns the first item that matches, or \`undefined\`:

\`\`\`js
const users = [{ name: "Ana" }, { name: "Leo" }];
users.find((u) => u.name === "Leo"); // { name: "Leo" }
\`\`\`

**Your turn**
- Every payment in the table keeps the key it came with. How can the handler find out whether this key was used before?
- If it was, what should the handler answer, and with which status?
- **Run** it: the test sends the same request twice and counts the payments.`,
  "design-pay-button-1": `**A design system is the team's shared rulebook**: the colours, corner radii, type sizes and components every screen uses, so the whole product looks like one product. This ticket moves one old button onto the new rules.

**Three ideas you'll need**
- **Linear gradient.** A fill that blends from one colour into another along a line, instead of one flat colour.
- **Corner radius.** How round the corners are, in pixels. 0 is a sharp square corner; bigger numbers are rounder.
- **Contrast.** How much text stands out from what's behind it, written as a ratio like 4.5:1. Low contrast is hard to read for people with low vision, or for anyone on a phone in the sun. On a gradient, the text has to be readable on every part of it.

**Your turn**
- Find the button and select it, on the canvas or in **Layers**.
- Compare its fill, corners and text with the three rules in the ticket. What's different?
- Change what's off. The **Contrast** box tells you when the text is readable everywhere. **Submit** when you think all three rules hold.`,
  "design-corners-1": `**Every layer has properties.** Click a layer on the canvas or in **Layers**, and the panel on the right shows what it's made of: position and size, corner radius, fill and text. Change a number there and the canvas updates right away.

**Corner radius** is how round the corners are, in pixels. 0 is a sharp corner; the bigger the number, the rounder. A button 40 tall with a radius of 20 becomes a pill.

**Consistency matters.** People don't measure corners, but they notice when one card looks different from the rest. That's why design systems settle on a few radii and use them everywhere.

**Your turn**
- Which layer is the promo card? Careful: the text and the button inside it are separate layers.
- Look at its corner radius now, then set the value from the ticket.
- **Submit** when the card matches the rest of the app.`,
  "design-brand-color-1": `**Colours are written as hex codes**: a \`#\` and six characters, two each for red, green and blue. \`#000000\` is black, \`#FFFFFF\` is white, \`#FF0000\` is pure red. Teams pass exact codes around so everyone uses the very same colour.

**Two ways to set a colour:** click the swatch to open a colour picker, or type the six characters into the field next to it. Typing is how designers apply an exact brand colour.

**A new background changes the text too.** The same white label can be easy or hard to read depending on what's behind it. The **Contrast** box under Text shows it live.

**Your turn**
- Select the Sign up button and find its fill colour.
- Apply the brand colour from the ticket, exactly.
- Is the white label still readable? Check the Contrast box, then **Submit**.`,
  "design-contrast-1": `**Contrast is the difference in lightness between text and its background**, written as a ratio from 1:1 (invisible) to 21:1 (black on white). The accessibility standard WCAG asks for at least **4.5:1** for normal text, so people with low vision, or anyone outside in bright sun, can still read it.

**Pale grey looks calm but fails.** Fine print is often styled very light so it doesn't compete with the price. A darker grey can stay quiet and still be readable: making text bigger isn't the only fix.

**Your turn**
- Select the delivery note and watch the **Contrast** box as you change its text colour.
- How dark does the grey need to be before the box turns green?
- Keep the size as it is, then **Submit**.`,
  "design-type-scale-1": `**Hierarchy tells the eye where to look first.** The most important line is the biggest, supporting text is smaller. When everything is the same size, nothing stands out and people don't know where to start.

**A type scale** is the short list of sizes a product uses, for example 13 for captions, 16 for body text, 20 for subheadings and 28 for titles. Picking from the scale instead of any number keeps every screen consistent.

**Your turn**
- Which layer is the title, and which one is the body text?
- Find the right size for each in the ticket and set it in the **Text** section.
- Is there now one clear thing to read first? Then **Submit**.`,
  "design-align-1": `**Alignment makes a screen look calm.** When things share an invisible line, the eye reads them as one group. A few pixels off and the screen looks messy, even if nobody can say why.

**Margins** are the empty space between the edge of the screen and the content. In the **Layout** section, **X** is the distance from the left edge of the screen to the left edge of a layer, so content on a 24 px margin starts at X 24.

You can type X directly, drag the layer, or nudge it with the arrow keys (Shift moves 10 at a time).

**Your turn**
- The avatar already sits on the margin. Which layers don't?
- Check each one's X and move it onto the margin.
- **Submit** when all the left edges line up.`,
  "design-tap-target-1": `**Fingers are bigger than cursors.** A mouse can hit a tiny target, a thumb can't. Apple and Google recommend touch targets of at least **44 × 44** points, so people hit what they aim for the first time.

**Resizing keeps one side fixed.** Dragging a corner handle moves that corner and keeps the opposite one in place. The **X, Y, W, H** fields work too: X and Y are the top left corner, W and H the size, so a layer ends on the right at X + W.

**Your turn**
- Select the close button. How big is it now?
- Make it big enough to tap. Which corner should stay put so it remains in the top right?
- Check where its right edge ends against the ticket, then **Submit**.`,
  "design-spacing-1": `**Spacing groups things.** Equal gaps say "these items belong together"; uneven gaps look like a mistake. A **spacing scale** (here 8, 16 and 24) keeps every gap one of a few values.

**A gap is the empty space between two layers**, not their positions. It's where the lower layer starts (its Y) minus where the upper one ends (its Y + H):

\`\`\`text
row A: Y 40, H 48  -> ends at 88
row B: Y 100       -> gap = 100 - 88 = 12
\`\`\`

**Your turn**
- Work out the gaps between the rows as they are now.
- Keep the first row where it is and move the others until every gap matches the ticket.
- Don't resize the rows. Then **Submit**.`,
  "design-center-1": `**Centred means the same space on both sides.** For a layer on a screen, the space on the left is its X, and the space on the right is the screen width minus where the layer ends (X + W).

\`\`\`text
screen 300 wide, card 100 wide at X 50:
left = 50, right = 300 - (50 + 100) = 150 -> not centred
\`\`\`

**Your turn**
- How wide is the screen, and how wide is the button? The screen's size shows when you select it.
- Which X gives the same space on both sides? Work it out, then type it in.
- Keep the button's width as it is, then **Submit**.`,
  "design-dark-card-1": `**Dark mode isn't just inverted colours.** Cards become dark greys instead of white, text turns light, and contrast has to be checked again, because light text on a dark background blurs more easily. Many teams ask for **7:1** for titles in dark mode, the stricter AAA level.

**Text belongs to its card.** The title and subtitle sit inside the card (look at **Layers**), so their contrast is measured against the card's fill.

**Your turn**
- Select the card and give it a dark solid fill. How dark is dark enough? White text on it should reach 7:1.
- Then fix the two lines inside it: the title needs 7:1, the subtitle 4.5:1. Watch the **Contrast** box.
- **Submit** when everything reads clearly on the dark screen.`,
};
