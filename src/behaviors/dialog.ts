/**
 * Adds animated opening/closing and dismissal requests to a native <dialog>.
 * Load the Afterglow styles, give the dialog the .ag-dialog class and an
 * accessible label, then pass it to enhanceDialog.
 *
 * Use show() to open and hide() to close after the exit animation. Escape and
 * backdrop clicks emit a dismiss request: the application decides whether to
 * close, for example after checking for unsaved changes. Native close() and
 * forms with method="dialog" still close immediately.
 *
 * Both modal and trapFocus default to true. Non-modal dialogs can opt out of
 * focus containment. Call destroy() when disposing the view, and remove any
 * application listeners separately. See Usage.md for full markup and invokers.
 *
 * @example
 * import { enhanceDialog } from "ag";
 *
 * const dialog = document.querySelector<HTMLDialogElement>("#settings-dialog")!;
 * const modal = enhanceDialog(dialog);
 * const onDismiss = () => void modal.hide();
 * dialog.addEventListener("dismiss", onDismiss);
 * await modal.show();
 *
 * // When disposing the view:
 * dialog.removeEventListener("dismiss", onDismiss);
 * modal.destroy();
 */

export interface DialogOptions {
  /** Open modally with native focus containment; defaults to true. */
  modal?: boolean;

  /** Keep focus inside a non-modal dialog; defaults to true and is ignored for modals. */
  trapFocus?: boolean;
}

export interface DialogController {
  /** Open with per-call options; resolves after starting the entry animation. */
  show(options?: DialogOptions): Promise<void>;

  /** Await animated closing and pass an optional returnValue to the native dialog. */
  hide(returnValue?: string): Promise<void>;

  /** Emit dismiss and cancel requests; the application's listener decides whether to hide. */
  dismiss(): void;

  /** Stop animation, remove helper listeners, and close the native dialog immediately. */
  destroy(): void;
}

const controllers = new WeakMap<HTMLDialogElement, DialogController>();

/**
 * Enhance a native dialog, or return its existing controller if already set up.
 * Defaults are captured on the first call; show(options) overrides one opening.
 */
