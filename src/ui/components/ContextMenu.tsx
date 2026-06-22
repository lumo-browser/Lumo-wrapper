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
  const [pos, setPos] = useState({ top: y, left: x, opacity: 0, scale: 0.95 });

  // Adjust position to keep menu inside the viewport
  useEffect(() => {
    if (!menuRef.current) return;
    const rect = menuRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    setPos({
      top:     Math.max(8, y + rect.height > vh ? vh - rect.height - 8 : y),
      left:    Math.max(8, x + rect.width  > vw ? x - rect.width        : x),
      opacity: 1,
      scale:   1,
    });
  }, [x, y]);

  // Keyboard shortcuts
  useEffect(() => {
    const interactive = items.filter(i => !i.isSeparator && !i.disabled);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      } else if (e.key === 'ArrowDown' || e.key === 'Tab') {
        e.preventDefault();
        setActiveIndex(p => (p + 1) % interactive.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex(p => (p - 1 < 0 ? interactive.length - 1 : p - 1));
      } else if (e.key === 'Enter' && activeIndex >= 0) {
        e.preventDefault();
        const item = interactive[activeIndex];
        item?.onClick?.();
        onClose();
      }
    };

    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [items, activeIndex, onClose]);

  const interactiveItems = items.filter(i => !i.isSeparator && !i.disabled);

  return (
    <>
      {/*
        Full-screen invisible backdrop — clicking or right-clicking anywhere
        outside the menu closes it immediately. No async setTimeout needed.
      */}
      <div
        className="fixed inset-0 z-[999998]"
        onMouseDown={onClose}
        onContextMenu={(e) => { e.preventDefault(); onClose(); }}
        aria-hidden
      />

      {/* The menu itself sits above the backdrop */}
      <div
        ref={menuRef}
        role="menu"
        aria-label="Context menu"
        onContextMenu={(e) => e.preventDefault()}
        className={clsx(
          'fixed z-[999999] w-64 rounded-2xl border font-sans select-none',
          'bg-white/40 dark:bg-[#1c1c1e]/40 backdrop-blur-3xl saturate-[1.2]',
          'border-white/50 dark:border-white/10',
          'shadow-[0_20px_40px_-10px_rgba(0,0,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.4)]',
          'transition-[opacity,transform] duration-200 ease-out origin-top-left',
        )}
        style={{
          top: pos.top,
          left: pos.left,
          opacity: pos.opacity,
          transform: `scale(${pos.scale})`,
        }}
      >
        <div className="flex flex-col py-2 px-1 text-[13px] text-gray-800 dark:text-gray-200">
          {items.map((item, i) => {
            if (item.isSeparator) {
              return <div key={`sep-${i}`} className="h-px bg-gray-200 dark:bg-white/10 my-1 mx-2" />;
            }

            const idx = interactiveItems.indexOf(item);
            const isActive = activeIndex === idx;

            return (
              <button
                key={item.id}
                role="menuitem"
                disabled={item.disabled}
                onMouseEnter={() => { if (!item.disabled) setActiveIndex(idx); }}
                onMouseLeave={() => setActiveIndex(-1)}
                onClick={() => {
                  if (!item.disabled && item.onClick) {
                    item.onClick();
                    onClose();
                  }
                }}
                className={clsx(
                  'group flex items-center justify-between w-full px-3 py-1.5 mx-0 rounded-lg text-left transition-colors duration-75',
                  item.disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-default',
                  !item.disabled && isActive
                    ? 'bg-violet-500/15 dark:bg-violet-500/20 text-violet-700 dark:text-violet-200'
                    : 'hover:bg-gray-100 dark:hover:bg-white/8',
                )}
              >
                <div className="flex items-center gap-2.5">
                  {item.icon && (
                    <span className={clsx(
                      'flex items-center justify-center w-4 h-4 flex-shrink-0',
                      isActive ? 'text-violet-500 dark:text-violet-400' : 'text-gray-500 dark:text-gray-400',
                    )}>
                      {item.icon}
                    </span>
                  )}
                  <span className="font-medium leading-tight">{item.label}</span>
                </div>

                <div className="flex items-center gap-1.5 ml-4">
                  {item.shortcut && (
                    <span className={clsx(
                      'text-[10px] font-mono tracking-wide whitespace-nowrap',
                      isActive ? 'text-violet-400/80' : 'text-gray-400 dark:text-gray-500',
                    )}>
                      {item.shortcut}
                    </span>
                  )}
                  {item.subItems && (
                    <ChevronRight size={13} className={isActive ? 'text-violet-400' : 'text-gray-400'} />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
