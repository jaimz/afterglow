/** An attribute map separating `className` as a special attribute */
type Attributes = {
  [key: string]: string | undefined;
  className?: string;
};

// Object.entries doesn't play particularly nicely with the type system...
type Entries<T> = {
  [K in keyof T]: [K, T[K]];
}[keyof T][];

export function entries<T>(obj: T): Entries<T> {
  return Object.entries(obj) as any;
}

/** Apply the css class(es) to the given DOM element. */
export function applyClasses(dom: Element, className: string | string[]) {
  const cn = Array.isArray(className) ? className : className.trim().split(" ");
  dom.classList.add(...cn);
}

/** Apply an attribute map to a DOM node */
export function applyAttributes(element: Element, attributes: Attributes) {
  const { className, ...remainingAtts } = attributes;

  for (const [name, value] of entries(remainingAtts)) {
    if (value) element.setAttribute(name, value);
    else element.removeAttribute(name);
  }

  if (className) applyClasses(element, className);
}

/**
 * Create a DOM node with the given tag name, attributes and content.
 * If a parent is specified append the new node to the children of that
 * parent.
 */
export function createDom(
  tag: string,
  attributes?: Attributes,
  content?: string | string[] | Element | Element[] | null,
  parent?: HTMLElement | DocumentFragment
) {
  const dom = document.createElement(tag);

  if (attributes) {
    applyAttributes(dom, attributes);
  }

  if (content) {
    // Laborious but slightly more efficient
    if (typeof content === "string") {
      dom.insertAdjacentText("beforeend", content);
    } else if (content instanceof Element) {
      dom.insertAdjacentElement("beforeend", content);
    } else if (Array.isArray(content)) {
      for (const c of content) {
        if (typeof c === "string") {
          dom.insertAdjacentText("beforeend", c);
        } else {
          dom.insertAdjacentElement("beforeend", c);
        }
      }
    } else {
      // err...
      throw new TypeError(`Content of unexpected type: ${typeof content}`);
    }
  }

  if (parent) {
    if (parent instanceof HTMLElement)
      parent.insertAdjacentElement("beforeend", dom);
    else parent.append(dom);
  }

  return dom;
}
