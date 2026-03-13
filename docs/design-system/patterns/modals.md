# Modal & Dialog Patterns

Guidelines and patterns for using dialogs, sheets, and popovers in the Taloo application.

## Dialog (Modal)

### Basic Dialog

```tsx
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

<Dialog>
  <DialogTrigger asChild>
    <Button>Open Dialog</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Dialog Title</DialogTitle>
      <DialogDescription>
        Optional description text for the dialog
      </DialogDescription>
    </DialogHeader>

    {/* Dialog content */}
    <div className="py-4">
      <p>Dialog content goes here</p>
    </div>

    <DialogFooter>
      <Button variant="outline">Cancel</Button>
      <Button>Confirm</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Controlled Dialog

```tsx
const [isOpen, setIsOpen] = useState(false);

<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogTrigger asChild>
    <Button>Open</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Controlled Dialog</DialogTitle>
    </DialogHeader>
    <div className="py-4">
      <p>Content</p>
    </div>
    <DialogFooter>
      <Button onClick={() => setIsOpen(false)}>Close</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Dialog Sizes

```tsx
// Small dialog (default max-w-md)
<DialogContent className="max-w-md">

// Medium dialog
<DialogContent className="max-w-2xl">

// Large dialog
<DialogContent className="max-w-4xl">

// Full-width with max
<DialogContent className="max-w-6xl">
```

## Common Dialog Patterns

### Confirmation Dialog

```tsx
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent className="max-w-md">
    <DialogHeader>
      <DialogTitle>Weet je het zeker?</DialogTitle>
      <DialogDescription>
        Deze actie kan niet ongedaan gemaakt worden.
      </DialogDescription>
    </DialogHeader>

    <DialogFooter>
      <Button variant="outline" onClick={() => setIsOpen(false)}>
        Annuleren
      </Button>
      <Button variant="destructive" onClick={handleDelete}>
        Verwijderen
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Form Dialog

```tsx
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent className="max-w-2xl">
    <DialogHeader>
      <DialogTitle>Nieuwe vacature</DialogTitle>
      <DialogDescription>
        Vul de onderstaande gegevens in
      </DialogDescription>
    </DialogHeader>

    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Titel</Label>
        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Beschrijving</Label>
        <Textarea id="description" rows={4} />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
          Annuleren
        </Button>
        <Button type="submit">
          Opslaan
        </Button>
      </DialogFooter>
    </form>
  </DialogContent>
</Dialog>
```

### Alert Dialog

```tsx
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent className="max-w-md">
    <DialogHeader>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
          <AlertTriangle className="w-5 h-5 text-red-600" />
        </div>
        <div>
          <DialogTitle>Fout opgetreden</DialogTitle>
          <DialogDescription className="mt-1">
            Er is een fout opgetreden bij het verwerken van je verzoek
          </DialogDescription>
        </div>
      </div>
    </DialogHeader>

    <DialogFooter>
      <Button onClick={() => setIsOpen(false)}>
        Sluiten
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Loading Dialog

```tsx
<Dialog open={isLoading}>
  <DialogContent className="max-w-sm">
    <div className="flex flex-col items-center justify-center py-6">
      <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full mb-4"></div>
      <p className="text-sm font-medium">Aan het verwerken...</p>
      <p className="text-xs text-gray-500 mt-2">Dit kan even duren</p>
    </div>
  </DialogContent>
</Dialog>
```

### Success Dialog

```tsx
<Dialog open={showSuccess} onOpenChange={setShowSuccess}>
  <DialogContent className="max-w-md">
    <div className="flex flex-col items-center justify-center py-6">
      <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
        <CheckCircle className="w-8 h-8 text-green-600" />
      </div>
      <DialogTitle className="text-center mb-2">Succesvol!</DialogTitle>
      <DialogDescription className="text-center">
        De vacature is succesvol aangemaakt
      </DialogDescription>
      <Button className="mt-6" onClick={() => setShowSuccess(false)}>
        Sluiten
      </Button>
    </div>
  </DialogContent>
</Dialog>
```

## Sheet (Side Panel)

### Basic Sheet

```tsx
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';

<Sheet>
  <SheetTrigger asChild>
    <Button>Open Sheet</Button>
  </SheetTrigger>
  <SheetContent side="right">
    <SheetHeader>
      <SheetTitle>Sheet Title</SheetTitle>
      <SheetDescription>Optional description</SheetDescription>
    </SheetHeader>

    <div className="py-6">
      {/* Sheet content */}
    </div>
  </SheetContent>
</Sheet>
```

### Sheet Sides

```tsx
// From right (default)
<SheetContent side="right">

// From left
<SheetContent side="left">

// From top
<SheetContent side="top">

// From bottom
<SheetContent side="bottom">
```

### Detail Sheet

```tsx
<Sheet open={isOpen} onOpenChange={setIsOpen}>
  <SheetContent side="right" className="w-full sm:max-w-[720px]">
    <SheetHeader>
      <SheetTitle>{vacancy.title}</SheetTitle>
      <SheetDescription>
        {formatDate(vacancy.createdAt)}
      </SheetDescription>
    </SheetHeader>

    <div className="space-y-6 py-6">
      <div>
        <h3 className="font-semibold mb-2">Status</h3>
        <StatusBadge isOnline={vacancy.isOnline} />
      </div>

      <div>
        <h3 className="font-semibold mb-2">Kanalen</h3>
        <ChannelIcons channels={vacancy.channels} />
      </div>

      <div>
        <h3 className="font-semibold mb-2">Beschrijving</h3>
        <p className="text-sm text-gray-600">{vacancy.description}</p>
      </div>
    </div>

    <div className="flex gap-3 pt-6 border-t">
      <Button variant="outline" className="flex-1" onClick={() => setIsOpen(false)}>
        Sluiten
      </Button>
      <Button className="flex-1" onClick={handleEdit}>
        Bewerken
      </Button>
    </div>
  </SheetContent>
</Sheet>
```

