import { escapeHTML } from "../../../stories/fixtures";

export const notificationMessages = {
  default: "You have a new message…",
  alert: "Could not connect to server",
  success: "Successfully did something",
  caution: "Something may go wrong.",
};
export type NotificationVariant = keyof typeof notificationMessages;

/** Story-only markup builder; consumers use the HTML recipe in Usage.md. */
export function notificationMarkup(
  id: string,
  variant: NotificationVariant = "default",
  message = notificationMessages[variant],
  popover = true
) {
  return `<div id="${escapeHTML(
    id
  )}" class="ag-notification" data-variant="${variant}" ${
    popover ? 'popover="manual"' : ""
  }>
    <span class="ag-notification__icon" aria-hidden="true"></span>
    <p class="ag-notification__message">${escapeHTML(message)}</p>
    <button class="ag-notification__close" type="button" aria-label="Dismiss notification" ${
      popover
        ? `popovertarget="${escapeHTML(id)}" popovertargetaction="hide"`
        : ""
    }></button>
  </div>`;
}
