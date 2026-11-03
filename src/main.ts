// Styles are a separate entry point; importing helpers never registers elements.
export { getMotionOptions } from "./behaviors/motion";
export type { MotionSpeed, MotionPhase } from "./behaviors/motion";
export { enhanceBreadcrumb } from "./behaviors/breadcrumb";
export type { BreadcrumbController } from "./behaviors/breadcrumb";
export { enhanceSlider } from "./behaviors/slider";
export { enhanceCircularProgress } from "./behaviors/circular-progress";
export { enhanceStagedProgress } from "./behaviors/staged-progress";
export type { StagedProgressController } from "./behaviors/staged-progress";
export type {
  CircularProgressController,
  CircularProgressOptions,
  CircularProgressState,
} from "./behaviors/circular-progress";
export type { SliderController, SliderOptions } from "./behaviors/slider";
export { enhanceDialog } from "./behaviors/dialog";
export type { DialogController, DialogOptions } from "./behaviors/dialog";
export { enhanceControls } from "./behaviors/controls";
export { enhanceTextField } from "./behaviors/text-field";
export type { TextFieldController, TextFieldOptions } from "./behaviors/text-field";
export type { ControlsController } from "./behaviors/controls";
export { enhanceNotification } from "./behaviors/notification";
export type {
  NotificationController,
  NotificationOptions,
  NotificationPosition,
  NotificationCloseReason,
} from "./behaviors/notification";
export { enhanceAvatar, getAvatarInitials } from "./behaviors/avatar";
export type { AvatarController, AvatarOptions } from "./behaviors/avatar";
export { enhanceImage } from "./behaviors/image";
export type { ImageController, ImageOptions } from "./behaviors/image";
export { enhanceTabbedView } from "./behaviors/tabbed-view";
export type {
  TabbedViewController,
  TabbedViewOptions,
} from "./behaviors/tabbed-view";
export { enhancePopupMenu } from "./behaviors/popup-menu";
export type { PopupMenuController, PopupMenuOptions } from "./behaviors/popup-menu";
export { enhanceTokenField } from "./behaviors/token-field";
export type { TokenFieldController, TokenFieldOptions, TokenFieldItem } from "./behaviors/token-field";
