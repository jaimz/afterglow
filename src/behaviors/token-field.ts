import { assertMarkup } from "./markup";

import { resolveCSSLength } from "./css-length";

/**
 * Turn a native text input into a multi-value field backed by a fixed catalogue.
 * Use .ag-token-field.ag-text-field with a direct .ag-text-field__control child
 * containing a labelled input.ag-text-field__input, then enhanceTokenField(root,
 * { items }). The helper adds avatar chips and a native listbox popover.
 *
 * Substring matching checks labels and values, ignoring case and outer whitespace.
 * Only catalogue entries can be selected, once each. DOM focus stays in the
 * input while aria-activedescendant identifies the highlighted completion.
 * Input name becomes the name of repeated hidden inputs holding selected values.
 * Call destroy() to remove generated content and release all avatar observers.
 */
import { enhanceAvatar, type AvatarController } from "./avatar";

export interface TokenFieldItem {
  /** Unique submitted value, for example an email address or database ID. */
  value: string;
  /** Visible chip label and name used to generate avatar initials. */
  label: string;
  /** Optional secondary information displayed in the completion list. */
  description?: string;
  /** Avatar photo URL; omitted or failed images fall back to initials. */
  imageUrl?: string;
}

export interface TokenFieldOptions {
  items: readonly TokenFieldItem[];
  /** Initially selected catalogue values; also restored on form reset. */
  values?: readonly string[];
  /** Submitted field name; defaults to the native input's name. */
  name?: string;
  /** Require at least one selected item; defaults to the input's required state. */
  required?: boolean;
}

export interface TokenFieldController {
  update(options?: Partial<TokenFieldOptions>): void;
  /** A copy of the selected values, in chip order. */
  readonly values: string[];
  /** A copy of the selected catalogue entries. */
  readonly selectedItems: TokenFieldItem[];
  /** Replace selection atomically; throws for unknown or duplicate values. */
  setValues(values: readonly string[]): void;
  /** Replace the catalogue; retain selections that still exist. */
  setItems(items: readonly TokenFieldItem[]): void;
  /** Append an unselected catalogue entry; returns false if missing/already selected. */
  add(value: string): boolean;
  /** Remove a selected value; returns false if it was not selected. */
  remove(value: string): boolean;
  /** Clear selected values. */
  clear(): void;
  /** Refresh native disabled/read-only state and the current query. */
  refresh(): void;
  /** Remove generated DOM/listeners and restore the input's authored attributes. */
  destroy(): void;
}

const controllers = new WeakMap<HTMLElement, TokenFieldController>();
let nextId = 0;

