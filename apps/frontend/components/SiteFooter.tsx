export interface SiteFooterProps {
  /** The index scans a wide grid; every other page is running text on a narrow measure. */
  wide?: boolean;
}

export function SiteFooter({ wide = false }: SiteFooterProps) {
  return (
    <footer className="border-t border-rule">
      <div className={`mx-auto w-full px-6 py-10 ${wide ? 'max-w-[1200px]' : 'max-w-[42rem]'}`}>
        <p className="text-sm text-muted">
          <a
            href="https://github.com/Jose-Perigolo/sports-articles"
            className="rounded-sm underline underline-offset-4 transition-colors hover:text-emphasis focus-visible:ring-2 focus-visible:ring-emphasis focus-visible:outline-none"
          >
            Fullstack assessment for Speed &amp; Function
          </a>
        </p>
      </div>
    </footer>
  );
}
