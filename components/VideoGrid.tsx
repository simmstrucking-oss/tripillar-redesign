'use client';

import { useState, useEffect, useCallback } from 'react';
import FadeIn from '@/components/FadeIn';

interface Video {
  id: string;
  lesson: string;
  title: string;
}

interface VideoGridProps {
  videos: Video[];
  channelUrl: string;
}

export default function VideoGrid({ videos, channelUrl }: VideoGridProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const close = useCallback(() => setActiveId(null), []);

  // Close on Escape key
  useEffect(() => {
    if (!activeId) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [activeId, close]);

  // Lock body scroll when modal open
  useEffect(() => {
    document.body.style.overflow = activeId ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [activeId]);

  return (
    <>
      {/* Video card grid — no visual changes */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {videos.map((video, i) => (
          <FadeIn key={video.id} delay={i * 60}>
            <button
              onClick={() => setActiveId(video.id)}
              className="block w-full text-left group rounded-xl overflow-hidden border border-card-border bg-card-bg shadow-sm card-hover"
            >
              {/* Thumbnail */}
              <div className="relative w-full bg-navy/5" style={{ paddingBottom: '56.25%' }}>
                <img
                  src={`https://img.youtube.com/vi/${video.id}/mqdefault.jpg`}
                  alt={video.title}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-navy/0 group-hover:bg-navy/20 transition-colors flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-gold/80 group-hover:bg-gold flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                    <span className="text-white text-sm ml-0.5">▶</span>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <p className="text-gold text-xs font-semibold mb-1">Lesson {video.lesson}</p>
                <p className="text-navy text-sm font-medium leading-snug">{video.title}</p>
              </div>
            </button>
          </FadeIn>
        ))}
      </div>

      {/* YouTube CTA */}
      <FadeIn delay={200}>
        <div className="text-center mt-10">
          <a
            href={channelUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-gold text-white font-semibold px-8 py-3.5 rounded-md hover:bg-gold-light transition-colors text-sm"
          >
            Watch All 60 Lessons on YouTube →
          </a>
        </div>
      </FadeIn>

      {/* Modal overlay */}
      {activeId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={close}
        >
          <div
            className="relative w-full max-w-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={close}
              aria-label="Close video"
              className="absolute -top-10 right-0 text-white/80 hover:text-white text-3xl leading-none font-light"
            >
              ×
            </button>
            {/* 16:9 iframe */}
            <div className="relative w-full rounded-xl overflow-hidden" style={{ paddingBottom: '56.25%' }}>
              <iframe
                src={`https://www.youtube.com/embed/${activeId}?autoplay=1&rel=0&modestbranding=1`}
                title="Live and Grieve™ video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 w-full h-full"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
