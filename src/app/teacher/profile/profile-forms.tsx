"use client";

import {
  startTransition,
  useActionState,
  useEffect,
  useRef,
  useState,
} from "react";

import { MAX_UPLOAD_BYTES, toPhotoDataUrl } from "~/app/_components/photo";
import { Avatar } from "~/app/_components/ui";
import {
  MAX_PHOTO_LENGTH,
  SUBJECT_SUGGESTIONS,
  TEACHER_TITLES,
} from "~/app/register/registration";
import { changeEmail, updateProfile, type SaveState } from "../actions";

const FIELD =
  "border-line bg-surface text-ink placeholder:text-muted/70 focus:border-brand focus:ring-brand/10 w-full rounded-lg border px-3 py-2.5 text-sm transition outline-none focus:ring-4";
const LABEL = "text-ink mb-1.5 block text-xs font-bold";

/**
 * Submits by hand rather than through `action`, which would reset the fields
 * after a rejected save and make the teacher retype them.
 */
const submitWith =
  (action: (data: FormData) => void) =>
  (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    startTransition(() => action(data));
  };

function Status({ state }: { state: SaveState }) {
  if (!state) return null;
  return "error" in state ? (
    <p
      role="alert"
      className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700"
    >
      {state.error}
    </p>
  ) : (
    <p
      role="status"
      className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700"
    >
      {state.saved}
    </p>
  );
}

export function ProfileForm({
  initial,
}: {
  initial: {
    title: string;
    name: string;
    subject: string;
    phone: string;
    officeLocation: string;
    bio: string;
    photo: string | null;
  };
}) {
  const [state, action, pending] = useActionState<SaveState, FormData>(
    updateProfile,
    null,
  );
  const [photo, setPhoto] = useState(initial.photo);
  const [photoChanged, setPhotoChanged] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

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
      const dataUrl = await toPhotoDataUrl(file);
      if (dataUrl.length > MAX_PHOTO_LENGTH) throw new Error("Too large.");
      setPhoto(dataUrl);
      setPhotoChanged(true);
    } catch {
      setPhotoError("That image couldn't be read. Try a JPEG or PNG.");
    }
  };

  return (
    <form onSubmit={submitWith(action)} className="space-y-5 p-5">
      <input
        type="hidden"
        name="photo"
        value={photoChanged ? (photo ?? "") : "keep"}
      />

      <div className="flex flex-wrap items-center gap-4">
        <Avatar name={initial.name || "?"} src={photo} size="xl" />
        <div>
          <p className="text-ink text-sm font-semibold">Profile photo</p>
          <div className="mt-2 flex items-center gap-2">
            <label className="border-line bg-surface text-ink hover:bg-canvas focus-within:ring-brand/12 cursor-pointer rounded-lg border px-3 py-2 text-xs font-semibold transition focus-within:ring-4">
              {photo ? "Change photo" : "Upload photo"}
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={pickPhoto}
              />
            </label>
            {photo && (
              <button
                type="button"
                onClick={() => {
                  setPhoto(null);
                  setPhotoChanged(true);
                }}
                className="rounded-lg px-3 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
              >
                Remove
              </button>
            )}
          </div>
          <p
            className={`mt-1.5 text-xs ${photoError ? "font-medium text-rose-700" : "text-muted"}`}
          >
            {photoError ?? "A square crop of your photo is used."}
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-[140px_minmax(0,1fr)]">
        <div>
          <label htmlFor="profile-title" className={LABEL}>
            Title
          </label>
          <select
            id="profile-title"
            name="title"
            defaultValue={initial.title}
            className={FIELD}
          >
            <option value="">None</option>
            {TEACHER_TITLES.map((title) => (
              <option key={title} value={title}>
                {title}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="profile-name" className={LABEL}>
            Full name
          </label>
          <input
            id="profile-name"
            name="name"
            required
            autoComplete="name"
            defaultValue={initial.name}
            className={FIELD}
          />
        </div>
      </div>

      <div>
        <label htmlFor="profile-subject" className={LABEL}>
          Subject <span className="text-muted font-medium">(optional)</span>
        </label>
        <input
          id="profile-subject"
          name="subject"
          list="profile-subjects"
          placeholder="Biology"
          defaultValue={initial.subject}
          className={FIELD}
        />
        <datalist id="profile-subjects">
          {SUBJECT_SUGGESTIONS.map((subject) => (
            <option key={subject} value={subject} />
          ))}
        </datalist>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="profile-phone" className={LABEL}>
            Phone <span className="text-muted font-medium">(optional)</span>
          </label>
          <input
            id="profile-phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            defaultValue={initial.phone}
            className={FIELD}
          />
        </div>
        <div>
          <label htmlFor="profile-office" className={LABEL}>
            Office / room <span className="text-muted font-medium">(optional)</span>
          </label>
          <input
            id="profile-office"
            name="officeLocation"
            placeholder="Lab Room 304"
            defaultValue={initial.officeLocation}
            className={FIELD}
          />
        </div>
      </div>

      <div>
        <label htmlFor="profile-bio" className={LABEL}>
          Bio <span className="text-muted font-medium">(optional)</span>
        </label>
        <textarea
          id="profile-bio"
          name="bio"
          rows={4}
          maxLength={500}
          defaultValue={initial.bio}
          className={FIELD}
        />
      </div>

      <Status state={state} />

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="bg-navy hover:bg-navy-deep rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save profile"}
        </button>
      </div>
    </form>
  );
}

export function EmailForm({ currentEmail }: { currentEmail: string }) {
  const [state, action, pending] = useActionState<SaveState, FormData>(
    changeEmail,
    null,
  );
  const form = useRef<HTMLFormElement>(null);

  // Clear the password once the change has gone through.
  useEffect(() => {
    if (state && "saved" in state) form.current?.reset();
  }, [state]);

  return (
    <form ref={form} onSubmit={submitWith(action)} className="space-y-4 p-5">
      <div>
        <p className="text-muted text-xs">Current sign-in email</p>
        <p className="text-ink mt-0.5 truncate text-sm font-bold">
          {currentEmail || "—"}
        </p>
      </div>
      <div>
        <label htmlFor="credentials-email" className={LABEL}>
          New email
        </label>
        <input
          id="credentials-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@yourschool.edu"
          className={FIELD}
        />
      </div>
      <div>
        <label htmlFor="credentials-password" className={LABEL}>
          Current password
        </label>
        <input
          id="credentials-password"
          name="currentPassword"
          type="password"
          required
          autoComplete="current-password"
          className={FIELD}
        />
      </div>

      <Status state={state} />

      <button
        type="submit"
        disabled={pending}
        className="bg-brand hover:bg-brand/90 w-full rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition disabled:opacity-60"
      >
        {pending ? "Updating…" : "Update email"}
      </button>
    </form>
  );
}
