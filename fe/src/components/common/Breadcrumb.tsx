'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <div
      className="relative w-full overflow-hidden flex items-center"
      style={{
        minHeight: '70px',
      }}
    >

      <nav
        aria-label="Breadcrumb"
        className="relative z-10 px-8 md:px-16"
      >
        <ol className="flex items-center gap-1 flex-wrap">
          {items.map((item, idx) => {
            const isLast = idx === items.length - 1;
            return (
              <li key={idx} className="flex items-center gap-1">
                {idx > 0 && (
                  <ChevronRight className="w-4 h-4 text-[#A57322] opacity-70 flex-shrink-0" />
                )}
                {item.href && !isLast ? (
                  <Link
                    href={item.href}
                    className="text-[#A57322] hover:underline font-serif text-base md:text-lg transition-colors"
                    style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span
                    className="text-[#5a4a2f] font-serif text-base md:text-lg"
                    style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                    aria-current={isLast ? 'page' : undefined}
                  >
                    {item.label}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );
}