export function enhanceDialog(
  dialog: HTMLDialogElement,
  defaults: DialogOptions = {}
): DialogController {
  const existing = controllers.get(dialog);
  if (existing) return existing;

  // Each new transition invalidates any older asynchronous close still in flight.
  let transition = 0;
  let animation: Animation | undefined;
  let modal = defaults.modal ?? true;
  let trapFocus = defaults.trapFocus ?? true;
  let dispatchingCancel = false;
  let destroyed = false;
  let previousFocus: HTMLElement | null = null;

  const stop = () => {
    animation?.cancel();
    animation = undefined;
  };

  /** Pick the entry/exit direction from the dialog's visual anchor. */
  const transform = () => {
    const push =
      getComputedStyle(dialog).getPropertyValue("--motionPush").trim() ||
      "16px";

    switch (dialog.dataset.anchor) {
      case "left":
        return `translateX(calc(-1 * ${push}))`;
      case "right":
        return `translateX(${push})`;
      case "top":
        return `translateY(calc(-1 * ${push}))`;
      case "bottom":
        return `translateY(${push})`;
      default:
        return "scale(0.9)";
    }
  };

  /** Animate with theme motion tokens, respecting the reduced-motion preference. */
  const animate = (exit: boolean) => {
    const styles = getComputedStyle(dialog);
    const speed =
      styles.getPropertyValue("--motionSlowDuration").trim() || "250ms";
    const duration = matchMedia("(prefers-reduced-motion: reduce)").matches
      ? 0
      : parseFloat(speed) * (speed.endsWith("ms") ? 1 : 1000);
    const easing =
      styles
        .getPropertyValue(exit ? "--motionExitCurve" : "--motionEntryCurve")
        .trim() || (exit ? "ease-out" : "ease-in");
    const frames = [
      { opacity: 0, transform: transform() },
      { opacity: 1, transform: "none" },
    ];

    animation = dialog.animate(exit ? frames.reverse() : frames, {
      duration: Number.isFinite(duration) ? duration : 250,
      easing,
      fill: "both",
    });

    return animation;
  };

  const focusables = () =>
    Array.from(dialog.querySelectorAll<HTMLElement>("*")).filter(
      (element) =>
        element.tabIndex >= 0 &&
        !element.matches(":disabled, [hidden]") &&
        element.getClientRects().length
    );

  // The browser contains modal focus; non-modal containment needs this helper.
  const keepFocus = (event: Event) => {
    if (
      dialog.open &&
      !modal &&
      trapFocus &&
      !event.composedPath().includes(dialog)
    )
      (focusables()[0] ?? dialog).focus();
  };

  const keydown = (event: KeyboardEvent) => {
    if (!dialog.open) return;

    // Handle Escape before the platform close watcher: its cancel event can be
    // non-cancelable when the dialog was opened without transient user activation.
    if (event.key === "Escape" && !event.defaultPrevented) {
      event.preventDefault();
      controller.dismiss();
    }

    if (modal) return;
    if (event.key !== "Tab" || !trapFocus) return;

    const items = focusables();
    if (
      !items.length ||
      (event.shiftKey
        ? document.activeElement === items[0]
        : document.activeElement === items[items.length - 1])
    ) {
      event.preventDefault();
      (event.shiftKey
        ? items[items.length - 1] ?? dialog
        : items[0] ?? dialog
      ).focus();
    }
  };

  /** Convert a native cancel into an application-owned dismissal request. */
  const cancel = (event: Event) => {
    if (dispatchingCancel) return;

    event.preventDefault();
    dialog.dispatchEvent(
      new Event("dismiss", { bubbles: true, cancelable: true })
    );
  };

  let pointerOutside = false;

  // Backdrop events target the dialog, so use its bounds to distinguish them.
  const outside = (event: MouseEvent) => {
    const bounds = dialog.getBoundingClientRect();

    return (
      event.target === dialog &&
      (event.clientX < bounds.left ||
        event.clientX > bounds.right ||
        event.clientY < bounds.top ||
        event.clientY > bounds.bottom)
    );
  };

  const pointerdown = (event: PointerEvent) => {
    pointerOutside = outside(event);
  };

  const backdrop = (event: MouseEvent) => {
    // Require both press and release outside; dragging from the content is safe.
    if (modal && pointerOutside && outside(event)) controller.dismiss();
    pointerOutside = false;
  };

  /** Clean up after any native close, including a method="dialog" form submission. */
  const close = () => {
    if (dialog.open) return;

    ++transition;
    stop();
    delete dialog.dataset.closing;
    dialog.ownerDocument.removeEventListener("focusin", keepFocus);
    if (previousFocus?.isConnected) previousFocus.focus();
  };

  /** Route supported native invoker commands through the animated lifecycle. */
  const command = (event: Event) => {
    const name = (event as Event & { command: string }).command;
    if (!["show-modal", "close", "request-close"].includes(name)) return;

    event.preventDefault();
    if (name === "show-modal") void controller.show();
    else if (name === "close") void controller.hide();
    else controller.dismiss();
  };

  const controller: DialogController = {
    async show(options = {}) {
      if (destroyed) return;

      ++transition;
      stop();
      delete dialog.dataset.closing;

      const nextModal = options.modal ?? defaults.modal ?? true;
      trapFocus = options.trapFocus ?? defaults.trapFocus ?? true;
      if (!dialog.open)
        previousFocus =
          document.activeElement instanceof HTMLElement
            ? document.activeElement
            : null;

      // Native modal status can only change by closing and reopening the dialog.
      if (dialog.open && dialog.matches(":modal") !== nextModal) dialog.close();
      modal = nextModal;
      const opening = !dialog.open;
      if (opening) {
        if (modal) dialog.showModal();
        else dialog.show();
      }

      dialog.ownerDocument.addEventListener("focusin", keepFocus);
      if (opening) animate(false);
    },

    async hide(returnValue) {
      if (!dialog.open || destroyed) return;

      const current = ++transition;
      stop();
      dialog.dataset.closing = "";

      // Keep native modality during exit and ignore a close superseded by show().
      await animate(true).finished.catch(() => undefined);
      if (current !== transition || destroyed) return;

      dialog.close(returnValue);
      stop();
      delete dialog.dataset.closing;
      dialog.ownerDocument.removeEventListener("focusin", keepFocus);
    },

    dismiss() {
      dialog.dispatchEvent(
        new Event("dismiss", { bubbles: true, cancelable: true })
      );

      // Let callers observe cancel without recursively translating it to dismiss.
      dispatchingCancel = true;
      try {
        dialog.dispatchEvent(
          new Event("cancel", { bubbles: true, cancelable: true })
        );
      } finally {
        dispatchingCancel = false;
      }
    },

    destroy() {
      if (destroyed) return;

      destroyed = true;
      ++transition;
      stop();

      dialog.ownerDocument.removeEventListener("focusin", keepFocus);
      dialog.removeEventListener("keydown", keydown);
      dialog.removeEventListener("cancel", cancel);
      dialog.removeEventListener("pointerdown", pointerdown);
      dialog.removeEventListener("click", backdrop);
      dialog.removeEventListener("close", close);
      dialog.removeEventListener("command", command);

      delete dialog.dataset.closing;
      dialog.close();
      controllers.delete(dialog);
    },
  };

  dialog.addEventListener("keydown", keydown);
  dialog.addEventListener("cancel", cancel);
  dialog.addEventListener("pointerdown", pointerdown);
  dialog.addEventListener("click", backdrop);
  dialog.addEventListener("close", close);
  dialog.addEventListener("command", command);

  controllers.set(dialog, controller);

  return controller;
}
