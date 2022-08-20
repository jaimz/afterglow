import {
  FASTElement,
  customElement,
  attr,
  html,
} from "@microsoft/fast-element";

const template = html<AppFrame>`<body></body> `;

@customElement({ name: "ag-appframe", template })
export class AppFrame extends FASTElement {
  @attr pageTitle?: string;
}
