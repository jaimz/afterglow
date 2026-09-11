import { enhanceNotification, type NotificationPosition } from "../../main";
import { element, track } from "../../stories/fixtures";
import {
  notificationMarkup,
  notificationMessages,
  type NotificationVariant,
} from "./fixtures/createNotification";

const positions: NotificationPosition[] = [
  "top-left",
  "top-center",
  "top-right",
  "bottom-left",
  "bottom-center",
  "bottom-right",
];
export default {
  title: "Indicate/Notification",
  args: {
    variant: "default",
    position: "top-right",
    timeout: 0,
    message: "You have a new message…",
  },
  argTypes: {
    variant: { control: "select", options: Object.keys(notificationMessages) },
    position: { control: "select", options: positions },
    timeout: {
      control: { type: "number", min: 0, step: 1000 },
      description:
        "Milliseconds after entry; zero keeps the notification open.",
    },
    message: { control: "text" },
  },
};

export const Default = ({
  variant,
  position,
  timeout,
  message,
}: {
  variant: NotificationVariant;
  position: NotificationPosition;
  timeout: number;
  message: string;
}) => {
  const root = element(`<section class="ag-body" style="padding:24px">
    <p>Choose a variant, position and timeout in Controls. A timeout of zero requires dismissal.</p>
    <button class="ag-button" type="button" data-variant="primary">Show notification</button>
    <p><output>Ready</output></p>
    ${notificationMarkup("example-notification", variant, message)}
  </section>`);
  const toast = root.querySelector<HTMLElement>(".ag-notification")!;
  const controller = track(enhanceNotification(toast, { position, timeout }));
  root.querySelector("button")!.onclick = () => void controller.show();
  toast.addEventListener("close", (event) => {
    root.querySelector("output")!.textContent = `Closed: ${
      (event as CustomEvent).detail.reason
    }`;
  });
  return root;
};

export const Variants = () => {
  const root =
    element(`<section class="ag-body" style="display:grid;gap:16px;padding:20px;width:max-content;max-width:100%">
    ${Object.keys(notificationMessages)
      .map((variant) =>
        notificationMarkup(
          `variant-${variant}`,
          variant as NotificationVariant,
          undefined,
          false
        )
      )
      .join("")}
  </section>`);
  root.querySelectorAll<HTMLButtonElement>("button").forEach((button) => {
    button.onclick = () => button.closest(".ag-notification")!.remove();
  });
  return root;
};
Variants.parameters = { controls: { disable: true } };

export const PositionsInAView = () => {
  const root = element(`<section class="ag-body" style="padding:24px">
    <p>Each notification is positioned within the outlined view. It stays open until dismissed.</p>
    <div class="ag-panel" style="position:relative;box-sizing:border-box;width:100%;height:560px;min-height:320px;padding:24px;outline:1px dashed var(--onPanelAlt);resize:both;overflow:auto">
      <div style="display:flex;flex-wrap:wrap;gap:12px;justify-content:center;padding-top:220px">
        ${positions
          .map(
            (position) =>
              `<button class="ag-button" type="button" data-position="${position}">${position}</button>`
          )
          .join("")}
      </div>
      ${positions
        .map((position) =>
          notificationMarkup(`position-${position}`, "default", position)
        )
        .join("")}
    </div>
  </section>`);
  const container = root.querySelector<HTMLElement>(".ag-panel")!;
  positions.forEach((position) => {
    const toast = root.querySelector<HTMLElement>(`#position-${position}`)!;
    const controller = track(
      enhanceNotification(toast, { position, container })
    );
    root.querySelector<HTMLButtonElement>(
      `button[data-position="${position}"]`
    )!.onclick = () => void controller.show();
  });
  return root;
};
PositionsInAView.parameters = { controls: { disable: true } };

export const TimedAndStacked = () => {
  const root = element(`<section class="ag-body" style="padding:24px">
    <p>Notifications stack at the bottom right and close after five seconds. Hover or focus pauses the timer.</p>
    <button class="ag-button" type="button" data-variant="primary">Add notification</button>
  </section>`);
  let count = 0;
  root.querySelector("button")!.onclick = () => {
    const toast = element(
      notificationMarkup(`timed-${++count}`, "success", `Saved change ${count}`)
    );
    root.append(toast);
    const controller = track(
      enhanceNotification(toast, { position: "bottom-right", timeout: 5000 })
    );
    toast.addEventListener(
      "close",
      () => {
        controller.destroy();
        toast.remove();
      },
      { once: true }
    );
    void controller.show();
  };
  return root;
};
TimedAndStacked.parameters = { controls: { disable: true } };

const declarativeMarkup = `<section class="ag-body" style="padding:24px">
  <p>This example uses native popover buttons without an Afterglow helper.</p>
  <button class="ag-button" type="button" popovertarget="native-notification" popovertargetaction="show">Show notification</button>
  ${notificationMarkup("native-notification")}
</section>`;
export const HTMLOnly = () => element(declarativeMarkup);
HTMLOnly.parameters = {
  controls: { disable: true },
  docs: { source: { code: declarativeMarkup } },
};
