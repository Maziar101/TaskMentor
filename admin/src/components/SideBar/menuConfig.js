import { FiGrid, FiUsers } from "react-icons/fi";
import { translate } from "../../i18n/runtime";

export const MENU_CONFIG = [
  { label: translate("داشبورد"), to: "/dashboard", icon: FiGrid },
  { label: translate("لیست کاربران"), to: "/users", icon: FiUsers },
];
