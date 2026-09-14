"use client";

import { useId, useState } from "react";

import { ArrowRightIcon } from "~/app/_components/icons";
import { Avatar } from "~/app/_components/ui";
import {
  MAX_PHOTO_LENGTH,
  SUBJECT_SUGGESTIONS,
  TEACHER_TITLES,
} from "../registration";
import { MAX_UPLOAD_BYTES, toPhotoDataUrl } from "~/app/_components/photo";
import { BACK, INPUT, LABEL, PRIMARY } from "./styles";

export type ProfileValues = {
  title: string;
  name: string;
  subject: string;
  phone: string;
  officeLocation: string;
  bio: string;
  photo: string;
};

/** Step 2: photo, name, subject and the optional details. */
export function ProfileStep({
  value,
  onChange,
  onBack,
  onNext,
}: {
  value: ProfileValues;
  onChange: (value: ProfileValues) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const [photoError, setPhotoError] = useState<string | null>(null);
  const id = useId();

  const bind = (name: Exclude<keyof ProfileValues, "photo">) => ({
    id: `${id}-${name}`,
    name,
    value: value[name],
    onChange: (
      event: React.ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >,
    ) => onChange({ ...value, [name]: event.target.value }),
  });

  const pickPhoto = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // Reset so choosing the same file again still fires a change.
    event.target.value = "";
    if (!file) return;

    setPhotoError(null);
    if (file.size > MAX_UPLOAD_BYTES) {
      setPhotoError("Choose an image under 10 MB.");
      return;
    }
    try {
      const photo = await toPhotoDataUrl(file);
      if (photo.length > MAX_PHOTO_LENGTH) throw new Error("Too large.");
      onChange({ ...value, photo });
    } catch {
      setPhotoError("That image couldn't be read. Try a JPEG or PNG.");
    }
  };

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onNext();
      }}
      className="space-y-5"
    >
      {/* Photo */}
      <div className="flex items-center gap-5">
        <Avatar name={value.name || "?"} src={value.photo} size="xl" />
        <div>
          <p className="text-ink text-sm font-semibold">Profile photo</p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <label className="border-line bg-surface text-ink hover:bg-canvas focus-within:ring-brand/12 cursor-pointer rounded-xl border px-4 py-2 text-sm font-semibold transition focus-within:ring-4">
              {value.photo ? "Change photo" : "Upload photo"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={pickPhoto}
                className="sr-only"
              />
            </label>
            {value.photo && (
              <button
                type="button"
                onClick={() => onChange({ ...value, photo: "" })}
                className="text-muted hover:text-ink text-sm font-semibold"
              >
                Remove
              </button>
            )}
          </div>
          <p
            className={`mt-1.5 text-xs ${photoError ? "font-medium text-rose-700" : "text-muted"}`}
          >
            {photoError ?? "Optional. A square crop of your photo is used."}
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-[7rem_minmax(0,1fr)]">
        <div>
          <label htmlFor={`${id}-title`} className={LABEL}>
            Title
          </label>
          <select {...bind("title")} className={INPUT}>
            <option value="">—</option>
            {TEACHER_TITLES.map((title) => (
              <option key={title} value={title}>
                {title}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={`${id}-name`} className={LABEL}>
            Full name
          </label>
          <input
            {...bind("name")}
            autoComplete="name"
            required
            minLength={2}
            maxLength={120}
            placeholder="Jordan Lee"
            className={INPUT}
          />
        </div>
      </div>

      <div>
        <label htmlFor={`${id}-subject`} className={LABEL}>
          Subject you teach
        </label>
        <input
          {...bind("subject")}
          list={`${id}-subjects`}
          required
          minLength={2}
          maxLength={80}
          placeholder="e.g. Biology"
          className={INPUT}
        />
        <datalist id={`${id}-subjects`}>
          {SUBJECT_SUGGESTIONS.map((subject) => (
            <option key={subject} value={subject} />
          ))}
        </datalist>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={`${id}-phone`} className={LABEL}>
            Phone <span className="text-muted font-normal">(optional)</span>
          </label>
          <input
            {...bind("phone")}
            type="tel"
            autoComplete="tel"
            maxLength={40}
            placeholder="+63 912 345 6789"
            className={INPUT}
          />
        </div>
        <div>
          <label htmlFor={`${id}-officeLocation`} className={LABEL}>
            Room or office{" "}
            <span className="text-muted font-normal">(optional)</span>
          </label>
          <input
            {...bind("officeLocation")}
            maxLength={80}
            placeholder="Science Lab 204"
            className={INPUT}
          />
        </div>
      </div>

      <div>
        <div className="mb-1.5 flex items-baseline justify-between">
          <label
            htmlFor={`${id}-bio`}
            className="text-ink text-sm font-semibold"
          >
            Short bio <span className="text-muted font-normal">(optional)</span>
          </label>
          <span className="text-muted text-xs">{value.bio.length}/500</span>
        </div>
        <textarea
          {...bind("bio")}
          rows={3}
          maxLength={500}
          placeholder="Grade levels you teach, years of experience, what your classes focus on…"
          className={`${INPUT} resize-y`}
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onBack} className={BACK}>
          Back
        </button>
        <button type="submit" className={PRIMARY}>
          Continue
          <ArrowRightIcon className="size-4 transition group-hover:translate-x-0.5" />
        </button>
      </div>
    </form>
  );
}
