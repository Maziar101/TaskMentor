import type { FormEvent } from "react";
import Calender from "../../../components/Calender/index";
import PriorityDropdown from "../../../components/PriorityDropdown/index";
import { PRIORITY_LEVELS } from "../data/index";
import type { ProjectFormState } from "../useProjects/index";

type ProjectCreateTileProps = {
  open: boolean;
  form: ProjectFormState;
  onOpen: () => void;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onFieldChange: <K extends keyof ProjectFormState>(
    key: K,
    value: ProjectFormState[K]
  ) => void;
};

export default function ProjectCreateTile({
  open,
  form,
  onOpen,
  onClose,
  onSubmit,
  onFieldChange,
}: ProjectCreateTileProps) {
  return (
    <article className="project-tile project-tile--new">
      <button
        className="project-tile__new-trigger"
        type="button"
        onClick={onOpen}
      >
        <span className="project-tile__new-icon">+</span>
        <span>پروژه جدید</span>
      </button>
      {open && (
        <form className="project-form" onSubmit={onSubmit}>
          <label>
            <span>عنوان پروژه</span>
            <input
              value={form.title}
              onChange={(event) => onFieldChange("title", event.target.value)}
              placeholder="مثلا: لانچ نسخه جدید پرداخت"
            />
          </label>
          <label>
            <span>توضیح</span>
            <textarea
              value={form.description}
              onChange={(event) => onFieldChange("description", event.target.value)}
              placeholder="چرا این پروژه مهم است؟"
            />
          </label>
          <div className="project-form__row">
            <div className="project-form__field">
              <span>اولویت</span>
              <div className="priority-picker">
                <PriorityDropdown
                  value={form.priority}
                  options={PRIORITY_LEVELS}
                  onChange={(value) => onFieldChange("priority", value)}
                  closeOnOutsideClick={false}
                />
              </div>
            </div>
            <label>
              <span>ددلاین پروژه</span>
              <Calender
                value={form.due}
                onChange={(value) => onFieldChange("due", value)}
                place="مثلا 1402-12-01"
              />
            </label>
          </div>
          <div className="project-form__actions">
            <button className="ghost" type="button" onClick={onClose}>
              انصراف
            </button>
            <button className="primary" type="submit">
              ساخت پروژه
            </button>
          </div>
        </form>
      )}
    </article>
  );
}
