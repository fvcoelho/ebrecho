"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Plus } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface ComboboxProps {
  options: { value: string; label: string }[]
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  className?: string
  allowCustomValue?: boolean
}

export function Combobox({
  options,
  value,
  onValueChange,
  placeholder = "Select option...",
  searchPlaceholder = "Search...",
  emptyMessage = "No option found.",
  className,
  allowCustomValue = true,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [searchValue, setSearchValue] = React.useState("")

  // Filter options based on search
  const filteredOptions = React.useMemo(() => {
    if (!searchValue) return options
    return options.filter(option =>
      option.label.toLowerCase().includes(searchValue.toLowerCase())
    )
  }, [options, searchValue])

  // Check if current value is a custom value (not in options)
  const isCustomValue = value && !options.find(opt => opt.value === value)

  // Display label for the current value
  const displayValue = React.useMemo(() => {
    if (!value) return placeholder
    const option = options.find(opt => opt.value === value)
    return option ? option.label : value
  }, [value, options, placeholder])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
        >
          <span className="truncate">{displayValue}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command shouldFilter={false}>
          <CommandInput 
            placeholder={searchPlaceholder}
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandList>
            {/* Show filtered options */}
            {filteredOptions.length > 0 && (
              <CommandGroup>
                {filteredOptions.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={() => {
                      onValueChange?.(option.value)
                      setOpen(false)
                      setSearchValue("")
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === option.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {option.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            
            {/* Show custom value option if allowed and search value exists */}
            {allowCustomValue && searchValue && (
              <>
                {filteredOptions.length > 0 && <CommandSeparator />}
                <CommandGroup>
                  <CommandItem
                    onSelect={() => {
                      onValueChange?.(searchValue)
                      setOpen(false)
                      setSearchValue("")
                    }}
                    className="text-muted-foreground"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar "{searchValue}" como nova marca
                  </CommandItem>
                </CommandGroup>
              </>
            )}
            
            {/* Show empty message when no options and no search value */}
            {filteredOptions.length === 0 && !searchValue && (
              <CommandEmpty>{emptyMessage}</CommandEmpty>
            )}
            
            {/* Show message when no options match but can add custom */}
            {filteredOptions.length === 0 && searchValue && !allowCustomValue && (
              <CommandEmpty>Nenhuma marca encontrada para "{searchValue}"</CommandEmpty>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}