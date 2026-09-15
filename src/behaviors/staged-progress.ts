/**
 * Enhances an ordered list of circular progress controls, one per subtask.
 * Put each .ag-circular-progress inside a direct .ag-staged-progress__stage
 * list item, then pass the .ag-staged-progress list to this helper.
 *
 * The stages array follows DOM order and exposes the existing circular progress
 * controllers. Every stage keeps its own title, amount and failure flag; this
 * helper never starts the next task or clears another task's error.
 * Add, remove or reorder list items normally. Changes are observed; refresh()
 * reconciles them immediately when you need the new controllers synchronously.
 * Orientation is CSS: set data-orientation="horizontal" or "vertical" on the list.
 *
 * @example
 * const task = enhanceStagedProgress(document.querySelector("#publish")!);
 * task.stages[0].value = 100;
 * task.stages[1].value = 35;
 * task.stages[1].error = true;
 * // When disposing the view:
 * task.destroy();
 */

import {
  enhanceCircularProgress,
  type CircularProgressController,
} from "./circular-progress";

export interface StagedProgressController {
  /** Current stage controllers in list order; take a fresh snapshot after edits. */
  readonly stages: readonly CircularProgressController[];

  /** Reconcile added, removed or reordered stages and refresh their displays now. */
  refresh(): void;

  /** Stop observation and destroy child controllers created by this helper. */
  destroy(): void;
}

interface StageEntry {
  controller: CircularProgressController;
  owned: boolean;
}

const controllers = new WeakMap<HTMLElement, StagedProgressController>();

/** Enhance a native ordered list; repeated calls return the same controller. */
export function enhanceStagedProgress(
  root: HTMLElement
): StagedProgressController {
  const existing = controllers.get(root);
  if (existing) return existing;
  if (!root.matches("ol"))
    throw new Error("Staged progress requires an ordered list element.");

  const entries = new Map<HTMLElement, StageEntry>();
  const originalTabIndex = root.getAttribute("tabindex");
  let stages: CircularProgressController[] = [];
  let destroyed = false;

  /** Make an overflowing sequence keyboard-scrollable, preserving authored focus. */
  const updateScrollFocus = () => {
    if (destroyed || originalTabIndex !== null) return;
    const overflowing = root.scrollWidth > root.clientWidth + 1;
    if (overflowing) root.setAttribute("tabindex", "0");
    else root.removeAttribute("tabindex");
  };

  const resizeObserver = new ResizeObserver(updateScrollFocus);
  resizeObserver.observe(root);

  /** Reuse surviving stages and release removed ones without resetting their data. */
  const refresh = () => {
    if (destroyed) return;

    const wrappers = Array.from(
      root.querySelectorAll<HTMLElement>(
        ":scope > .ag-staged-progress__stage > .ag-circular-progress"
      )
    ).filter(
      (wrapper) =>
        wrapper.querySelector("progress") &&
        wrapper.querySelector(".ag-circular-progress__title")
    );
    const current = new Set(wrappers);

    for (const [wrapper, entry] of entries) {
      if (current.has(wrapper)) continue;
      if (entry.owned) entry.controller.destroy();
      resizeObserver.unobserve(wrapper);
      entries.delete(wrapper);
    }

    stages = wrappers.map((wrapper) => {
      let entry = entries.get(wrapper);
      if (!entry) {
        // An already enhanced circle belongs to its original caller.
        const owned = !wrapper.hasAttribute("data-enhanced");
        entry = { controller: enhanceCircularProgress(wrapper), owned };
        entries.set(wrapper, entry);
        resizeObserver.observe(wrapper);
      }
      entry.controller.update();
      return entry.controller;
    });

    updateScrollFocus();
  };

  const observer = new MutationObserver((records) => {
    // Ignore title edits and generated ring changes inside a stage: its own
    // circular progress controller observes those without rebuilding the list.
    const structureChanged = records.some(
      (record) =>
        record.type === "childList" &&
        (record.target === root ||
          (record.target instanceof Element &&
            record.target.parentElement === root))
    );
    if (structureChanged) refresh();
    else updateScrollFocus();
  });

  const controller: StagedProgressController = {
    get stages() {
      return [...stages];
    },

    refresh,

    destroy() {
      if (destroyed) return;
      destroyed = true;
      observer.disconnect();
      resizeObserver.disconnect();
      for (const entry of entries.values()) {
        if (entry.owned) entry.controller.destroy();
      }
      entries.clear();
      stages = [];
      if (originalTabIndex === null) root.removeAttribute("tabindex");
      else root.setAttribute("tabindex", originalTabIndex);
      controllers.delete(root);
    },
  };

  refresh();
  observer.observe(root, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["data-orientation", "hidden"],
  });
  controllers.set(root, controller);
  return controller;
}
