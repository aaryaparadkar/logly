import Image from "next/image";

export function Logo({ className }: { className?: string }) {
  return (
    <Image
      src="/android-chrome-192x192.png"
      alt="logly"
      width={32}
      height={32}
      className={className}
    />
  );
}
