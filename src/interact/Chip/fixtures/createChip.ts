import { enhanceAvatar } from "../../../main";
import { element, escapeHTML, track } from "../../../stories/fixtures";

export type ChipVariant =
  | "default"
  | "outlined"
  | "avatar"
  | "avatar-outlined"
  | "backdrop";

export interface ChipArgs {
  label?: string;
  variant?: ChipVariant;
  icon?: string;
  withIcon?: boolean;
  avatarVariant?: "image" | "initials" | "flat-initials" | "blank";
  name?: string;
  imageUrl?: string;
  removable?: boolean;
  isDisabled?: boolean;
  removeLabel?: string;
  onRemove?: (chip: HTMLElement) => void;
}

// Storybook-only markup builder. Consumers use the native HTML recipe.
export function chipMarkup({
  label = "Portland",
  variant = "default",
  icon,
  withIcon = true,
  avatarVariant = "image",
  name = "Sandra Adams",
  imageUrl = "",
  removable = true,
  isDisabled = false,
  removeLabel = `Remove ${label}`,
}: ChipArgs = {}) {
  const avatar = variant === "avatar" || variant === "avatar-outlined";
  const iconName = icon?.trim() ?? "";
  return `<span class="ag-chip" data-variant="${variant}">
    ${
      avatar
        ? `<span class="ag-avatar" data-shape="circle" data-variant="${avatarVariant}" data-name="${escapeHTML(
            name
          )}" aria-hidden="true">${
            avatarVariant === "image" && imageUrl
              ? `<img class="ag-avatar__image" src="${escapeHTML(
                  imageUrl
                )}" alt="">`
              : ""
          }</span>`
        : withIcon && iconName
        ? `<span class="ag-chip__icon ag-icon" data-icon="${escapeHTML(
            iconName
          )}" aria-hidden="true"></span>`
        : ""
    }
    <span class="ag-chip__label">${escapeHTML(label)}</span>
    ${
      removable
        ? `<button class="ag-chip__remove" type="button" aria-label="${escapeHTML(
            removeLabel
          )}" ${isDisabled ? "disabled" : ""}>
          <span class="ag-icon" data-icon="x-circle" aria-hidden="true"></span>
        </button>`
        : ""
    }
  </span>`;
}

export function createChip(args: ChipArgs = {}) {
  const root = element(chipMarkup(args));
  const avatar = root.querySelector<HTMLElement>(".ag-avatar");
  if (avatar) track(enhanceAvatar(avatar, { decorative: true }));
  root.querySelector("button")?.addEventListener("click", () => {
    args.onRemove?.(root);
  });
  return root;
}
