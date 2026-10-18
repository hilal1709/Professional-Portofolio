import { cn } from "@/lib/utils";

/**
 * Kata-kata muncul satu per satu (blur → tajam). Murni CSS — sebelumnya memakai motion/react
 * (±40 KB gzip) hanya untuk efek ini. Lihat `.tg-word` di globals.css.
 */
export const TextGenerateEffect = ({
  words,
  className,
  filter = true,
  duration = 0.5,
}: {
  words: string;
  className?: string;
  filter?: boolean;
  duration?: number;
}) => {
  return (
    <div className={cn("font-bold", className)}>
      <div className="mt-4">
        <div className="text-2xl leading-snug tracking-wide text-black">
          <div>
            {words.split(" ").map((word, idx) => (
              <span
                key={word + idx}
                className={cn("tg-word text-black", !filter && "tg-word-nofilter")}
                style={{ animationDuration: `${duration || 1}s`, animationDelay: `${idx * 0.2}s` }}
              >
                {word}{" "}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