/** Enhance one field; repeated calls return its existing controller and apply supplied options. */
export function enhanceTokenField(
  root: HTMLElement,
  options: TokenFieldOptions
): TokenFieldController {
  assertMarkup(root);
  const existing = controllers.get(root);
  if (existing) {
    existing.update(options);
    return existing;
  }
  const control = root.querySelector<HTMLElement>(
    ":scope > .ag-text-field__control"
  );
  const input = control?.querySelector<HTMLInputElement>(
    ":scope > input.ag-text-field__input"
  );
  if (!control || !input || input.type !== "text")
    throw new Error(
      "TokenField requires a direct text-field control containing a native text input."
    );
  if (typeof root.showPopover !== "function")
    throw new Error("TokenField requires the browser Popover API.");

  /** Copy and validate before touching the DOM or replacing live state. */
  const catalogue = (items: readonly TokenFieldItem[]) => {
    const map = new Map<string, TokenFieldItem>();
    for (const item of items) {
      if (!item.value?.trim() || !item.label?.trim() || map.has(item.value))
        throw new Error(
          "TokenField items need non-empty labels and unique non-empty values."
        );
      map.set(item.value, { ...item });
    }
    return map;
  };
  let entries = catalogue(options.items);
  const validate = (values: readonly string[]) => {
    if (
      new Set(values).size !== values.length ||
      values.some((value) => !entries.has(value))
    )
      throw new Error(
        "TokenField selection must contain unique catalogue values."
      );
    return [...values];
  };
  const initialValues = validate(options.values ?? []);
  let selected = [...initialValues];
  let insertion = selected.length;
  const doc = root.ownerDocument;
  const win = doc.defaultView!;
  let fieldName = options.name ?? input.name;
  let required = options.required ?? input.required;
  const originalValidity = input.validity.customError
    ? input.validationMessage
    : "";
  const attributes = new Map<string, string | null>();
  const write = (name: string, value: string | null) => {
    if (!attributes.has(name)) attributes.set(name, input.getAttribute(name));
    if (value === null) input.removeAttribute(name);
    else input.setAttribute(name, value);
  };
  const make = (tag: string, className: string, text?: string) => {
    const el = doc.createElement(tag);
    el.className = className;
    if (text !== undefined) el.textContent = text;
    return el;
  };
  let prefix: string;
  do {
    prefix = `ag-token-field-${++nextId}`;
  } while (doc.getElementById(prefix));
  const popup = make("div", "ag-popup-menu ag-token-field__suggestions");
  popup.id = prefix;
  popup.setAttribute("popover", "auto");
  popup.setAttribute("role", "listbox");
  popup.setAttribute("aria-label", "Suggestions");
  const status = make("span", "ag-token-field__status");
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");
  const hidden = make("span", "ag-token-field__values");
  hidden.hidden = true;
  root.append(popup, status, hidden);
  write("role", "combobox");
  write("aria-autocomplete", "list");
  write("aria-haspopup", "listbox");
  write("aria-controls", popup.id);
  write("aria-expanded", "false");
  write("aria-required", String(required));
  write("aria-activedescendant", null);
  write("autocomplete", "off");
  write("name", null);
  write("required", null);
  const anchorName = `--${prefix}`;
  const previousAnchor = [
    control.style.getPropertyValue("anchor-name"),
    control.style.getPropertyPriority("anchor-name"),
  ];
  const inheritedAnchor =
    getComputedStyle(control).getPropertyValue("anchor-name");
  control.style.setProperty(
    "anchor-name",
    inheritedAnchor && inheritedAnchor !== "none"
      ? `${inheritedAnchor}, ${anchorName}`
      : anchorName
  );
  popup.style.setProperty("position-anchor", anchorName);
  const nativePosition =
    CSS.supports("position-area", "block-end span-inline-end") &&
    CSS.supports("position-try-fallbacks", "flip-block");
  if (!nativePosition) popup.setAttribute("data-position-fallback", "");

  const chips = new Map<
    string,
    {
      element: HTMLElement;
      avatar: AvatarController;
      remove: HTMLButtonElement;
    }
  >();
  let matches: TokenFieldItem[] = [];
  let active = -1;
  let composing = false;
  let destroyed = false;
  let frame = 0;
  const editable = () => !input.matches(":disabled") && !input.readOnly;
  const open = () => popup.matches(":popover-open");
  const announce = (message: string) => {
    status.textContent = message;
  };
  const close = () => {
    if (open()) popup.hidePopover();
    write("aria-expanded", "false");
    write("aria-activedescendant", null);
    active = -1;
  };

  /** Keep the list the field's width; older browsers get measured edge-aware placement. */
  const position = () => {
    if (!open() || destroyed) return;
    const rect = control.getBoundingClientRect();
    popup.style.setProperty("--ag-token-field-width", `${rect.width}px`);
    if (nativePosition) return;
    const viewport = win.visualViewport;
    const left = (viewport?.offsetLeft ?? 0) + 8;
    const top = (viewport?.offsetTop ?? 0) + 8;
    const right = left + (viewport?.width ?? win.innerWidth) - 16;
    const bottom = top + (viewport?.height ?? win.innerHeight) - 16;
    const gap = resolveCSSLength(popup, "--popup-menu-gap", 8);
    const below = bottom - rect.bottom - gap,
      above = rect.top - top - gap;
    const height = Math.min(popup.scrollHeight + 2, 288);
    const up = height > below && above > below;
    const available = Math.max(0, up ? above : below);
    const width = popup.getBoundingClientRect().width;
    const x =
      getComputedStyle(control).direction === "rtl"
        ? rect.right - width
        : rect.left;
    popup.style.setProperty(
      "--ag-popup-left",
      `${Math.max(left, Math.min(x, right - width))}px`
    );
    popup.style.setProperty(
      "--ag-popup-top",
      `${Math.max(
        top,
        up ? rect.top - gap - Math.min(height, available) : rect.bottom + gap
      )}px`
    );
    popup.style.setProperty(
      "--ag-popup-max-height",
      `${Math.min(288, available)}px`
    );
  };
  const schedulePosition = () => {
    if (open() && !frame)
      frame = win.requestAnimationFrame(() => {
        frame = 0;
        position();
      });
  };
  const highlight = (index: number) => {
    active = index;
    Array.from(popup.children).forEach((el, i) =>
      el.setAttribute("aria-selected", String(i === index))
    );
    const option = popup.children[index] as HTMLElement | undefined;
    write("aria-activedescendant", option?.id ?? null);
    option?.scrollIntoView({ block: "nearest", inline: "nearest" });
  };

  /** Match any part of labels or values, excluding entries already represented by a chip. */
  const suggest = (allowEmpty = false) => {
    if (destroyed) return;
    const query = input.value.normalize("NFC").trim().toLocaleLowerCase();
    if (
      composing ||
      !editable() ||
      doc.activeElement !== input ||
      (!query && !allowEmpty)
    ) {
      close();
      return;
    }
    matches = [...entries.values()].filter(
      (item) =>
        !selected.includes(item.value) &&
        [item.label, item.value].some((text) =>
          text.normalize("NFC").toLocaleLowerCase().includes(query)
        )
    );
    popup.replaceChildren();
    matches.forEach((item, index) => {
      const option = make("div", "ag-menu-item ag-token-field__option");
      option.id = `${prefix}-option-${index}`;
      option.setAttribute("role", "option");
      option.dataset.index = String(index);
      option.append(make("span", "ag-menu-item__label", item.label));
      if (item.description)
        option.append(
          make("span", "ag-token-field__description", item.description)
        );
      popup.append(option);
    });
    announce(
      matches.length
        ? `${matches.length} suggestion${
            matches.length === 1 ? "" : "s"
          } available.`
        : "No matching items."
    );
    if (!matches.length) {
      close();
      return;
    }
    // Establish the width before opening so anchor fallback selection sees the
    // final geometry on its first layout (including in Firefox).
    popup.style.setProperty(
      "--ag-token-field-width",
      `${control.getBoundingClientRect().width}px`
    );
    if (!open()) popup.showPopover();
    write("aria-expanded", "true");
    position();
    highlight(0);
  };

  const sizeInput = () =>
    write("size", String(Math.max(1, input.value.length + 1)));

  /** Move chips around the editor without detaching its focused native input. */
  const arrange = () => {
    for (const value of selected.slice(0, insertion))
      control.insertBefore(chips.get(value)!.element, input);
    for (const value of selected.slice(insertion).reverse())
      control.insertBefore(chips.get(value)!.element, input.nextSibling);
    sizeInput();
  };
  const moveInsertion = (index: number) => {
    insertion = index;
    close();
    arrange();
    announce(
      insertion < selected.length
        ? `Insertion before ${entries.get(selected[insertion])!.label}.`
        : "Insertion at end."
    );
  };

  /** Reuse each surviving chip/avatar so changing selection does not restart photos. */
  const render = () => {
    for (const [value, chip] of chips)
      if (!selected.includes(value)) {
        chip.avatar.destroy();
        chip.element.remove();
        chips.delete(value);
      }
    for (const value of selected) {
      const item = entries.get(value)!;
      let chip = chips.get(value);
      if (!chip) {
        const el = make("span", "ag-chip");
        el.dataset.variant = "avatar";
        const portrait = make("span", "ag-avatar");
        portrait.dataset.shape = "circle";
        const label = make("span", "ag-chip__label");
        const remove = make("button", "ag-chip__remove") as HTMLButtonElement;
        remove.type = "button";
        remove.dataset.tokenValue = value;
        const icon = make("span", "ag-icon");
        icon.dataset.icon = "x-circle";
        icon.setAttribute("aria-hidden", "true");
        remove.append(icon);
        el.append(portrait, label, remove);
        chip = {
          element: el,
          remove,
          avatar: enhanceAvatar(portrait, { decorative: true }),
        };
        chips.set(value, chip);
      }
      const portrait = chip.element.querySelector<HTMLElement>(".ag-avatar")!;
      portrait.dataset.variant = item.imageUrl ? "image" : "initials";
      chip.avatar.update({ name: item.label, imageUrl: item.imageUrl ?? "" });
      chip.element.querySelector(".ag-chip__label")!.textContent = item.label;
      chip.remove.setAttribute("aria-label", `Remove ${item.label}`);
      chip.element.title = item.label;
    }
    arrange();
    hidden.replaceChildren();
    for (const value of selected)
      if (fieldName) {
        const field = doc.createElement("input");
        field.type = "hidden";
        field.name = fieldName;
        field.value = value;
        if (input.hasAttribute("form"))
          field.setAttribute("form", input.getAttribute("form")!);
        hidden.append(field);
      }
    syncState();
  };

  /** Native disabled/readOnly flags govern user edits; hidden controls carry only values. */
  const syncState = () => {
    for (const chip of chips.values()) chip.remove.disabled = !editable();
    for (const field of hidden.querySelectorAll("input"))
      field.disabled = input.matches(":disabled");
    input.setCustomValidity(
      required && !selected.length
        ? "Choose at least one item from the suggestions."
        : originalValidity
    );
    if (!editable()) close();
  };
  const emit = (previousValues: string[]) =>
    root.dispatchEvent(
      new CustomEvent("ag-token-change", {
        bubbles: true,
        detail: {
          values: [...selected],
          items: selected.map((value) => ({ ...entries.get(value)! })),
          previousValues,
        },
      })
    );
  const setValues = (
    values: readonly string[],
    nextInsertion = values.length
  ) => {
    if (destroyed) return;
    const next = validate(values);
    if (
      next.length === selected.length &&
      next.every((value, i) => value === selected[i])
    ) {
      if (insertion !== nextInsertion) moveInsertion(nextInsertion);
      return;
    }
    const previous = selected;
    selected = next;
    insertion = nextInsertion;
    render();
    close();
    emit(previous);
  };
  const add = (value: string) => {
    if (destroyed || !entries.has(value) || selected.includes(value))
      return false;
    setValues([...selected, value]);
    return true;
  };
  const remove = (value: string) => {
    if (destroyed || !selected.includes(value)) return false;
    setValues(
      selected.filter((item) => item !== value),
      selected.slice(0, insertion).filter((item) => item !== value).length
    );
    return true;
  };
  const choose = (index: number) => {
    const item = matches[index];
    if (!editable() || !item || selected.includes(item.value)) return;
    setValues(
      [
        ...selected.slice(0, insertion),
        item.value,
        ...selected.slice(insertion),
      ],
      insertion + 1
    );
    input.value = "";
    sizeInput();
    input.focus();
    close();
    announce(`${item.label} added.`);
  };
  const removeAndFocus = (button: HTMLButtonElement) => {
    if (!editable()) return;
    const value = button.dataset.tokenValue!;
    const index = selected.indexOf(value),
      label = entries.get(value)?.label;
    if (remove(value)) {
      (chips.get(selected[index])?.remove ?? input).focus();
      announce(`${label} removed.`);
    }
  };
  const onInput = () => {
    sizeInput();
    if (!composing) suggest();
  };
  const compositionStart = () => {
    composing = true;
    close();
  };
  const compositionEnd = () => {
    composing = false;
    sizeInput();
    suggest();
  };
  const onKeyDown = (event: KeyboardEvent) => {
    if (
      composing ||
      event.isComposing ||
      event.keyCode === 229 ||
      !editable() ||
      event.ctrlKey ||
      event.metaKey ||
      event.altKey
    )
      return;
    const target = event.target as HTMLElement;
    const buttons = selected.map((value) => chips.get(value)!.remove);
    if (target === input) {
      const collapsed = input.selectionStart === input.selectionEnd;
      const atStart = collapsed && input.selectionStart === 0;
      const atEnd = collapsed && input.selectionEnd === input.value.length;
      if (
        !event.shiftKey &&
        (event.key === "ArrowLeft" || event.key === "ArrowRight")
      ) {
        const step =
          (event.key === "ArrowRight" ? 1 : -1) *
          (getComputedStyle(control).direction === "rtl" ? -1 : 1);
        const next = insertion + step;
        if (
          (step < 0 ? atStart : atEnd) &&
          next >= 0 &&
          next <= selected.length
        ) {
          event.preventDefault();
          moveInsertion(next);
        }
      } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        if (!open()) {
          suggest(true);
          if (open() && event.key === "ArrowUp") highlight(matches.length - 1);
        } else
          highlight(
            (active + (event.key === "ArrowDown" ? 1 : -1) + matches.length) %
              matches.length
          );
      } else if (event.key === "Enter" && (open() || input.value.trim())) {
        event.preventDefault();
        if (open() && active >= 0) choose(active);
      } else if (event.key === "Escape" && open()) {
        event.preventDefault();
        event.stopPropagation();
        close();
      } else if (event.key === "Tab") {
        if (!event.shiftKey && open() && active >= 0) {
          event.preventDefault();
          choose(active);
        } else close();
      } else if (
        (event.key === "Backspace" && atStart && insertion > 0) ||
        (event.key === "Delete" && atEnd && insertion < selected.length)
      ) {
        event.preventDefault();
        close();
        const value =
          selected[event.key === "Backspace" ? insertion - 1 : insertion];
        const label = entries.get(value)!.label;
        remove(value);
        announce(`${label} removed.`);
      }
    } else if (target.matches(".ag-chip__remove")) {
      const index = buttons.indexOf(target as HTMLButtonElement);
      if (event.key === "Backspace" || event.key === "Delete") {
        event.preventDefault();
        removeAndFocus(target as HTMLButtonElement);
      } else if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        const step =
          (event.key === "ArrowRight" ? 1 : -1) *
          (getComputedStyle(root).direction === "rtl" ? -1 : 1);
        (buttons[index + step] ?? input).focus();
      } else if (event.key === "Escape") {
        event.preventDefault();
        input.focus();
      }
    }
  };
  /** Find the closest token edge on the clicked row, in logical writing order. */
  const insertionAt = (x: number, y: number) => {
    const rtl = getComputedStyle(control).direction === "rtl";
    let index = 0;
    let rowDistance = Infinity;
    let edgeDistance = Infinity;
    selected.forEach((value, i) => {
      const rect = chips.get(value)!.element.getBoundingClientRect();
      const dy = Math.max(rect.top - y, y - rect.bottom, 0);
      const edges = rtl ? [rect.right, rect.left] : [rect.left, rect.right];
      edges.forEach((edge, offset) => {
        const dx = Math.abs(x - edge);
        if (dy < rowDistance || (dy === rowDistance && dx < edgeDistance)) {
          index = i + offset;
          rowDistance = dy;
          edgeDistance = dx;
        }
      });
    });
    return index;
  };
  const onClick = (event: MouseEvent) => {
    const target = event.target as Element;
    const removeButton = target.closest<HTMLButtonElement>(".ag-chip__remove");
    if (removeButton && control.contains(removeButton))
      removeAndFocus(removeButton);
    else if (target === control && !input.matches(":disabled")) {
      if (editable() && !composing) {
        moveInsertion(insertionAt(event.clientX, event.clientY));
        input.focus();
        input.setSelectionRange(input.value.length, input.value.length);
      } else input.focus();
    }
  };
  const optionAt = (event: Event) =>
    (event.target as Element).closest<HTMLElement>("[data-index]");
  const pointerDown = (event: PointerEvent) => {
    if (optionAt(event)) event.preventDefault();
  };
  const optionClick = (event: MouseEvent) => {
    const option = optionAt(event);
    if (option) choose(Number(option.dataset.index));
  };
  const focusOut = () => {
    queueMicrotask(() => {
      if (!destroyed && doc.activeElement !== input) close();
    });
  };
  const toggle = () => {
    if (!open()) {
      write("aria-expanded", "false");
      write("aria-activedescendant", null);
      active = -1;
    }
  };
  const reset = (event: Event) => {
    if (event.target !== input.form) return;
    queueMicrotask(() => {
      if (!destroyed && !event.defaultPrevented) {
        setValues(initialValues.filter((value) => entries.has(value)));
        input.value = input.defaultValue;
        sizeInput();
        close();
        announce("");
      }
    });
  };
  const observer = new MutationObserver(() => {
    syncState();
  });
  observer.observe(input, {
    attributes: true,
    attributeFilter: ["disabled", "readonly"],
  });
  for (
    let ancestor = root.parentElement;
    ancestor;
    ancestor = ancestor.parentElement
  )
    if (ancestor instanceof HTMLFieldSetElement)
      observer.observe(ancestor, {
        attributes: true,
        attributeFilter: ["disabled"],
      });
  const resize = new ResizeObserver(schedulePosition);
  resize.observe(control);
  win.addEventListener("resize", schedulePosition);
  doc.addEventListener("scroll", schedulePosition, true);
  win.visualViewport?.addEventListener("resize", schedulePosition);
  win.visualViewport?.addEventListener("scroll", schedulePosition);
  input.addEventListener("input", onInput);
  input.addEventListener("compositionstart", compositionStart);
  input.addEventListener("compositionend", compositionEnd);
  input.addEventListener("focusout", focusOut);
  root.addEventListener("keydown", onKeyDown);
  control.addEventListener("click", onClick);
  popup.addEventListener("pointerdown", pointerDown);
  popup.addEventListener("click", optionClick);
  popup.addEventListener("toggle", toggle);
  doc.addEventListener("reset", reset, true);

  const controller: TokenFieldController = {
    update(next = {}) {
      if (destroyed) return;
      const nextEntries = next.items ? catalogue(next.items) : entries;
      const values =
        next.values ?? selected.filter((value) => nextEntries.has(value));
      if (
        new Set(values).size !== values.length ||
        values.some((value) => !nextEntries.has(value))
      )
        throw new Error(
          "TokenField selection must contain unique catalogue values."
        );
      entries = nextEntries;
      selected = [...values];
      insertion = Math.min(insertion, selected.length);
      fieldName = next.name ?? fieldName;
      required = next.required ?? required;
      write("aria-required", String(required));
      render();
      controller.refresh();
    },
    get values() {
      return [...selected];
    },
    get selectedItems() {
      return selected.map((value) => ({ ...entries.get(value)! }));
    },
    setValues,
    add,
    remove,
    clear() {
      setValues([]);
    },
    setItems(items) {
      if (destroyed) return;
      const next = catalogue(items),
        previous = selected;
      entries = next;
      insertion = selected
        .slice(0, insertion)
        .filter((value) => entries.has(value)).length;
      selected = selected.filter((value) => entries.has(value));
      render();
      suggest();
      if (previous.length !== selected.length) emit(previous);
    },
    refresh() {
      if (!destroyed) {
        sizeInput();
        syncState();
        suggest();
      }
    },
    destroy() {
      if (destroyed) return;
      close();
      destroyed = true;
      observer.disconnect();
      resize.disconnect();
      win.cancelAnimationFrame(frame);
      input.removeEventListener("input", onInput);
      input.removeEventListener("compositionstart", compositionStart);
      input.removeEventListener("compositionend", compositionEnd);
      input.removeEventListener("focusout", focusOut);
      root.removeEventListener("keydown", onKeyDown);
      control.removeEventListener("click", onClick);
      popup.removeEventListener("pointerdown", pointerDown);
      popup.removeEventListener("click", optionClick);
      popup.removeEventListener("toggle", toggle);
      doc.removeEventListener("reset", reset, true);
      win.removeEventListener("resize", schedulePosition);
      doc.removeEventListener("scroll", schedulePosition, true);
      win.visualViewport?.removeEventListener("resize", schedulePosition);
      win.visualViewport?.removeEventListener("scroll", schedulePosition);
      for (const chip of chips.values()) {
        chip.avatar.destroy();
        chip.element.remove();
      }
      popup.remove();
      status.remove();
      hidden.remove();
      for (const [name, value] of attributes) {
        if (value === null) input.removeAttribute(name);
        else input.setAttribute(name, value);
      }
      if (previousAnchor[0])
        control.style.setProperty(
          "anchor-name",
          previousAnchor[0],
          previousAnchor[1]
        );
      else control.style.removeProperty("anchor-name");
      input.setCustomValidity(originalValidity);
      controllers.delete(root);
    },
  };
  render();
  controllers.set(root, controller);
  return controller;
}
