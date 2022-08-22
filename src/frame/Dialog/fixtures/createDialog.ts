import { AGDialog, ContentAnchor, ContentStretch } from "../index";

export type DialogArgs = {
  anchor: ContentAnchor;
  stretch: ContentStretch;
  hidden: boolean;
};

export function createDialog({ anchor, stretch, hidden }: DialogArgs) {
  const dialog = new AGDialog();

  if (hidden) dialog.setAttribute("hidden", "true");
  dialog.setAttribute("anchor", anchor);
  dialog.setAttribute("stretch", stretch);
  dialog.setAttribute("id", "agdialog");

  return dialog;
}
