import React, { useEffect, useRef, useState } from 'react';
import { clsx } from 'clsx';
import { ChevronRight } from 'lucide-react';

export type MenuItemType = {
  id: string;
  label: string;
  icon?: React.ReactNode;
  shortcut?: string;
  disabled?: boolean;
  onClick?: () => void;
  subItems?: MenuItemType[];
  isSeparator?: boolean;
};

interface ContextMenuProps {
  x: number;
  y: number;
  items: MenuItemType[];
  onClose: () => void;
}

export function ContextMenu({ x, y, items, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const [activeSubMenu, setActiveSubMenu] = useState<string | null>(null);

  // Position state to handle viewport edges
  const [position, setPosition] = useState({ top: y, left: x, opacity: 0, transform: 'scale(0.95)' });

  // Handle edge detection and entrance animation
  useEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let newLeft = x;
      let newTop = y;

      if (x + rect.width > viewportWidth) {
        newLeft = x - rect.width;
      }
      if (y + rect.height > viewportHeight) {
        newTop = viewportHeight - rect.height - 8;
      }

      setPosition({ 
        top: Math.max(8, newTop), 
        left: Math.max(8, newLeft), 
        opacity: 1, 
        transform: 'scale(1)' 
      });
    }
  }, [x, y]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    // Use setTimeout to avoid immediate closing from the initial click
    setTimeout(() => document.addEventListener('mousedown', handleClickOutside), 0);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const interactiveItems = items.filter(i => !i.isSeparator && !i.disabled);
      
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown' || e.key === 'Tab') {
        e.preventDefault();
        setActiveIndex(prev => (prev + 1) % interactiveItems.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex(prev => (prev - 1 < 0 ? interactiveItems.length - 1 : prev - 1));
      } else if (e.key === 'Enter' && activeIndex >= 0) {
        e.preventDefault();
        const item = interactiveItems[activeIndex];
        if (item.onClick) {
          item.onClick();
          onClose();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [items, activeIndex, onClose]);

  return (
    <div
      ref={menuRef}
      onContextMenu={(e) => e.preventDefault()}
      className={clsx(
        "fixed z-[999999] w-64 rounded-xl border font-sans select-none pointer-events-auto",
        "bg-white/80 dark:bg-[#1c1c1e]/85 backdrop-blur-2xl",
        "border-gray-200 dark:border-white/10",
        "shadow-[0_10px_30px_rgba(0,0,0,0.15)]",
        "transition-all duration-150 ease-out origin-top-left"
      )}
      style={{
        top: position.top,
        left: position.left,
        opacity: position.opacity,
        transform: position.transform,
      }}
    >
      <div className="flex flex-col py-1.5 text-[13px] text-gray-800 dark:text-gray-200">
        {items.map((item, i) => {
          if (item.isSeparator) {
            return <div key={`sep-${i}`} className="h-px bg-gray-200 dark:bg-white/10 my-1 mx-2" />;
          }

          const isInteractiveIndex = items.filter(i => !i.isSeparator && !i.disabled).indexOf(item);
          const isActive = activeIndex === isInteractiveIndex;

          return (
            <button
              key={item.id}
              disabled={item.disabled}
              onMouseEnter={() => {
                if (!item.disabled) setActiveIndex(isInteractiveIndex);
              }}
              onClick={() => {
                if (!item.disabled && item.onClick) {
                  item.onClick();
                  onClose();
                }
              }}
              className={clsx(
                "group flex items-center justify-between px-3 py-1.5 mx-1.5 rounded-lg text-left transition-colors",
                item.disabled ? "opacity-40 cursor-not-allowed" : "cursor-default",
                !item.disabled && isActive ? "bg-blue-500/15 dark:bg-blue-500/20 text-blue-700 dark:text-blue-100" : "hover:bg-blue-500/10 dark:hover:bg-blue-500/15"
              )}
            >
              <div className="flex items-center gap-3">
                {item.icon && (
                  <span className={clsx(
                    "flex items-center justify-center w-4 h-4",
                    isActive ? "text-blue-600 dark:text-blue-400" : "text-gray-500 dark:text-gray-400"
                  )}>
                    {item.icon}
                  </span>
                )}
                <span className="font-medium">{item.label}</span>
              </div>
              
              <div className="flex items-center gap-2">
                {item.shortcut && (
                  <span className={clsx(
                    "text-[11px] tracking-wide",
                    isActive ? "text-blue-500/80 dark:text-blue-300/80" : "text-gray-400 dark:text-gray-500"
                  )}>
                    {item.shortcut}
                  </span>
                )}
                {item.subItems && (
                  <ChevronRight size={14} className={isActive ? "text-blue-500" : "text-gray-400"} />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
