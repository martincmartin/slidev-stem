// The options of seconds.html (PLAN.md, section 21): it shows one option at one
// click, from the query or from the keys: a to f, and the left and right arrows.
import "../../../../themes/house/styles/fonts.css";

const LAST_CLICK = 3;
const sections = [...document.querySelectorAll<HTMLElement>("section")];
const parameters = new URLSearchParams(location.search);
let option = parameters.get("option") ?? "a";
let click = Number(parameters.get("click") ?? LAST_CLICK);

/** An element shows from its click, and a `text-dims` one dims after its click. */
function show(): void {
  for (const section of sections) {
    section.classList.toggle("shown", section.dataset["option"] === option);
    for (const element of section.querySelectorAll<HTMLElement>("[data-click]")) {
      const from = Number(element.dataset["click"]);
      element.classList.toggle("unseen", click < from);
      element.classList.toggle(
        "dimmed",
        element.classList.contains("text-dims") && click > from,
      );
    }
  }
}

addEventListener("keydown", (event) => {
  if (event.key === "ArrowRight") click = Math.min(click + 1, LAST_CLICK);
  else if (event.key === "ArrowLeft") click = Math.max(click - 1, 0);
  else if (sections.some((section) => section.dataset["option"] === event.key))
    option = event.key;
  show();
});

show();
await document.fonts.ready;
document.body.dataset["ready"] = "1";
