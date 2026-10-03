"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/authContext";
import { landingPathForRole } from "@/lib/roles";
import { PLATFORM } from "@/lib/platformLinks";
import { buttonClassName, LinkButton } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Card";
import { Icon, type IconName } from "@/components/shell/icons";

const PILLARS: { icon: IconName; title: string; items: string[] }[] = [
  {
    icon: "lessons",
    title: "Teach",
    items: ["Organise lessons", "Open lesson material", "Highlight Qur'anic content", "Share exactly what you're teaching"],
  },
  {
    icon: "video",
    title: "Connect",
    items: ["Schedule online lessons", "Join Google Meet", "Keep students connected"],
  },
  {
    icon: "chart",
    title: "Track",
    items: ["Attendance", "Lesson history", "Student progress", "Teacher notes"],
  },
  {
    icon: "classes",
    title: "Manage",
    items: ["Students", "Classes", "Lesson materials", "Teaching schedule"],
  },
];

const FLOW = [
  { title: "Prepare", text: "Build a lesson from Qur'an material and your own notes." },
  { title: "Teach & share", text: "Open it on Google Meet and share exactly the verse you're explaining." },
  { title: "Record", text: "Mark attendance once — it shows up everywhere it should." },
  { title: "Follow up", text: "Save a short note and see each student's progress grow." },
];

const FAMILY: { icon: IconName; title: string; text: string; href: string; cta: string }[] = [
  {
    icon: "quran",
    title: "Quran Reader",
    text: "Read, listen and search the Quran — free, with no account needed.",
    href: PLATFORM.quran,
    cta: "Open Quran Reader",
  },
  {
    icon: "duas",
    title: "Duas",
    text: "Supplications and Athkar for every moment, by category.",
    href: PLATFORM.duas,
    cta: "Browse Duas",
  },
  {
    icon: "mic",
    title: "Mobile App",
    text: "Tajweed-coloured reading and listening on your Android phone.",
    href: PLATFORM.mobileApp,
    cta: "Get the app",
  },
];

