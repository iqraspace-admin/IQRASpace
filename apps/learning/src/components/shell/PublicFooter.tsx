import { PLATFORM } from "@/lib/platformLinks";
import { Brand } from "./Brand";

const COLUMNS: { heading: string; links: { label: string; href: string }[] }[] = [
  {
    heading: "IqraSpace",
    links: [
      { label: "Home", href: PLATFORM.home },
      { label: "About", href: PLATFORM.about },
      { label: "Explore", href: PLATFORM.explore },
      { label: "Our Mission", href: PLATFORM.mission },
      { label: "Get Involved", href: PLATFORM.getInvolved },
      { label: "Contact", href: PLATFORM.contact },
      { label: "FAQ", href: PLATFORM.faq },
    ],
  },
  {
    heading: "Products",
    links: [
      { label: "Quran Reader", href: PLATFORM.quran },
      { label: "Duas", href: PLATFORM.duas },
      { label: "Learning App", href: "/" },
      { label: "Mobile App", href: PLATFORM.mobileApp },
    ],
  },
  {
    heading: "Contact",
    links: [
      { label: "Contact form", href: PLATFORM.contact },
      { label: "iqraspaceorg@gmail.com", href: PLATFORM.email },
      { label: "X — @IqraspaceOrg", href: PLATFORM.x },
      { label: "Instagram — @IqraspaceOrg", href: PLATFORM.instagram },
    ],
  },
];

/**
 * The website's dark-green footer (apps/site `.site-footer`), for the signed-out
 * pages. Colours are literal rather than theme tokens: like the site's, it stays
 * dark green in both themes.
 */
export function PublicFooter() {
  const link = "inline-block min-h-8 py-1.5 text-[15px] text-[#cfd9d1] no-underline hover:text-white hover:underline";
  return (
    <footer className="on-dark bg-[#0f2e25] px-5 pb-8 pt-12 text-[#cfd9d1] sm:px-6 lg:px-8 lg:pt-20">
      <div className="mx-auto max-w-[1200px]">
        <div className="grid grid-cols-2 gap-x-5 gap-y-8 lg:grid-cols-[1.6fr_1fr_1fr_1.2fr] lg:gap-12">
          <div className="col-span-2 lg:col-span-1">
            <Brand onDark />
            <p className="mt-5 max-w-[34ch] text-[15px]">
              A free, non-commercial space to read, listen, learn and reflect on the Quran.
            </p>
          </div>
          {COLUMNS.map((col, i) => (
            <div key={col.heading} className={i === COLUMNS.length - 1 ? "col-span-2 lg:col-span-1" : ""}>
              <h2 className="mb-5 !font-sans text-xs font-semibold uppercase tracking-[0.14em] !text-[#e9d9b0]">
                {col.heading}
              </h2>
              <ul className="m-0 grid list-none gap-1 p-0">
                {col.links.map((l) => (
                  <li key={l.label}>
                    {l.href === "/" ? (
                      <a href={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/`} className={link}>
                        {l.label}
                      </a>
                    ) : (
                      <a href={l.href} className={link}>
                        {l.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-col justify-between gap-4 border-t border-white/15 pt-6 text-sm sm:flex-row lg:mt-16">
          <span>© 2026 IqraSpace. A Sadaqah Jariyah project — free, ad-free, always.</span>
          <nav aria-label="Legal" className="flex gap-6">
            <a href={PLATFORM.privacy} className="text-[#cfd9d1] no-underline hover:text-white hover:underline">
              Privacy Policy
            </a>
            <a href={PLATFORM.terms} className="text-[#cfd9d1] no-underline hover:text-white hover:underline">
              Terms of Use
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
