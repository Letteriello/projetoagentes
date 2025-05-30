"use client";

import * as React from "react";
import { DialogProps } from "@radix-ui/react-dialog";
// Implementação simplificada para evitar dependência direta do cmdk
import { Search } from "lucide-react";

import { cn } from "@/lib/utils";
import { Dialog, DialogContent } from "@/components/ui/dialog";

// Implementação simplificada do CommandPrimitive
const CommandPrimitive = {
  displayName: "Command",
  Input: ({
    className,
    ...props
  }: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input className={className} {...props} />
  ),
  List: ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={className} {...props} />
  ),
  Empty: ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={className} {...props} />
  ),
  Group: ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={className} {...props} />
  ),
  Item: ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={className} {...props} />
  ),
  Separator: ({
    className,
    ...props
  }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={className} {...props} />
  ),
};

const Command = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground",
      className,
    )}
    {...props}
  />
));
Command.displayName = "Command";

interface CommandDialogProps extends DialogProps {}

const CommandDialog = ({ children, ...props }: CommandDialogProps) => {
  return (
    <Dialog {...props}>
      <DialogContent className="overflow-hidden p-0 shadow-lg">
        <Command className="w-full">{children}</Command>
      </DialogContent>
    </Dialog>
  );
};

const CommandInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <div className="flex items-center border-b px-3">
    <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
    <input
      ref={ref}
      className={cn(
        "flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  </div>
));

CommandInput.displayName = "CommandInput";

const CommandList = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("max-h-[300px] overflow-y-auto overflow-x-hidden", className)}
    {...props}
  />
));

CommandList.displayName = "CommandList";

const CommandEmpty = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>((props, ref) => (
  <div ref={ref} className="py-6 text-center text-sm" {...props} />
));

CommandEmpty.displayName = "CommandEmpty";

const CommandGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("overflow-hidden p-1 text-foreground", className)}
    {...props}
  />
));

CommandGroup.displayName = "CommandGroup";

const CommandSeparator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("-mx-1 h-px bg-border", className)} {...props} />
));
CommandSeparator.displayName = "CommandSeparator";

interface CommandItemProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  onSelect: () => void;
  children: React.ReactNode;
}

const CommandItem = React.forwardRef<HTMLDivElement, CommandItemProps>(
  ({ value, onSelect, className, children, ...props }, ref) => (
    <div
      ref={ref}
      role="option"
      tabIndex={0}
      data-value={value}
      onClick={onSelect}
      className={cn(
        "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  ),
);
CommandItem.displayName = "CommandItem";

const CommandShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={cn(
        "ml-auto text-xs tracking-widest text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
};
CommandShortcut.displayName = "CommandShortcut";

export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
};
