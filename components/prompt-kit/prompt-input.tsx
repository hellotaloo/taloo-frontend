"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

interface PromptInputContextValue {
  value: string
  onValueChange: (value: string) => void
  isLoading: boolean
  onSubmit: () => void
}

const PromptInputContext = React.createContext<PromptInputContextValue | null>(null)

function usePromptInput() {
  const context = React.useContext(PromptInputContext)
  if (!context) {
    throw new Error("usePromptInput must be used within a PromptInput")
  }
  return context
}

interface PromptInputProps {
  children: React.ReactNode
  value: string
  onValueChange: (value: string) => void
  isLoading?: boolean
  onSubmit: () => void
  className?: string
}

function PromptInput({
  children,
  value,
  onValueChange,
  isLoading = false,
  onSubmit,
  className,
}: PromptInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Only handle Enter from textarea elements to avoid double-submission
    // when Enter is pressed on the submit button (which also triggers onClick)
    const target = e.target as HTMLElement
    if (e.key === "Enter" && !e.shiftKey && target.tagName === "TEXTAREA") {
      e.preventDefault()
      onSubmit()
    }
  }

  return (
    <PromptInputContext.Provider value={{ value, onValueChange, isLoading, onSubmit }}>
      <div
        className={cn(
          "bg-neutral-100 flex flex-col rounded-2xl p-2",
          className
        )}
        onKeyDown={handleKeyDown}
      >
        {children}
      </div>
    </PromptInputContext.Provider>
  )
}

interface PromptInputTextareaProps {
  placeholder?: string
  className?: string
  disableAutosize?: boolean
}

const PromptInputTextarea = React.forwardRef<HTMLTextAreaElement, PromptInputTextareaProps>(
  function PromptInputTextarea({
    placeholder = "Type a message...",
    className,
    disableAutosize = false,
  }, forwardedRef) {
    const { value, onValueChange, isLoading } = usePromptInput()
    const internalRef = React.useRef<HTMLTextAreaElement>(null)
    
    // Merge refs
    const textareaRef = (forwardedRef || internalRef) as React.RefObject<HTMLTextAreaElement>

    React.useEffect(() => {
      if (!disableAutosize && textareaRef.current) {
        textareaRef.current.style.height = "auto"
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
      }
    }, [value, disableAutosize, textareaRef])

    return (
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        placeholder={placeholder}
        disabled={isLoading}
        rows={1}
        className={cn(
          "placeholder:text-muted-foreground w-full resize-none bg-transparent px-2 py-2 text-sm focus:outline-none disabled:opacity-50",
          className
        )}
      />
    )
  }
)

interface PromptInputActionsProps {
  children: React.ReactNode
  className?: string
}

function PromptInputActions({ children, className }: PromptInputActionsProps) {
  return <div className={cn("flex items-center", className)}>{children}</div>
}

interface PromptInputActionProps {
  children: React.ReactNode
  tooltip?: string
  className?: string
}

function PromptInputAction({ children, tooltip, className }: PromptInputActionProps) {
  if (tooltip) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={className}>{children}</div>
        </TooltipTrigger>
        <TooltipContent side="top">{tooltip}</TooltipContent>
      </Tooltip>
    )
  }

  return <div className={className}>{children}</div>
}

export {
  PromptInput,
  PromptInputTextarea,
  PromptInputActions,
  PromptInputAction,
  usePromptInput,
}
