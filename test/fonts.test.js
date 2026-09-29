import { expect } from "@esm-bundle/chai";

let stylesheet;

before(async () => {
  stylesheet = document.createElement("link");
  stylesheet.rel = "stylesheet";
  stylesheet.href = "/afterglow.css";
  const loaded = new Promise((resolve, reject) => {
    stylesheet.onload = resolve;
    stylesheet.onerror = reject;
  });
  document.head.append(stylesheet);
  await loaded;
});

after(() => stylesheet.remove());

it("loads bundled Lato faces for every weight and style, independently of installed fonts", async () => {
  const rules = [...stylesheet.sheet.cssRules].filter(
    (rule) => rule.type === CSSRule.FONT_FACE_RULE &&
      rule.style.fontFamily.replaceAll('"', "") === "Lato"
  );
  expect(rules).to.have.length(18);
  const light = rules.find(
    (rule) => rule.style.fontWeight === "300" && rule.style.fontStyle === "normal"
  );
  expect(light.style.getPropertyValue("src")).to.include("Lato-Light.woff2");

  for (const rule of rules) {
    expect(rule.style.getPropertyValue("src")).not.to.include("local(");
    const faces = await document.fonts.load(
      `${rule.style.fontStyle} ${rule.style.fontWeight} 24px Lato`,
      "Afterglow"
    );
    // A system-font fallback returns no FontFace; a missing asset rejects load().
    expect(faces).to.have.length(1);
    expect(faces[0].status).to.equal("loaded");
    expect(faces[0].weight).to.equal(rule.style.fontWeight);
    expect(faces[0].style).to.equal(rule.style.fontStyle);
  }
});
