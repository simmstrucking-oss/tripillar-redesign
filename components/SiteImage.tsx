import Image from 'next/image'

interface SiteImageProps {
  src: string
  alt: string
  maxWidth?: number
  className?: string
}

export function SiteImage({ src, alt, maxWidth = 600, className = '' }: SiteImageProps) {
  return (
    <div style={{ maxWidth: `clamp(200px, 90vw, ${maxWidth}px)`, margin: '2rem auto', borderRadius: '12px', overflow: 'hidden' }} className={className}>
      <Image
        src={src}
        alt={alt}
        width={maxWidth}
        height={Math.round(maxWidth * 0.667)}
        style={{ width: '100%', height: 'auto', display: 'block' }}
      />
    </div>
  )
}
