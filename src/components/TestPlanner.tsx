"use client";

import { useEffect, useMemo, useState } from "react";

type TestStatus = "todo" | "in-progress" | "done";
type TestPriority = "low" | "medium" | "high";

type TestCase = {
  id: string;
  title: string;
  description: string;
  status: TestStatus;
  category: string;
  priority: TestPriority;
  owner: string;
  createdAt: string;
};

type FilterOption = "all" | TestStatus;
type SortOption = "created-desc" | "created-asc" | "priority" | "status";

const STORAGE_KEY = "agentic-test-cases-v1";

const defaultTests: TestCase[] = [
  {
    id: "seed-1",
    title: "Signup form validation",
    description:
      "Verify required fields, email formatting, and password constraints produce accessible inline errors.",
    status: "in-progress",
    category: "Functional",
    priority: "high",
    owner: "QA Automation",
    createdAt: new Date().toISOString(),
  },
  {
    id: "seed-2",
    title: "Navigation keyboard support",
    description:
      "Ensure header navigation is reachable and operable with keyboard only and focus styles are visible.",
    status: "todo",
    category: "Accessibility",
    priority: "medium",
    owner: "UX QA",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: "seed-3",
    title: "Dashboard load test 500 users",
    description:
      "Simulate 500 concurrent users to confirm key metrics remain within SLO (<2s TTFB).",
    status: "todo",
    category: "Performance",
    priority: "high",
    owner: "Perf Squad",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
  },
  {
    id: "seed-4",
    title: "API contract regression",
    description:
      "Hit /api/reports and verify schema matches OpenAPI spec for required fields and error codes.",
    status: "done",
    category: "Integration",
    priority: "medium",
    owner: "Backend QA",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
  },
];

const statusLabels: Record<TestStatus, string> = {
  todo: "Backlog",
  "in-progress": "Running",
  done: "Completed",
};

const statusColors: Record<TestStatus, string> = {
  todo: "bg-slate-200 text-slate-700 border-slate-300",
  "in-progress": "bg-amber-200 text-amber-900 border-amber-300",
  done: "bg-emerald-200 text-emerald-900 border-emerald-300",
};

const priorityLabels: Record<TestPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

const priorityColors: Record<TestPriority, string> = {
  low: "text-slate-600 border-slate-300 bg-slate-100",
  medium: "text-indigo-700 border-indigo-300 bg-indigo-100",
  high: "text-rose-700 border-rose-300 bg-rose-100",
};

const ownerPalette = [
  "bg-sky-100 text-sky-700 border-sky-200",
  "bg-violet-100 text-violet-700 border-violet-200",
  "bg-emerald-100 text-emerald-700 border-emerald-200",
  "bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200",
];

const priorityOrder: Record<TestPriority, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

const statusOrder: Record<TestStatus, number> = {
  "in-progress": 0,
  todo: 1,
  done: 2,
};

