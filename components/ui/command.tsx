"use client"

import * as React from "react"
import { Command as CommandPrimitive } from "cmdk"

import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { SearchIcon } from "lucide-react"

function Command({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive>) {
  return (
    <CommandPrimitive
      data-slot="command"
      className={cn(
        "flex size-full flex-col overflow-hidden rounded-2xl bg-white text-[#0A261E]",
        className
      )}
      {...props}
    />
  )
}

function CommandDialog({
  title = "Command Palette",
  description = "Search for a command to run...",
  children,
  className,
  showCloseButton = false,
  ...props
}: Omit<React.ComponentProps<typeof Dialog>, "children"> & {
  title?: string
  description?: string
  className?: string
  showCloseButton?: boolean
  children: React.ReactNode
}) {
  return (
    <Dialog {...props}>
      <DialogHeader className="sr-only">
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
      <DialogContent
        className={cn(
          "top-[12vh] w-[92vw] max-w-[600px] translate-y-0 overflow-hidden rounded-2xl border border-[#0A261E]/10 bg-white p-0 shadow-[0_28px_70px_-18px_rgba(10,38,30,0.38)]",
          className
        )}
        showCloseButton={showCloseButton}
      >
        {children}
      </DialogContent>
    </Dialog>
  )
}

function CommandInput({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Input>) {
  return (
    <div
      data-slot="command-input-wrapper"
      className="flex h-14 items-center gap-3 border-b border-[#0A261E]/8 px-4"
    >
      <SearchIcon className="size-[18px] shrink-0 text-[#0A261E]/40" />
      <CommandPrimitive.Input
        data-slot="command-input"
        className={cn(
          "h-full w-full bg-transparent text-[15px] text-[#0A261E] outline-hidden placeholder:text-[#0A261E]/40 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      />
    </div>
  )
}

function CommandList({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.List>) {
  return (
    <CommandPrimitive.List
      data-slot="command-list"
      className={cn(
        "no-scrollbar max-h-[52vh] scroll-py-2 overflow-x-hidden overflow-y-auto overscroll-contain p-2 outline-none",
        className
      )}
      {...props}
    />
  )
}

function CommandEmpty({
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Empty>) {
  return (
    <CommandPrimitive.Empty
      data-slot="command-empty"
      className="py-12 text-center text-[13px] text-[#0A261E]/50"
      {...props}
    />
  )
}

function CommandGroup({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Group>) {
  return (
    <CommandPrimitive.Group
      data-slot="command-group"
      className={cn(
        "overflow-hidden text-[#0A261E] [&:not(:first-child)]:pt-3 **:[[cmdk-group-items]]:space-y-0.5 **:[[cmdk-group-heading]]:px-2.5 **:[[cmdk-group-heading]]:pb-1.5 **:[[cmdk-group-heading]]:text-[11px] **:[[cmdk-group-heading]]:font-semibold **:[[cmdk-group-heading]]:uppercase **:[[cmdk-group-heading]]:tracking-[0.08em] **:[[cmdk-group-heading]]:text-[#0A261E]/40",
        className
      )}
      {...props}
    />
  )
}

function CommandSeparator({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Separator>) {
  return (
    <CommandPrimitive.Separator
      data-slot="command-separator"
      className={cn("mx-2 my-1.5 h-px bg-[#0A261E]/[0.06]", className)}
      {...props}
    />
  )
}

function CommandItem({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Item>) {
  return (
    <CommandPrimitive.Item
      data-slot="command-item"
      className={cn(
        "group/command-item relative flex h-11 cursor-pointer items-center gap-3 rounded-xl px-2.5 text-[13.5px] outline-hidden select-none transition-colors data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-40 data-selected:bg-[#0A261E]/[0.055] [&_svg]:pointer-events-none [&_svg]:shrink-0",
        className
      )}
      {...props}
    />
  )
}

function CommandShortcut({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="command-shortcut"
      className={cn(
        "ml-auto flex h-5 min-w-5 items-center justify-center rounded-md border border-[#0A261E]/10 bg-[#fffbf2] px-1.5 font-sans text-[10px] font-semibold tracking-normal text-[#0A261E]/45",
        className
      )}
      {...props}
    />
  )
}

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
}
