/**
 * Adds automatic initials, letter fitting and photo fallback to a native avatar.
 * Load the Afterglow styles, mount an .ag-avatar element, and set data-variant to
 * "initials", "image" or "blank". Pass that element to enhanceAvatar.
 *
 * Assign controller.name or controller.imageUrl when the person changes, or use
 * update(options) to change several settings. Initials and image fallback refresh
 * automatically; letter fitting also follows resizing and font loading.
 * Call destroy() when disposing the view to release observers and listeners.
 * See Usage.md for the markup, shape/size options and accessible labelling.
 *
 * @example
 * import { enhanceAvatar } from "ag";
 *
 * const root = document.querySelector<HTMLElement>("#author-avatar")!;
 * const avatar = enhanceAvatar(root, { name: "Ada Lovelace" });
 * avatar.initials; // "al"
 * avatar.name = "Grace Hopper";
 *
 * // When removing the avatar from the page:
 * avatar.destroy();
 */

export interface AvatarOptions {
  /** Display name. Also available as data-name on the native element. */
  name?: string;

  /** Photo URL. Omit to preserve native image sources; an empty string clears them. */
  imageUrl?: string;

  /** Override culturally ambiguous initials; null returns to automatic extraction. */
  initials?: string | null;

  /** BCP 47 locale used for case conversion and grapheme segmentation. */
  locale?: string;

  /** Hide a redundant avatar from assistive technology. */
  decorative?: boolean;

  /** Accessible label override, for example a translated "Unknown user". */
  label?: string;
}

/** Writable avatar content, the displayed initials, and lifecycle methods. */
export interface AvatarController {
  /** Read or assign the name; assignment updates data-name and the rendered avatar. */
  name: string;

  /** Read or replace the photo's src; assignment clears responsive image sources. */
  imageUrl: string;

  /** The currently displayed initials, including any explicit override. */
  readonly initials: string;

  /** Merge new settings and refresh the avatar; omit options to refresh after styling changes. */
  update(options?: AvatarOptions): void;

  /** Stop fitting and observation, release listeners, and leave the current markup in place. */
  destroy(): void;
}

const titles = new Set([
  "mr",
  "mrs",
  "ms",
  "miss",
  "mx",
  "dr",
  "prof",
  "sir",
  "dame",
  "rev",
]);

const suffixes = new Set(["jr", "sr", "ii", "iii", "iv", "phd", "md", "esq"]);

const wordKey = (word: string) => word.replace(/\./g, "").toLowerCase();

const cleanName = (name: string) =>
  name.normalize("NFC").trim().replace(/\s+/gu, " ");

/** Split visible characters without separating combining marks or joined glyphs. */
const graphemes = (text: string, locale?: string): string[] =>
  Array.from(
    new Intl.Segmenter(locale, { granularity: "grapheme" }).segment(text),
    ({ segment }) => segment
  );

const initial = (word: string, locale?: string) =>
  graphemes(word, locale).find((part) => /[\p{L}\p{N}]/u.test(part)) ?? "";

/**
 * Extract lowercase initials from the first and last name parts, skipping common
 * titles and suffixes. Handles "Family, Given" ordering and a hyphenated lone name.
 * Preserves graphemes and accepts a locale for casing; returns "" for an empty name.
 * This function needs no DOM and can also generate initials for static markup.
 */
export function getAvatarInitials(name: string, locale?: string): string {
  const parts = cleanName(name)
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  // "Family, Given" is a common explicit ordering. A trailing suffix is not.
  if (parts.length > 1 && !suffixes.has(wordKey(parts[1]))) {
    [parts[0], parts[1]] = [parts[1], parts[0]];
  }

  const words = parts
    .join(" ")
    .split(/\s+/u)
    .filter((word) => initial(word, locale));

  while (words.length > 1 && titles.has(wordKey(words[0]))) words.shift();
  while (words.length > 1 && suffixes.has(wordKey(words[words.length - 1])))
    words.pop();

  const names =
    words.length === 1 ? words[0].split(/[-‐‑]+/u).filter(Boolean) : words;
  const chosen = names.length > 1 ? [names[0], names[names.length - 1]] : names;

  // Case each initial independently; a pair is not a word (Greek sigma, etc.).
  return chosen
    .map((word) => initial(word, locale).toLocaleLowerCase(locale))
    .join("");
}