const ownerColor = (owner: string) => {
  const normalized = owner.trim().toLowerCase();
  if (!normalized) return ownerPalette[0];
  let hash = 0;
  for (let i = 0; i < normalized.length; i += 1) {
    hash = (hash << 5) - hash + normalized.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % ownerPalette.length;
  return ownerPalette[index];
};

const generateId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `test-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const formatDate = (ISO: string) =>
  new Date(ISO).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });

const renderEmptyState = (filter: FilterOption) => (
  <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
    <h3 className="text-lg font-semibold text-slate-700">No test cases yet</h3>
    <p className="mt-2 text-sm text-slate-500">
      {filter === "all"
        ? "Add your first test to start building out coverage."
        : "Everything is filtered out. Try switching filters or add a new test."}
    </p>
  </div>
);

const NewTestForm = ({
  onCreate,
}: {
  onCreate: (payload: Omit<TestCase, "id" | "createdAt">) => void;
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Functional");
  const [priority, setPriority] = useState<TestPriority>("medium");
  const [status, setStatus] = useState<TestStatus>("todo");
  const [owner, setOwner] = useState("QA Engineer");

  const reset = () => {
    setTitle("");
    setDescription("");
    setCategory("Functional");
    setPriority("medium");
    setStatus("todo");
    setOwner("QA Engineer");
  };

  return (
    <form
      className="space-y-4 rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm backdrop-blur"
      onSubmit={(event) => {
        event.preventDefault();
        if (!title.trim()) return;
        onCreate({
          title: title.trim(),
          description: description.trim() || "No additional context provided.",
          category: category.trim() || "Functional",
          priority,
          status,
          owner: owner.trim() || "QA Engineer",
        });
        reset();
      }}
    >
      <div>
        <h2 className="text-lg font-semibold text-slate-800">
          Add a new test
        </h2>
        <p className="text-sm text-slate-500">
          Capture test ideas, regression scenarios, or exploratory notes.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-sm font-medium text-slate-600">
          Test title
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Payment flow happy path"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-800 shadow-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            required
          />
        </label>
        <label className="space-y-2 text-sm font-medium text-slate-600">
          Category
          <input
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            placeholder="Functional, Performance..."
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-800 shadow-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
          />
        </label>
      </div>

      <label className="space-y-2 text-sm font-medium text-slate-600">
        Description
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Include expected results, acceptance criteria, data sets…"
          rows={3}
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-800 shadow-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-2 text-sm font-medium text-slate-600">
          Priority
          <select
            value={priority}
            onChange={(event) => setPriority(event.target.value as TestPriority)}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-800 shadow-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
          >
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </label>
        <label className="space-y-2 text-sm font-medium text-slate-600">
          Owner
          <input
            value={owner}
            onChange={(event) => setOwner(event.target.value)}
            placeholder="Who is responsible?"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-800 shadow-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
          />
        </label>
      </div>

      <label className="space-y-2 text-sm font-medium text-slate-600">
        Workflow state
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value as TestStatus)}
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-800 shadow-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
        >
          <option value="todo">Backlog</option>
          <option value="in-progress">Running</option>
          <option value="done">Completed</option>
        </select>
      </label>

      <button
        type="submit"
        className="w-full rounded-xl bg-slate-900 px-4 py-2 text-center text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
      >
        Save test case
      </button>
    </form>
  );
};

const TestCard = ({
  test,
  onStatusChange,
  onDelete,
}: {
  test: TestCase;
  onStatusChange: (status: TestStatus) => void;
  onDelete: () => void;
}) => {
  const ownerStyle = ownerColor(test.owner);

  return (
    <article className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white/95 p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg">
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg font-semibold text-slate-900">
            {test.title}
          </h3>
          <span
            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${statusColors[test.status]}`}
          >
            {statusLabels[test.status]}
          </span>
        </div>
        <p className="text-sm leading-relaxed text-slate-600">
          {test.description}
        </p>
        <dl className="grid grid-cols-2 gap-3 text-xs text-slate-500">
          <div className="space-y-1">
            <dt className="font-semibold uppercase tracking-wide text-slate-400">
              Category
            </dt>
            <dd className="text-slate-600">{test.category}</dd>
          </div>
          <div className="space-y-1">
            <dt className="font-semibold uppercase tracking-wide text-slate-400">
              Created
            </dt>
            <dd className="text-slate-600">{formatDate(test.createdAt)}</dd>
          </div>
          <div className="space-y-1">
            <dt className="font-semibold uppercase tracking-wide text-slate-400">
              Priority
            </dt>
            <dd>
              <span
                className={`inline-flex items-center rounded-full border px-2 py-1 font-semibold ${priorityColors[test.priority]}`}
              >
                {priorityLabels[test.priority]}
              </span>
            </dd>
          </div>
          <div className="space-y-1">
            <dt className="font-semibold uppercase tracking-wide text-slate-400">
              Owner
            </dt>
            <dd>
              <span
                className={`inline-flex items-center rounded-full border px-2 py-1 font-semibold ${ownerStyle}`}
              >
                {test.owner}
              </span>
            </dd>
          </div>
        </dl>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Update status
          <select
            value={test.status}
            onChange={(event) => onStatusChange(event.target.value as TestStatus)}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 shadow-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
          >
            <option value="todo">Backlog</option>
            <option value="in-progress">Running</option>
            <option value="done">Completed</option>
          </select>
        </label>
        <button
          type="button"
          onClick={onDelete}
          className="inline-flex items-center gap-1 rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600 transition hover:border-rose-300 hover:bg-rose-50"
        >
          Remove
        </button>
      </div>
    </article>
  );
};

