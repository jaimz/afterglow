/**
 * Keep an image's decorative backlight in sync with its native source.
 * Start with an .ag-image figure containing a direct img.ag-image__picture.
 * Its URL, alt text and optional figcaption work without this helper.
 *
 * Pass { backlight: true } or add data-backlight to enable the blurred copy.
 * Assign controller.imageUrl to replace the source, or change the native img's
 * src/srcset/sizes directly. The copy follows the successfully loaded currentSrc,
 * including the browser's responsive source selection, without using a canvas.
 * Call destroy() when removing the view to release listeners and observation.
 *
 * @example
 * const photo = enhanceImage(document.querySelector<HTMLElement>("#photo")!, {
 *   imageUrl: "/photos/coast.jpg", backlight: true,
 * });
 * photo.imageUrl = "/photos/forest.jpg";
 * photo.backlight = false;
 * photo.destroy();
 */
export interface ImageOptions {
  /** Omit to keep native sources. An empty URL clears the image. */
  imageUrl?: string;
  /** Omit to preserve the wrapper's data-backlight flag. */
  backlight?: boolean;
}

export interface ImageController {
  /** Reconcile current DOM state immediately. */
  refresh(): void;
  /** The native image owns alternative text, loading and responsive sources. */
  readonly image: HTMLImageElement;
  /** Read or replace src. Assignment clears srcset and sizes. */
  imageUrl: string;
  /** Enable or disable the decorative blurred copy. */
  backlight: boolean;
  /** Apply optional settings and refresh the copy from the loaded image. */
  update(options?: ImageOptions): void;
  /** Release listeners and remove the generated copy; keep native content. */
  destroy(): void;
}

const controllers = new WeakMap<HTMLElement, ImageController>();

/** Enhance one figure. Repeated calls return its existing controller. */
export function enhanceImage(
  root: HTMLElement,
  options: ImageOptions = {}
): ImageController {
  const existing = controllers.get(root);
  if (existing) {
    existing.update(options);
    return existing;
  }
  const image = root.querySelector<HTMLImageElement>(
    ":scope > img.ag-image__picture"
  );
  if (!image)
    throw new Error("An image requires a direct img.ag-image__picture.");

  const authoredCopy = root.querySelector<HTMLImageElement>(
    ":scope > img.ag-image__backlight"
  );
  const copy = authoredCopy ?? root.ownerDocument.createElement("img");
  const attributes = [
    "src",
    "srcset",
    "sizes",
    "alt",
    "aria-hidden",
    "draggable",
    "hidden",
  ];
  const original = attributes.map(
    (name) => [name, copy.getAttribute(name)] as const
  );
  copy.classList.add("ag-image__backlight");
  copy.alt = "";
  copy.setAttribute("aria-hidden", "true");
  copy.draggable = false;
  copy.removeAttribute("srcset");
  copy.removeAttribute("sizes");
  if (!authoredCopy) root.prepend(copy);
  let destroyed = false;

  /** Mirror only a loaded source; failed or empty images must not leave stale light. */
  const sync = () => {
    if (destroyed) return;
    const source = image.currentSrc || image.getAttribute("src");
    const ready =
      root.hasAttribute("data-backlight") &&
      !!(image.getAttribute("src") || image.getAttribute("srcset")) &&
      image.complete &&
      image.naturalWidth > 0 &&
      !!source;
    copy.hidden = !ready;
    if (ready) {
      if (copy.getAttribute("src") !== source)
        copy.setAttribute("src", source!);
    } else copy.removeAttribute("src");
  };

  const update = (settings: ImageOptions = {}) => {
    if (destroyed) return;
    if (settings.imageUrl !== undefined) {
      image.removeAttribute("srcset");
      image.removeAttribute("sizes");
      const url = settings.imageUrl.trim();
      if (url) image.setAttribute("src", url);
      else image.removeAttribute("src");
      copy.hidden = true;
      copy.removeAttribute("src");
    }
    if (settings.backlight !== undefined)
      root.toggleAttribute("data-backlight", settings.backlight);
    sync();
  };

  image.addEventListener("load", sync);
  image.addEventListener("error", sync);
  const observer = new MutationObserver(sync);
  observer.observe(image, {
    attributes: true,
    attributeFilter: ["src", "srcset", "sizes"],
  });
  observer.observe(root, {
    attributes: true,
    attributeFilter: ["data-backlight"],
  });

  const controller: ImageController = {
    refresh: () => update(),
    image,
    get imageUrl() {
      return image.getAttribute("src") ?? "";
    },
    set imageUrl(value) {
      update({ imageUrl: value });
    },
    get backlight() {
      return root.hasAttribute("data-backlight");
    },
    set backlight(value) {
      update({ backlight: value });
    },
    update,
    destroy() {
      if (destroyed) return;
      destroyed = true;
      observer.disconnect();
      image.removeEventListener("load", sync);
      image.removeEventListener("error", sync);
      if (authoredCopy) {
        for (const [name, value] of original) {
          if (value === null) copy.removeAttribute(name);
          else copy.setAttribute(name, value);
        }
      } else copy.remove();
      controllers.delete(root);
    },
  };
  controllers.set(root, controller);
  update(options);
  return controller;
}
