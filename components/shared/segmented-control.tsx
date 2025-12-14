'use client';

/**
 * Control segmentado animado (Segmented Control / Toggle)
 * - En desktop: muestra todas las opciones con indicador deslizante
 * - En mobile: solo muestra la opción activa y se comporta como toggle
 * Componente reutilizable para 2 o más secciones
 */

import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

export interface SegmentOption {
  value: string;
  label: string;
}

interface SegmentedControlProps {
  options: SegmentOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function SegmentedControl({
  options,
  value,
  onChange,
  className,
}: SegmentedControlProps) {
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonsRef = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    const activeIndex = options.findIndex(option => option.value === value);
    const activeButton = buttonsRef.current[activeIndex];
    
    if (activeButton && containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const buttonRect = activeButton.getBoundingClientRect();
      
      setIndicatorStyle({
        left: buttonRect.left - containerRect.left,
        width: buttonRect.width,
      });
    }
  }, [value, options]);

  const handleNext = () => {
    const currentIndex = options.findIndex(option => option.value === value);
    const nextIndex = (currentIndex + 1) % options.length;
    onChange(options[nextIndex].value);
  };

  const activeOption = options.find(option => option.value === value);

  return (
    <div className="flex justify-center">
      {/* Vista Desktop - Control Segmentado Completo */}
      <div
        ref={containerRef}
        className={cn(
          'hidden sm:flex relative rounded-lg bg-muted p-1 gap-1',
          className
        )}
      >
        {/* Indicador deslizante animado */}
        <div
          className="absolute top-1 bottom-1 rounded-md bg-primary shadow-sm transition-all duration-200 ease-out"
          style={{
            left: indicatorStyle.left,
            width: indicatorStyle.width,
          }}
        />

        {/* Botones de opciones */}
        {options.map((option, index) => (
          <button
            key={option.value}
            ref={el => { buttonsRef.current[index] = el; }}
            onClick={() => onChange(option.value)}
            className={cn(
              'relative z-10 px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              value === option.value
                ? 'text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Vista Mobile - Toggle Button */}
      <button
        onClick={handleNext}
        className={cn(
          'flex sm:hidden items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium',
          'shadow-sm transition-all duration-200',
          'hover:bg-primary/80 active:scale-[0.98]',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          className
        )}
      >
        <span className="text-foreground font-medium">
          {activeOption?.label || options[0].label}
        </span>
        <svg
          className="w-4 h-4 text-primary-foreground"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
          />
        </svg>
      </button>
    </div>
  );
}
