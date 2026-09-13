"use client";

import { useEffect, useId, useState } from "react";

import {
  ArrowRightIcon,
  CheckIcon,
  PlusCircleIcon,
  SearchIcon,
} from "~/app/_components/icons";
import { api } from "~/trpc/react";
import { type OrganizationChoice } from "../registration";
import { INPUT, LABEL, PRIMARY } from "./styles";

/** The latest value once it has stopped changing for `delay` ms. */
function useDebounced<T>(value: T, delay = 250): T {
  const [settled, setSettled] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setSettled(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return settled;
}

/**
 * Step 1: search the schools already on Smart Momo and pick one, or add a new
 * one. A new school is only written when the account is created.
 */
export function SchoolStep({
  value,
  onChange,
  onNext,
}: {
  value: OrganizationChoice | null;
  onChange: (value: OrganizationChoice | null) => void;
  onNext: () => void;
}) {
  const [query, setQuery] = useState(
    value?.kind === "existing" ? value.name : "",
  );
  const [adding, setAdding] = useState(value?.kind === "new");
  const id = useId();

  const search = useDebounced(query.trim());
  const searchable = search.length >= 2;
  const results = api.organization.search.useQuery(
    { query: search },
    { enabled: searchable, placeholderData: (previous) => previous },
  );
  const schools = searchable ? (results.data ?? []) : [];
  const noMatches = searchable && results.isSuccess && schools.length === 0;

  const startAdding = () => {
    setAdding(true);
    onChange({ kind: "new", name: query.trim(), city: "" });
  };

  const newSchool = value?.kind === "new" ? value : null;
  const ready =
    value?.kind === "existing" ||
    (newSchool !== null && newSchool.name.trim().length >= 3);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (ready) onNext();
      }}
      className="space-y-5"
    >
      <div>
        <label htmlFor={`${id}-search`} className={LABEL}>
          Search for your school or organization
        </label>
        <div className="relative">
          <SearchIcon className="text-muted pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2" />
          <input
            id={`${id}-search`}
            type="search"
            autoComplete="off"
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="e.g. Oakridge High School"
            className={`${INPUT} pl-10`}
          />
        </div>
        {!searchable && (
          <p className="text-muted mt-1.5 text-xs">
            Type at least 2 letters to search.
          </p>
        )}
      </div>

      {searchable && (
        <div aria-live="polite">
          {results.isLoading ? (
            <p className="text-muted text-sm">Searching…</p>
          ) : noMatches ? (
            <div className="border-line bg-surface rounded-2xl border border-dashed p-5 text-center">
              <p className="text-ink text-sm font-semibold">
                No school named “{search}” yet.
              </p>
              <p className="text-muted mt-1 text-sm">
                Add it below and you&apos;ll be its first teacher.
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {schools.map((school) => {
                const selected =
                  value?.kind === "existing" && value.id === school.id;
                return (
                  <li key={school.id}>
                    <button
                      type="button"
                      aria-pressed={selected}
                      onClick={() => {
                        setAdding(false);
                        onChange({
                          kind: "existing",
                          id: school.id,
                          name: school.name,
                          city: school.city,
                        });
                      }}
                      className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition ${
                        selected
                          ? "border-brand bg-brand-soft ring-brand/12 ring-4"
                          : "border-line bg-surface hover:border-brand/40"
                      }`}
                    >
                      <span className="min-w-0 flex-1">
                        <span className="text-ink block truncate font-semibold">
                          {school.name}
                        </span>
                        <span className="text-muted block truncate text-xs">
                          {[
                            school.city,
                            `${school.teacherCount} teacher${school.teacherCount === 1 ? "" : "s"}`,
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </span>
                      </span>
                      <span
                        className={`flex size-6 shrink-0 items-center justify-center rounded-full ${
                          selected
                            ? "bg-brand text-white"
                            : "border-line border"
                        }`}
                      >
                        {selected && <CheckIcon className="size-3.5" />}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {/* Add a school that isn't listed */}
      {adding && newSchool ? (
        <fieldset className="border-brand/40 bg-surface space-y-4 rounded-2xl border p-5">
          <legend className="text-ink px-1 text-sm font-bold">
            Add your school or organization
          </legend>
          <div>
            <label htmlFor={`${id}-name`} className={LABEL}>
              School or organization name
            </label>
            <input
              id={`${id}-name`}
              autoComplete="organization"
              required
              minLength={3}
              maxLength={160}
              value={newSchool.name}
              onChange={(event) =>
                onChange({ ...newSchool, name: event.target.value })
              }
              placeholder="Oakridge High School"
              className={INPUT}
            />
          </div>
          <div>
            <label htmlFor={`${id}-city`} className={LABEL}>
              City or municipality{" "}
              <span className="text-muted font-normal">(optional)</span>
            </label>
            <input
              id={`${id}-city`}
              autoComplete="address-level2"
              maxLength={80}
              value={newSchool.city}
              onChange={(event) =>
                onChange({ ...newSchool, city: event.target.value })
              }
              placeholder="Helps colleagues tell schools with the same name apart"
              className={INPUT}
            />
          </div>
          <button
            type="button"
            onClick={() => {
              setAdding(false);
              onChange(null);
            }}
            className="text-muted hover:text-ink text-xs font-semibold"
          >
            Cancel — pick from the search instead
          </button>
        </fieldset>
      ) : (
        <button
          type="button"
          onClick={startAdding}
          className="text-brand inline-flex items-center gap-2 text-sm font-semibold hover:underline"
        >
          <PlusCircleIcon className="size-4" />
          {noMatches
            ? `Add “${search}” as a new school`
            : "Can't find it? Add your school or organization"}
        </button>
      )}

      <button type="submit" disabled={!ready} className={`${PRIMARY} w-full`}>
        Continue
        <ArrowRightIcon className="size-4 transition group-hover:translate-x-0.5" />
      </button>
    </form>
  );
}