export default function Home() {
  const { session, profile, loading } = useAuth();
  const router = useRouter();

  // Already logged in (e.g. reopening the app's link from Zoom, still
  // signed in from before) — skip the marketing page and go straight to
  // the dashboard instead of making the tutor click through again.
  useEffect(() => {
    if (!loading && session) router.replace(landingPathForRole(profile?.role));
  }, [loading, session, profile, router]);

  if (loading || session) {
    return <p className="p-8 text-sm text-muted">Loading…</p>;
  }

  return (
    <main id="main" className="flex-1">
      {/* Hero */}
      <section className="pattern-geo overflow-hidden px-5 pb-12 pt-8 sm:px-6 lg:px-8 lg:pb-[88px] lg:pt-[72px]">
        <div className="mx-auto grid max-w-[1200px] items-center gap-10 lg:grid-cols-[1.05fr_.95fr] lg:gap-16">
          <div>
            <Eyebrow>The Learning App</Eyebrow>
            <h1 className="mb-5 text-4xl leading-[1.12] tracking-[-0.02em] sm:text-5xl lg:text-[60px] lg:leading-[1.06]">
              A calm digital workspace for Qur&rsquo;an teachers.
            </h1>
            <p className="mb-8 max-w-[60ch] text-lg leading-relaxed text-ink-soft sm:text-xl">
              Organise your students and lessons, share exactly the verse you&rsquo;re explaining the instant
              you&rsquo;re explaining it, and keep every Google Meet, attendance record and progress note in one
              calm place — built around how you already teach.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <LinkButton href="/signup" size="lg">
                Get started <Icon name="arrow" className="h-[18px] w-[18px]" />
              </LinkButton>
              <LinkButton href="/login" variant="outline" size="lg">
                I already have an account
              </LinkButton>
            </div>
            <p className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-soft">
              <span className="inline-flex items-center gap-2">
                <Icon name="tick" className="h-4 w-4 text-primary" />
                Free, ad-free, always
              </span>
              <span className="inline-flex items-center gap-2">
                <Icon name="tick" className="h-4 w-4 text-primary" />
                Works on mobile
              </span>
            </p>
          </div>

          {/* Illustrative workspace preview, in the website's "product frame" style. */}
          <div
            role="img"
            aria-label="Illustrative preview of a lesson in the Learning App"
            className="overflow-hidden rounded-[var(--radius-l)] border border-line bg-surface shadow-[var(--shadow-l)]"
          >
            <div className="flex h-10 items-center gap-1.5 border-b border-line bg-surface-alt px-4">
              <i className="h-2.5 w-2.5 rounded-full bg-line-strong" />
              <i className="h-2.5 w-2.5 rounded-full bg-line-strong" />
              <i className="h-2.5 w-2.5 rounded-full bg-line-strong" />
              <span className="ml-3 rounded-full border border-line bg-surface px-3.5 py-1 text-xs font-medium text-ink-soft">
                iqraspace.org/learning
              </span>
            </div>
            <div className="bg-paper p-6 sm:p-8">
              <div className="mb-6 flex items-center justify-between border-b border-line pb-4 text-[13px] text-ink-soft">
                <b className="font-display text-lg font-medium text-heading">Surah Al-Fatihah · Lesson 3</b>
                <span className="flex gap-1.5">
                  <span className="rounded-full border border-primary bg-primary px-3 py-1.5 text-xs font-medium text-white">
                    Teach
                  </span>
                  <span className="rounded-full border border-line-strong bg-surface px-3 py-1.5 text-xs font-medium text-ink">
                    Notes
                  </span>
                </span>
              </div>
              <p lang="ar" dir="rtl" className="font-arabic my-4 text-center text-[34px] leading-[2.1] text-heading">
                بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
              </p>
              <div className="mx-auto my-2.5 h-2.5 max-w-[86%] rounded-md bg-primary-tint" />
              <div className="mx-auto my-2.5 h-2.5 max-w-[60%] rounded-md bg-primary-tint" />
              <div className="mt-6 flex items-center gap-3.5 rounded-full border border-line bg-surface px-3.5 py-2.5 text-sm text-ink-soft">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary text-white">
                  <Icon name="video" className="h-4 w-4" />
                </span>
                <span className="font-medium text-ink">Live on Google Meet · 4 students</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What it does */}
      <section className="border-y border-line bg-surface-alt px-5 py-14 sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-[1200px]">
          <div className="mb-8 max-w-[720px] lg:mb-12">
            <Eyebrow>What it does</Eyebrow>
            <h2 className="text-[29px] leading-[1.15] sm:text-[34px] lg:text-[40px]">Four calm ways to run your classroom</h2>
            <p className="max-w-[60ch] text-lg text-ink-soft">Everything a solo tutor needs, nothing they don&rsquo;t.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
            {PILLARS.map((p) => (
              <div
                key={p.title}
                className="flex flex-col rounded-[var(--radius-l)] border border-line bg-surface p-6 shadow-[var(--shadow-s)] transition-shadow hover:border-line-strong hover:shadow-[var(--shadow-m)] sm:p-8"
              >
                <span className="mb-5 grid h-[52px] w-[52px] place-items-center rounded-[var(--radius-m)] bg-primary-tint text-primary">
                  <Icon name={p.icon} className="h-[26px] w-[26px]" />
                </span>
                <h3 className="mb-2 text-[22px]">{p.title}</h3>
                <ul className="m-0 grid list-none gap-1.5 p-0 text-base text-ink-soft">
                  {p.items.map((i) => (
                    <li key={i} className="grid grid-cols-[20px_1fr] gap-2">
                      <Icon name="tick" className="mt-1 h-4 w-4 text-primary" />
                      {i}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The shape of a lesson */}
      <section className="px-5 py-14 sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-[1200px]">
          <div className="mb-8 max-w-[720px] lg:mb-12">
            <Eyebrow>The shape of a lesson</Eyebrow>
            <h2 className="text-[29px] leading-[1.15] sm:text-[34px] lg:text-[40px]">
              From &ldquo;good morning&rdquo; to a saved progress note
            </h2>
          </div>
          <ol className="m-0 grid list-none gap-0 p-0 lg:grid-cols-4 lg:gap-6">
            {FLOW.map((step, i) => (
              <li
                key={step.title}
                className="relative grid grid-cols-[44px_1fr] gap-x-5 pb-8 lg:block lg:pb-0 lg:pt-2"
              >
                <span className="relative z-[1] mb-0 grid h-11 w-11 place-items-center rounded-full bg-primary font-display text-lg text-white lg:mb-5">
                  {i + 1}
                </span>
                {i < FLOW.length - 1 && (
                  <span
                    aria-hidden="true"
                    className="absolute bottom-1 left-[21px] top-12 w-px bg-[repeating-linear-gradient(180deg,var(--color-line-strong)_0_6px,transparent_6px_12px)] lg:bottom-auto lg:left-14 lg:right-[-12px] lg:top-6 lg:h-px lg:w-auto lg:bg-[repeating-linear-gradient(90deg,var(--color-line-strong)_0_6px,transparent_6px_12px)]"
                  />
                )}
                <div>
                  <h3 className="mb-1 mt-2 text-xl lg:mt-0">{step.title}</h3>
                  <p className="m-0 text-[15px] text-ink-soft">{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* The rest of IqraSpace */}
      <section className="border-t border-line bg-surface-alt px-5 py-14 sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-[1200px]">
          <div className="mb-8 max-w-[720px] lg:mb-12">
            <Eyebrow>Part of IqraSpace</Eyebrow>
            <h2 className="text-[29px] leading-[1.15] sm:text-[34px] lg:text-[40px]">Keep going beyond the lesson</h2>
            <p className="max-w-[60ch] text-lg text-ink-soft">
              The same free, non-commercial platform — for you and your students between classes.
            </p>
          </div>
          <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
            {FAMILY.map((f) => (
              <a
                key={f.title}
                href={f.href}
                className="group flex flex-col rounded-[var(--radius-l)] border border-line bg-surface p-6 text-inherit no-underline shadow-[var(--shadow-s)] transition-shadow hover:border-line-strong hover:shadow-[var(--shadow-m)] sm:p-8"
              >
                <span className="mb-5 grid h-[52px] w-[52px] place-items-center rounded-[var(--radius-m)] bg-primary-tint text-primary">
                  <Icon name={f.icon} className="h-[26px] w-[26px]" />
                </span>
                <h3 className="mb-2 text-[22px]">{f.title}</h3>
                <p className="mb-0 text-base text-ink-soft">{f.text}</p>
                <span className="mt-auto inline-flex items-center gap-2 pt-4 text-[15px] font-semibold text-primary group-hover:underline">
                  {f.cta}
                  <Icon name="arrow" className="h-4 w-4 transition-transform group-hover:translate-x-[3px]" />
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* CTA band */}
      <section className="px-5 py-14 sm:px-6 lg:px-8 lg:py-24">
        <div className="on-dark pattern-geo mx-auto max-w-[1200px] overflow-hidden rounded-[var(--radius-l)] bg-[#163d32] px-6 py-10 text-left sm:px-12 sm:py-16 sm:text-center lg:rounded-[var(--radius-xl)]">
          <h2 className="mx-0 mb-4 max-w-[20ch] !text-white sm:mx-auto">Ready to teach with less friction?</h2>
          <p className="mx-0 mb-8 max-w-[52ch] text-lg text-[#cfd9d1] sm:mx-auto">
            Create your free tutor or student account and bring your next lesson into one calm place.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <LinkButton href="/signup" size="lg" className="border-transparent !bg-white !text-[#163d32] hover:!bg-accent-tint">
              Create an account
            </LinkButton>
            <a
              href={PLATFORM.home}
              className={buttonClassName("outline", "lg", "!border-white/55 !text-white hover:!bg-white/10")}
            >
              Discover IqraSpace
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
