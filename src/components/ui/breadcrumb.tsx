"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BreadcrumbItemProps {
  label: React.ReactNode;
  href?: string;
  icon?: React.ReactNode;
  isCurrent?: boolean; // Can be inferred if it's the last item without href
  className?: string;
}

export interface BreadcrumbProps extends React.HTMLAttributes<HTMLElement> {
  items: BreadcrumbItemProps[];
  separator?: React.ReactNode;
  itemClassName?: string;
  linkClassName?: string;
  currentClassName?: string;
  separatorClassName?: string;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({
  items,
  separator = <ChevronRight size={16} className="mx-1 text-muted-foreground" />,
  className,
  itemClassName,
  linkClassName,
  currentClassName,
  separatorClassName,
  ...props
}) => {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("flex items-center text-sm", className)}
      {...props}
    >
      <ol className="flex items-center space-x-0">
        {items.map((item, index) => {
          const isLastItem = index === items.length - 1;
          const isCurrentPage = item.isCurrent || (isLastItem && !item.href);

          return (
            <li
              key={index}
              className={cn("flex items-center", itemClassName, item.className)}
            >
              {item.icon && <span className="mr-1.5">{item.icon}</span>}
              {isCurrentPage ? (
                <span
                  className={cn(
                    "font-medium text-foreground",
                    currentClassName,
                  )}
                  aria-current="page"
                >
                  {item.label}
                </span>
              ) : item.href ? (
                <Link
                  href={item.href}
                  className={cn(
                    "text-muted-foreground hover:text-foreground hover:underline",
                    linkClassName,
                  )}
                >
                  {item.label}
                </Link>
              ) : (
                <span className={cn("text-muted-foreground", linkClassName)}>
                  {item.label}
                </span>
              )}
              {!isLastItem && (
                <span
                  className={cn("select-none", separatorClassName)}
                  aria-hidden="true"
                >
                  {separator}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
