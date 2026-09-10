/** Register once, so applications can register individual components or all of them. */
export function registerElement(
  name: string,
  element: CustomElementConstructor
): void {
  const existing = customElements.get(name);
  if (!existing) customElements.define(name, element);
  else if (existing !== element)
    throw new Error(`${name} is already registered by another component.`);
}