const controllers = new WeakMap<HTMLElement, AvatarController>();

/**
 * Enhance a mounted .ag-avatar, or return its existing controller if already set up.
 * Use controller.update(options) to change settings after the first call.
 */
export function enhanceAvatar(
  root: HTMLElement,
  options: AvatarOptions = {}
): AvatarController {
  const existing = controllers.get(root);
  if (existing) return existing;

  const document = root.ownerDocument;
  const view = document.defaultView;
  if (!view)
    throw new Error("An Afterglow avatar requires an active document.");

  let settings: AvatarOptions = {
    decorative: root.getAttribute("aria-hidden") === "true",
    ...options,
  };
  let destroyed = false;
  let text = "";
  let frame = 0;
  let portrait: HTMLImageElement | null = null;
  let letters: HTMLElement;
  const measure = document.createElement("canvas").getContext("2d");

  /** Fit the rendered letters within the shape while preserving the intended crop. */
  const fit = () => {
    frame = 0;
    if (destroyed || !root.isConnected || !letters) return;

    letters.style.removeProperty("--ag-avatar-initial-fit");
    letters.style.removeProperty("--ag-avatar-initial-right");
    letters.style.removeProperty("--ag-avatar-initial-bottom");

    const available = root.getBoundingClientRect().width;
    const width = letters.getBoundingClientRect().width;
    if (!available || !width) return;

    // Preserve the lower-right crop for ordinary pairs. Wide pairs shrink
    // to keep the first letter inside the leaf; single/round monograms centre.
    const centered =
      root.dataset.initialLayout === "centered" ||
      ["circle", "square"].includes(root.dataset.shape ?? "");
    const initialStyle = view.getComputedStyle(letters);
    const originalRight = parseFloat(initialStyle.right);
    const originalBottom = parseFloat(initialStyle.bottom);
    const ratio = Math.min(1, (available * (centered ? 0.8 : 0.9375)) / width);
    if (ratio < 1)
      letters.style.setProperty("--ag-avatar-initial-fit", String(ratio));

    if (!centered) {
      // A narrow final letter ("al", "jl") must not disappear beyond the edge.
      // Reduce both overhangs as wide pairs shrink, keeping the glyphs readable.
      let right = originalRight * ratio;
      if (measure) {
        const fitted = view.getComputedStyle(letters);
        measure.font = `${fitted.fontWeight} ${fitted.fontSize} ${fitted.fontFamily}`;
        const last = graphemes(text).at(-1) ?? "";
        const metrics = measure.measureText(last);
        const inkWidth =
          metrics.actualBoundingBoxLeft + metrics.actualBoundingBoxRight;
        right = -Math.min(Math.abs(right), Math.max(0, inkWidth) * 0.3);
      }

      letters.style.setProperty("--ag-avatar-initial-right", `${right}px`);
      letters.style.setProperty(
        "--ag-avatar-initial-bottom",
        `${originalBottom * ratio}px`
      );
    }
  };

  // Coalesce font, resize and content changes into one measurement per frame.
  const scheduleFit = () => {
    if (!destroyed && !frame) frame = view.requestAnimationFrame(fit);
  };

  /** Choose initials or blank artwork while an image is missing, loading or broken. */
  const imageState = () => {
    const variant = root.dataset.variant ?? "image";
    const needsFallback =
      variant === "image"
        ? !portrait?.complete || !portrait.naturalWidth
        : variant !== "blank" && !text;

    if (needsFallback)
      root.dataset.avatarFallback = text ? "initials" : "blank";
    else root.removeAttribute("data-avatar-fallback");
    scheduleFit();
  };

  const imageObserver = new MutationObserver(imageState);

  /** Rebind image events when the caller replaces the native image element. */
  const bindImage = () => {
    const next = root.querySelector<HTMLImageElement>(
      ":scope > .ag-avatar__image"
    );
    if (next === portrait) return;

    portrait?.removeEventListener("load", imageState);
    portrait?.removeEventListener("error", imageState);
    imageObserver.disconnect();

    portrait = next;
    portrait?.addEventListener("load", imageState);
    portrait?.addEventListener("error", imageState);
    if (portrait)
      imageObserver.observe(portrait, {
        attributes: true,
        attributeFilter: ["src", "srcset", "sizes"],
      });
  };

  /** Derive the visible initials and accessible label, then schedule image/fit updates. */
  const render = () => {
    if (destroyed) return;

    const name = cleanName(root.dataset.name ?? "");
    const locale =
      settings.locale ||
      root.closest("[lang]")?.getAttribute("lang") ||
      undefined;

    text =
      settings.initials == null
        ? getAvatarInitials(name, locale)
        : graphemes(cleanName(settings.initials), locale)
            .filter((part) => !/\s/u.test(part))
            .slice(0, 2)
            .join("");

    letters = root.querySelector<HTMLElement>(":scope > .ag-avatar__initials")!;
    if (!letters) {
      letters = document.createElement("span");
      letters.className = "ag-avatar__initials";
      root.append(letters);
    }

    if (letters.textContent !== text) letters.textContent = text;
    letters.setAttribute("aria-hidden", "true");
    root.dataset.initialCount = String(graphemes(text, locale).length);

    // The cropped Latin treatment can remove meaningful strokes from other
    // scripts. Centre those monograms so the complete characters remain visible.
    root.dataset.initialLayout =
      root.dataset.initialCount === "1" ||
      !/^[\p{Script=Latin}\p{M}\p{N}]+$/u.test(text)
        ? "centered"
        : "monogram";

    if (settings.decorative) {
      root.setAttribute("aria-hidden", "true");
    } else {
      root.removeAttribute("aria-hidden");
      root.setAttribute("role", "img");
      root.setAttribute(
        "aria-label",
        settings.label ?? (name || "Unknown user")
      );
    }

    bindImage();
    imageState();
  };

  /** Apply only the supplied options, preserving caller-managed image sources otherwise. */
  const update = (next: AvatarOptions = {}) => {
    if (destroyed) return;

    settings = { ...settings, ...next };
    if (next.name !== undefined) root.dataset.name = next.name;

    if (next.imageUrl !== undefined) {
      const url = next.imageUrl.trim();
      let image = root.querySelector<HTMLImageElement>(
        ":scope > .ag-avatar__image"
      );

      if (!image && url) {
        image = document.createElement("img");
        image.className = "ag-avatar__image";
        image.alt = "";
        root.prepend(image);
      }

      if (image) {
        // An explicit single URL replaces any native responsive source choices.
        image.removeAttribute("srcset");
        image.removeAttribute("sizes");
        if (!url) image.removeAttribute("src");
        else if (image.getAttribute("src") !== url)
          image.setAttribute("src", url);
      }
    }

    render();
  };

  update(options);

  const observer = new MutationObserver(render);
  observer.observe(root, {
    attributes: true,
    childList: true,
    attributeFilter: [
      "data-name",
      "data-variant",
      "data-size",
      "data-shape",
      "lang",
      "style",
      "class",
    ],
  });

  const resize = new ResizeObserver(scheduleFit);
  resize.observe(root);

  document.fonts.addEventListener("loadingdone", scheduleFit);
  void document.fonts.ready.then(scheduleFit);

  const controller: AvatarController = {
    get name() {
      return root.dataset.name ?? "";
    },

    set name(name: string) {
      update({ name });
    },

    get imageUrl() {
      return (
        root
          .querySelector<HTMLImageElement>(":scope > .ag-avatar__image")
          ?.getAttribute("src") ?? ""
      );
    },

    set imageUrl(imageUrl: string) {
      update({ imageUrl });
    },

    get initials() {
      return text;
    },

    update,

    destroy() {
      if (destroyed) return;

      destroyed = true;
      observer.disconnect();
      imageObserver.disconnect();
      resize.disconnect();

      portrait?.removeEventListener("load", imageState);
      portrait?.removeEventListener("error", imageState);
      document.fonts.removeEventListener("loadingdone", scheduleFit);
      if (frame) view.cancelAnimationFrame(frame);

      controllers.delete(root);
    },
  };

  controllers.set(root, controller);

  return controller;
}
