"use client"

import * as React from "react"
import { ChevronDown, Phone, MessageCircle, FileText } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"

interface ChannelStatusPopoverProps {
  isOnline: boolean
  voiceEnabled: boolean
  whatsappEnabled: boolean
  cvEnabled: boolean
  onToggleMaster: (online: boolean) => void
  onToggleVoice: (enabled: boolean) => void
  onToggleWhatsapp: (enabled: boolean) => void
  onToggleCv: (enabled: boolean) => void
  disabled?: boolean
}

export function ChannelStatusPopover({
  isOnline,
  voiceEnabled,
  whatsappEnabled,
  cvEnabled,
  onToggleMaster,
  onToggleVoice,
  onToggleWhatsapp,
  onToggleCv,
  disabled = false,
}: ChannelStatusPopoverProps) {
  const [open, setOpen] = React.useState(false)

  // Count active channels
  const activeChannels = [voiceEnabled, whatsappEnabled, cvEnabled].filter(Boolean).length
  const totalChannels = 3

  // Only show channel count if online and at least one channel exists
  const showChannelCount = isOnline && (voiceEnabled || whatsappEnabled || cvEnabled)

  return (
    <div className={cn(
      "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm",
      disabled && "opacity-50"
    )}>
      <span className="text-gray-500">Agent online</span>
      <Switch
        checked={isOnline}
        disabled={disabled}
        onCheckedChange={onToggleMaster}
        className="data-[state=checked]:bg-green-500"
      />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            disabled={disabled}
            className={cn(
              "inline-flex items-center gap-1 px-1.5 py-1 rounded-md transition-colors",
              "hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              disabled && "cursor-not-allowed"
            )}
          >
            {showChannelCount && (
              <span className="text-xs text-gray-400 tabular-nums">
                {activeChannels}/{totalChannels}
              </span>
            )}
            <ChevronDown 
              className={cn(
                "w-4 h-4 text-gray-400 transition-transform",
                open && "rotate-180"
              )} 
            />
          </button>
        </PopoverTrigger>
      <PopoverContent align="end" className="w-64 p-0">
        <div className="p-3 border-b border-gray-100">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Kanalen
          </p>
        </div>
        <div className="p-2 space-y-1">
          {/* WhatsApp Channel */}
          <div 
            className={cn(
              "flex items-center justify-between px-3 py-2.5 rounded-md",
              whatsappEnabled ? "bg-green-50" : "bg-gray-50"
            )}
          >
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center",
                whatsappEnabled ? "bg-green-100" : "bg-gray-100"
              )}>
                <MessageCircle className={cn(
                  "w-4 h-4",
                  whatsappEnabled ? "text-green-600" : "text-gray-400"
                )} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">WhatsApp</p>
                <p className={cn(
                  "text-xs",
                  whatsappEnabled ? "text-green-600" : "text-gray-400"
                )}>
                  {whatsappEnabled ? "Actief" : "Inactief"}
                </p>
              </div>
            </div>
            <Switch
              checked={whatsappEnabled}
              disabled={disabled}
              onCheckedChange={onToggleWhatsapp}
              className="data-[state=checked]:bg-green-500"
            />
          </div>

          {/* Voice Channel */}
          <div 
            className={cn(
              "flex items-center justify-between px-3 py-2.5 rounded-md",
              voiceEnabled ? "bg-blue-50" : "bg-gray-50"
            )}
          >
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center",
                voiceEnabled ? "bg-blue-100" : "bg-gray-100"
              )}>
                <Phone className={cn(
                  "w-4 h-4",
                  voiceEnabled ? "text-blue-600" : "text-gray-400"
                )} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Voice</p>
                <p className={cn(
                  "text-xs",
                  voiceEnabled ? "text-blue-600" : "text-gray-400"
                )}>
                  {voiceEnabled ? "Actief" : "Inactief"}
                </p>
              </div>
            </div>
            <Switch
              checked={voiceEnabled}
              disabled={disabled}
              onCheckedChange={onToggleVoice}
              className="data-[state=checked]:bg-green-500"
            />
          </div>

          {/* Smart CV Channel */}
          <div 
            className={cn(
              "flex items-center justify-between px-3 py-2.5 rounded-md",
              cvEnabled ? "bg-purple-50" : "bg-gray-50"
            )}
          >
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center",
                cvEnabled ? "bg-purple-100" : "bg-gray-100"
              )}>
                <FileText className={cn(
                  "w-4 h-4",
                  cvEnabled ? "text-purple-600" : "text-gray-400"
                )} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Smart CV</p>
                <p className={cn(
                  "text-xs",
                  cvEnabled ? "text-purple-600" : "text-gray-400"
                )}>
                  {cvEnabled ? "Actief" : "Inactief"}
                </p>
              </div>
            </div>
            <Switch
              checked={cvEnabled}
              disabled={disabled}
              onCheckedChange={onToggleCv}
              className="data-[state=checked]:bg-green-500"
            />
          </div>
        </div>
        
        {!isOnline && (
          <div className="px-3 pb-3">
            <p className="text-xs text-gray-400 text-center">
              Activeer een kanaal om de agent online te zetten
            </p>
          </div>
        )}
      </PopoverContent>
      </Popover>
    </div>
  )
}
