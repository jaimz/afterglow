import { agButton } from "./interact/Button";
import { agDialog } from "./frame/Dialog";
import { agCheckbox } from "./interact/Checkbox";
import { agRadio } from "./interact/Radio";
import { agRadioGroup } from "./interact/RadioGroup";
import { agSwitch } from "./interact/Switch";
import { agSlider } from "./interact/Slider";
import { agSliderLabel } from "./interact/Slider/slider-label";
import { agBackground } from "./frame/Background";
import { agSurface } from "./frame/Surface";
import { agPanel } from "./frame/Panel";
import { agPaper } from "./frame/Paper";
import { agAppFrame } from "./frame/AppFrame";

export {
  agButton,
  agDialog,
  agCheckbox,
  agRadio,
  agRadioGroup,
  agSwitch,
  agSlider,
  agSliderLabel,
  agBackground,
  agSurface,
  agPanel,
  agPaper,
  agAppFrame,
};

const registrations = [
  agButton,
  agDialog,
  agCheckbox,
  agRadio,
  agRadioGroup,
  agSwitch,
  agSlider,
  agSliderLabel,
  agBackground,
  agSurface,
  agPanel,
  agPaper,
  agAppFrame,
];
export function registerAfterglow(): void {
  registrations.forEach((register) => register());
}
export const allComponents = { register: registerAfterglow };
