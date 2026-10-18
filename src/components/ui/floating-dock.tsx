import { cn } from "@/lib/utils";

type Item = { title: string; icon: React.ReactNode; href: string };

/**
 * Dock ikon sosial. Efek membesar saat di-hover memakai transisi CSS saja
 * (versi lama memakai motion/react + @tabler/icons, berat untuk satu baris ikon).
 * Di HP ikon langsung tampil berjajar — tidak perlu tombol buka-tutup.
 */
export const FloatingDock = ({
  items,
  desktopClassName,
  mobileClassName,
}: {
  items: Item[];
  desktopClassName?: string;
  mobileClassName?: string;
}) => {
  return (
    <>
      <div className={cn("mx-auto hidden h-16 items-end gap-4 rounded-2xl bg-gray-50 px-4 pb-3 md:flex", desktopClassName)}>
        {items.map((item) => (
          <a
            key={item.title}
            href={item.href}
            aria-label={item.title}
            className="group relative flex size-10 origin-bottom items-center justify-center rounded-full bg-gray-200 transition-[width,height] duration-200 ease-out hover:size-16 focus-visible:size-16"
          >
            <span className="pointer-events-none absolute -top-8 left-1/2 w-fit -translate-x-1/2 translate-y-2 whitespace-pre rounded-md border border-gray-200 bg-gray-100 px-2 py-0.5 text-xs text-neutral-700 opacity-0 transition duration-150 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100">
              {item.title}
            </span>
            <span className="flex size-5 items-center justify-center transition-[width,height] duration-200 ease-out group-hover:size-8 group-focus-visible:size-8">{item.icon}</span>
          </a>
        ))}
      </div>
      <div className={cn("flex flex-wrap justify-center gap-2 md:hidden", mobileClassName)}>
        {items.map((item) => (
          <a key={item.title} href={item.href} aria-label={item.title} className="flex size-10 items-center justify-center rounded-full bg-gray-50">
            <span className="size-4">{item.icon}</span>
          </a>
        ))}
      </div>
    </>
  );
};
