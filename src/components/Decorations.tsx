"use client";

// Reusable SVG paths
const SHAPES = {
  star: "M12 2l2.09 6.26L20 10l-4.74 3.64L16.18 20 12 16.27 7.82 20l.92-6.36L4 10l5.91-1.74z",
  heart: "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z",
  cloud: "M19.35 10.04A7.49 7.49 0 0012 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 000 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z",
  moon: "M12 3a9 9 0 109 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 01-4.4 2.26 5.403 5.403 0 01-3.14-9.8c-.44-.06-.9-.1-1.36-.1z",
  sparkle: "M12 2L13.09 8.26L18 6L14.74 10.91L21 12L14.74 13.09L18 18L13.09 15.74L12 22L10.91 15.74L6 18L9.26 13.09L3 12L9.26 10.91L6 6L10.91 8.26L12 2Z",
  leaf: "M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z",
  flower: "M12 22c4.97 0 9-4.03 9-9-4.97 0-9 4.03-9 9zM5.6 10.25a2.5 2.5 0 003.92 2.06l-.02.19a2.5 2.5 0 005 0l-.02-.19a2.5 2.5 0 003.92-2.06 2.5 2.5 0 00-2.5-2.5c-.42 0-.81.1-1.16.29a2.5 2.5 0 00-4.48 0c-.35-.19-.74-.29-1.16-.29a2.5 2.5 0 00-2.5 2.5z",
  butterfly: "M12 12c-1-1-4-3.5-4-6s2-4 4-2c2-2 4-.5 4 2s-3 5-4 6zm0 0c1 1 4 3.5 4 6s-2 4-4 2c-2 2-4 .5-4-2s3-5 4-6z",
  circle: "M12 2a10 10 0 100 20 10 10 0 000-20z",
};

interface FloatingItem {
  shape: keyof typeof SHAPES;
  size: string;
  color: string;
  top: string;
  animation: string;
  opacity?: string;
}

const LEFT_ITEMS: FloatingItem[] = [
  { shape: "star", size: "h-5 w-5", color: "text-pink-200", top: "top-20", animation: "animate-cloud-1" },
  { shape: "heart", size: "h-4 w-4", color: "text-pink-300", top: "top-36", animation: "animate-cloud-2" },
  { shape: "cloud", size: "h-12 w-12", color: "text-sky-200", top: "top-52", animation: "animate-cloud-3", opacity: "opacity-50" },
  { shape: "sparkle", size: "h-3 w-3", color: "text-sky-300", top: "top-72", animation: "animate-cloud-1" },
  { shape: "leaf", size: "h-6 w-6", color: "text-sky-200", top: "top-[22rem]", animation: "animate-cloud-2" },
  { shape: "heart", size: "h-7 w-7", color: "text-pink-200", top: "top-[28rem]", animation: "animate-cloud-3" },
  { shape: "star", size: "h-9 w-9", color: "text-sky-200", top: "top-[35rem]", animation: "animate-cloud-1", opacity: "opacity-45" },
  { shape: "circle", size: "h-3 w-3", color: "text-pink-200", top: "top-[40rem]", animation: "animate-cloud-2" },
  { shape: "butterfly", size: "h-5 w-5", color: "text-violet-200", top: "top-[46rem]", animation: "animate-cloud-3" },
  { shape: "cloud", size: "h-6 w-6", color: "text-sky-200", top: "top-[53rem]", animation: "animate-cloud-1" },
  { shape: "sparkle", size: "h-4 w-4", color: "text-pink-200", top: "top-[59rem]", animation: "animate-cloud-2" },
  { shape: "flower", size: "h-6 w-6", color: "text-pink-100", top: "top-[65rem]", animation: "animate-cloud-3" },
];

const RIGHT_ITEMS: FloatingItem[] = [
  { shape: "moon", size: "h-6 w-6", color: "text-sky-200", top: "top-24", animation: "animate-cloud-3" },
  { shape: "cloud", size: "h-10 w-10", color: "text-sky-200", top: "top-40", animation: "animate-cloud-1", opacity: "opacity-50" },
  { shape: "flower", size: "h-5 w-5", color: "text-pink-200", top: "top-56", animation: "animate-cloud-2" },
  { shape: "star", size: "h-4 w-4", color: "text-pink-300", top: "top-[18rem]", animation: "animate-cloud-3" },
  { shape: "butterfly", size: "h-7 w-7", color: "text-violet-200", top: "top-[24rem]", animation: "animate-cloud-1" },
  { shape: "heart", size: "h-3 w-3", color: "text-pink-300", top: "top-[30rem]", animation: "animate-cloud-2" },
  { shape: "leaf", size: "h-8 w-8", color: "text-sky-300", top: "top-[36rem]", animation: "animate-cloud-3", opacity: "opacity-45" },
  { shape: "sparkle", size: "h-5 w-5", color: "text-pink-200", top: "top-[42rem]", animation: "animate-cloud-1" },
  { shape: "circle", size: "h-4 w-4", color: "text-sky-200", top: "top-[47rem]", animation: "animate-cloud-2" },
  { shape: "star", size: "h-10 w-10", color: "text-sky-200", top: "top-[53rem]", animation: "animate-cloud-3", opacity: "opacity-40" },
  { shape: "heart", size: "h-5 w-5", color: "text-pink-200", top: "top-[59rem]", animation: "animate-cloud-1" },
  { shape: "cloud", size: "h-7 w-7", color: "text-sky-100", top: "top-[66rem]", animation: "animate-cloud-2" },
  { shape: "moon", size: "h-4 w-4", color: "text-sky-300", top: "top-[72rem]", animation: "animate-cloud-3" },
];

function FloatingShape({ item, offsetX }: { item: FloatingItem; offsetX?: string }) {
  return (
    <svg
      className={`absolute ${item.top} ${offsetX ?? ""} ${item.size} ${item.color} ${item.animation} ${item.opacity ?? "opacity-60"}`}
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d={SHAPES[item.shape]} />
    </svg>
  );
}

export function LeftDecorations() {
  const offsets = ["left-4", "left-10", "left-6", "left-14", "left-8", "left-3", "left-12", "left-5", "left-9", "left-7", "left-11", "left-4"];

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-y-0 left-0 hidden w-20 select-none overflow-hidden lg:block xl:w-28">
      {LEFT_ITEMS.map((item, i) => (
        <FloatingShape key={i} item={item} offsetX={offsets[i % offsets.length]} />
      ))}
    </div>
  );
}

export function RightDecorations() {
  const offsets = ["right-4", "right-10", "right-6", "right-14", "right-8", "right-3", "right-12", "right-5", "right-9", "right-7", "right-11", "right-4", "right-8"];

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-y-0 right-0 hidden w-20 select-none overflow-hidden lg:block xl:w-28">
      {RIGHT_ITEMS.map((item, i) => (
        <FloatingShape key={i} item={item} offsetX={offsets[i % offsets.length]} />
      ))}
    </div>
  );
}
