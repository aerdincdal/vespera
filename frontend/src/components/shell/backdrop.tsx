export function Backdrop() {
  return (
    <>
      <div className="vs-backdrop" aria-hidden>
        <div className="vs-blob vs-blob-a" />
        <div className="vs-blob vs-blob-b" />
        <div className="vs-blob vs-blob-c" />
      </div>
      <svg className="vs-grain" aria-hidden xmlns="http://www.w3.org/2000/svg">
        <filter id="vs-noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#vs-noise)" />
      </svg>
    </>
  );
}