const BoardFilters = ({
  filter,
  onFilter,
  sort,
  onSort,
}: {
  filter: FilterOption;
  onFilter: (next: FilterOption) => void;
  sort: SortOption;
  onSort: (next: SortOption) => void;
}) => {
  const filters: { value: FilterOption; label: string }[] = [
    { value: "all", label: "All tests" },
    { value: "todo", label: "Backlog" },
    { value: "in-progress", label: "In progress" },
    { value: "done", label: "Completed" },
  ];

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap gap-2">
        {filters.map(({ value, label }) => (
          <button
            type="button"
            key={value}
            onClick={() => onFilter(value)}
            className={`inline-flex items-center rounded-full border px-4 py-1.5 text-sm font-semibold transition ${
              filter === value
                ? "border-slate-900 bg-slate-900 text-white shadow-md shadow-slate-900/20"
                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <label className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
        Sort by
        <select
          value={sort}
          onChange={(event) => onSort(event.target.value as SortOption)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 shadow-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
        >
          <option value="created-desc">Newest first</option>
          <option value="created-asc">Oldest first</option>
          <option value="priority">Priority</option>
          <option value="status">Status</option>
        </select>
      </label>
    </div>
  );
};

const StatsSummary = ({ tests }: { tests: TestCase[] }) => {
  const total = tests.length;
  const [todo, inProgress, done] = [
    tests.filter((test) => test.status === "todo").length,
    tests.filter((test) => test.status === "in-progress").length,
    tests.filter((test) => test.status === "done").length,
  ];

  const completion = total === 0 ? 0 : Math.round((done / total) * 100);

  const summaryCards = [
    {
      title: "Total tests",
      value: total,
      accent: "bg-slate-900 text-white",
      detail: `${inProgress + todo} still underway`,
    },
    {
      title: "Running",
      value: inProgress,
      accent: "bg-amber-500/10 text-amber-700",
      detail: `${((inProgress / (total || 1)) * 100).toFixed(0)}% of workload`,
    },
    {
      title: "Completed",
      value: done,
      accent: "bg-emerald-500/10 text-emerald-700",
      detail: `${completion}% coverage`,
    },
  ];

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">
          Quality readiness snapshot
        </h2>
        <p className="text-sm text-slate-500">
          Track testing throughput and celebrate completed work.
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {summaryCards.map((card) => (
          <div
            key={card.title}
            className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm backdrop-blur"
          >
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              {card.title}
            </h3>
            <div className={`mt-3 inline-flex rounded-full px-3 py-1 text-sm font-semibold ${card.accent}`}>
              {card.detail}
            </div>
            <p className="mt-4 text-4xl font-semibold text-slate-900">
              {card.value}
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 text-white shadow-lg">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-300">
              Completion
            </p>
            <p className="text-4xl font-semibold">{completion}%</p>
          </div>
          <div className="h-20 w-full rounded-xl bg-white/10 p-2 sm:w-2/3">
            <div className="h-full rounded-lg bg-gradient-to-r from-emerald-400 via-sky-400 to-blue-500" style={{ width: `${completion}%` }} />
          </div>
        </div>
      </div>
    </section>
  );
};

const sortTests = (tests: TestCase[], sort: SortOption) => {
  const sorted = [...tests];
  if (sort === "created-asc") {
    sorted.sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
  } else if (sort === "created-desc") {
    sorted.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  } else if (sort === "priority") {
    sorted.sort(
      (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority],
    );
  } else if (sort === "status") {
    sorted.sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);
  }
  return sorted;
};

export const TestPlanner = () => {
  const [tests, setTests] = useState<TestCase[]>(() => {
    if (typeof window === "undefined") return defaultTests;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultTests;
      const parsed = JSON.parse(raw) as TestCase[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((test) => ({
          ...test,
          createdAt: test.createdAt ?? new Date().toISOString(),
        }));
      }
    } catch (error) {
      console.error("Failed to parse saved tests", error);
    }
    return defaultTests;
  });
  const [filter, setFilter] = useState<FilterOption>("all");
  const [sort, setSort] = useState<SortOption>("created-desc");

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tests));
    } catch (error) {
      console.error("Failed to persist tests", error);
    }
  }, [tests]);

  const filtered = useMemo(() => {
    const base =
      filter === "all"
        ? tests
        : tests.filter((test) => test.status === filter);
    return sortTests(base, sort);
  }, [tests, filter, sort]);

  const handleCreate = (
    payload: Omit<TestCase, "id" | "createdAt">,
  ) => {
    setTests((previous) => [
      {
        ...payload,
        id: generateId(),
        createdAt: new Date().toISOString(),
      },
      ...previous,
    ]);
  };

  const handleStatusChange = (id: string, status: TestStatus) => {
    setTests((previous) =>
      previous.map((test) =>
        test.id === id
          ? {
              ...test,
              status,
            }
          : test,
      ),
    );
  };

  const handleDelete = (id: string) => {
    setTests((previous) => previous.filter((test) => test.id !== id));
  };

  return (
    <div className="flex flex-col gap-12">
      <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(320px,380px)]">
        <div className="space-y-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">
              Testing workspace
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-900">
              Plan, track, and celebrate your test coverage
            </h1>
            <p className="mt-4 text-base leading-relaxed text-slate-600">
              Capture regression scenarios, exploratory sessions, and automation
              ideas in one collaborative board. Keep stakeholders aligned on
              quality readiness across every release.
            </p>
          </div>
          <StatsSummary tests={tests} />
        </div>
        <NewTestForm onCreate={handleCreate} />
      </section>

      <section className="space-y-6">
        <div className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold text-slate-900">
            Test queue
          </h2>
          <BoardFilters
            filter={filter}
            onFilter={setFilter}
            sort={sort}
            onSort={setSort}
          />
        </div>
        {filtered.length === 0 ? (
          renderEmptyState(filter)
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((test) => (
              <TestCard
                key={test.id}
                test={test}
                onStatusChange={(status) => handleStatusChange(test.id, status)}
                onDelete={() => handleDelete(test.id)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default TestPlanner;