### Filter Sheet (Mobile)

```tsx
<Sheet>
  <SheetTrigger asChild>
    <Button variant="outline" size="sm">
      <Filter className="w-4 h-4 mr-2" />
      Filters
    </Button>
  </SheetTrigger>
  <SheetContent side="bottom" className="h-[80vh]">
    <SheetHeader>
      <SheetTitle>Filters</SheetTitle>
    </SheetHeader>

    <div className="space-y-6 py-6">
      <div className="space-y-2">
        <Label>Status</Label>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle</SelectItem>
            <SelectItem value="active">Actief</SelectItem>
            <SelectItem value="draft">Concept</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* More filters */}
    </div>

    <div className="flex gap-3 pt-6 border-t">
      <Button variant="outline" className="flex-1" onClick={handleReset}>
        Reset
      </Button>
      <Button className="flex-1">
        Toepassen
      </Button>
    </div>
  </SheetContent>
</Sheet>
```

## Popover

### Basic Popover

```tsx
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';

<Popover>
  <PopoverTrigger asChild>
    <Button variant="outline">Open Popover</Button>
  </PopoverTrigger>
  <PopoverContent className="w-80">
    <div className="space-y-2">
      <h4 className="font-semibold">Popover Title</h4>
      <p className="text-sm text-gray-500">
        Popover content goes here
      </p>
    </div>
  </PopoverContent>
</Popover>
```

### Menu Popover

```tsx
<Popover>
  <PopoverTrigger asChild>
    <Button variant="ghost" size="icon">
      <MoreVertical className="w-4 h-4" />
    </Button>
  </PopoverTrigger>
  <PopoverContent className="w-48 p-0" align="end">
    <div className="py-1">
      <button className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100">
        Bewerken
      </button>
      <button className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100">
        Dupliceren
      </button>
      <button className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">
        Verwijderen
      </button>
    </div>
  </PopoverContent>
</Popover>
```

### Info Popover

```tsx
<Popover>
  <PopoverTrigger asChild>
    <Button variant="ghost" size="icon" className="h-5 w-5">
      <Info className="w-4 h-4 text-gray-400" />
    </Button>
  </PopoverTrigger>
  <PopoverContent className="w-72">
    <div className="space-y-2">
      <h4 className="font-semibold text-sm">Info</h4>
      <p className="text-xs text-gray-600">
        This feature helps you manage your vacancies more effectively
      </p>
    </div>
  </PopoverContent>
</Popover>
```

### Status Popover

```tsx
<Popover>
  <PopoverTrigger asChild>
    <Button variant="outline" size="sm">
      <StatusBadge isOnline={vacancy.isOnline} />
    </Button>
  </PopoverTrigger>
  <PopoverContent className="w-64">
    <div className="space-y-3">
      <h4 className="font-semibold text-sm">Status wijzigen</h4>
      <div className="space-y-2">
        <button
          onClick={() => handleStatusChange(true)}
          className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 flex items-center gap-2"
        >
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
          <span className="text-sm">Online</span>
        </button>
        <button
          onClick={() => handleStatusChange(false)}
          className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 flex items-center gap-2"
        >
          <div className="w-2 h-2 rounded-full bg-gray-400"></div>
          <span className="text-sm">Offline</span>
        </button>
      </div>
    </div>
  </PopoverContent>
</Popover>
```

## Best Practices

### Dialog Best Practices

**Do:**
- Use dialogs for important decisions or information
- Keep dialog content focused and concise
- Provide clear primary and secondary actions
- Use appropriate sizes (don't make dialogs too wide)
- Show loading states during async operations
- Close dialogs on successful actions

**Don't:**
- Nest dialogs (avoid dialog within dialog)
- Make dialogs too complex (consider a full page instead)
- Use dialogs for non-critical information
- Hide close button (always allow escape)
- Make dialog content scrollable if avoidable

### Sheet Best Practices

**Do:**
- Use sheets for detail views and filters
- Slide from right for detail panels
- Slide from bottom for mobile filters
- Keep content organized with sections
- Provide clear action buttons

**Don't:**
- Use sheets for critical confirmations (use dialog)
- Make sheet content too wide
- Forget to handle mobile breakpoints
- Use sheets when a popover would suffice

### Popover Best Practices

**Do:**
- Use popovers for contextual menus and info
- Keep popover content concise
- Position appropriately (align="start", align="end")
- Close popover after action

**Don't:**
- Put complex forms in popovers (use dialog or sheet)
- Make popovers too wide
- Use for critical actions (use dialog)
- Nest popovers

## Accessibility

### Dialog Accessibility

```tsx
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent aria-describedby="dialog-description">
    <DialogHeader>
      <DialogTitle id="dialog-title">
        Dialog Title
      </DialogTitle>
      <DialogDescription id="dialog-description">
        Description text
      </DialogDescription>
    </DialogHeader>
    {/* content */}
  </DialogContent>
</Dialog>
```

### Keyboard Navigation

- `Escape` key closes dialogs/sheets/popovers
- `Tab` cycles through focusable elements
- Focus trap keeps focus within dialog
- Return focus to trigger element on close

### Focus Management

```tsx
// Auto-focus first input in dialog
<Input autoFocus />

// Set initial focus
<DialogContent onOpenAutoFocus={(e) => {
  e.preventDefault();
  buttonRef.current?.focus();
}}>
```
