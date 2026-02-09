# Card Patterns

Guidelines and patterns for using cards in the Taloo application.

## Basic Card Structure

### Standard Card

```tsx
import { Card } from '@/components/ui/card';

<Card className="p-5">
  <h3 className="text-lg font-semibold mb-2">Card Title</h3>
  <p className="text-sm text-gray-500">Card description or content</p>
</Card>
```

### Card with Header

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Supporting description text</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Main content goes here</p>
  </CardContent>
</Card>
```

### Card with Footer

```tsx
<Card>
  <CardHeader>
    <CardTitle>Settings</CardTitle>
  </CardHeader>
  <CardContent>
    <p>Configure your preferences</p>
  </CardContent>
  <CardFooter className="flex justify-end gap-3">
    <Button variant="outline">Cancel</Button>
    <Button>Save</Button>
  </CardFooter>
</Card>
```

## Metric Cards

### Using MetricCard Component

```tsx
import { MetricCard } from '@/components/kit/metric-card';

// Simple metric
<MetricCard
  variant="blue"
  title="Total Applicanten"
  value={145}
/>

// With change indicator
<MetricCard
  variant="lime"
  title="Conversies"
  value={89}
  change={12.5}  // Percentage
/>

// With sparkline
<MetricCard variant="blue">
  <div className="flex items-center justify-between">
    <div>
      <p className="text-sm font-medium">Sollicitaties</p>
      <p className="text-2xl font-bold">234</p>
    </div>
    <Sparkline data={[100, 120, 150, 180, 210, 234]} />
  </div>
</MetricCard>
```

### Metric Card Grid

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  <MetricCard variant="blue" title="Total" value={450} />
  <MetricCard variant="lime" title="Actief" value={234} change={12.5} />
  <MetricCard variant="orange" title="Wachtend" value={89} />
  <MetricCard variant="dark" title="Gearchiveerd" value={127} />
</div>
```

## Interactive Cards

### Clickable Card

```tsx
<Card
  className="p-5 cursor-pointer hover:bg-gray-50 transition-colors"
  onClick={() => navigate('/detail')}
>
  <h3 className="font-semibold mb-1">Software Engineer</h3>
  <p className="text-sm text-gray-500">Amsterdam · Full-time</p>
</Card>
```

### Card with Hover Effect

```tsx
<Card className="p-5 transition-shadow duration-300 hover:shadow-lg">
  <h3 className="font-semibold">Feature Card</h3>
  <p className="text-sm text-gray-500 mt-2">
    Hover to see elevation effect
  </p>
</Card>
```

### Selectable Card

```tsx
<Card
  className={cn(
    "p-5 cursor-pointer border-2 transition-colors",
    isSelected ? "border-blue-500 bg-blue-50" : "border-transparent hover:bg-gray-50"
  )}
  onClick={() => setSelected(true)}
>
  <div className="flex items-center justify-between">
    <h3 className="font-semibold">Option 1</h3>
    {isSelected && <Check className="w-5 h-5 text-blue-600" />}
  </div>
  <p className="text-sm text-gray-500 mt-2">Description</p>
</Card>
```

## Content Cards

### Article Card

```tsx
<Card className="overflow-hidden">
  <img
    src="/article-image.jpg"
    alt="Article"
    className="w-full h-48 object-cover"
  />
  <div className="p-5 space-y-2">
    <Badge>Category</Badge>
    <h3 className="text-lg font-semibold">Article Title</h3>
    <p className="text-sm text-gray-500">
      Article preview text goes here...
    </p>
    <div className="flex items-center gap-2 text-xs text-gray-500 pt-2">
      <Calendar className="w-4 h-4" />
      <span>12 jan 2026</span>
    </div>
  </div>
</Card>
```

### Profile Card

```tsx
<Card className="p-5">
  <div className="flex items-center gap-4">
    <Avatar className="h-16 w-16">
      <AvatarImage src="/avatar.jpg" />
      <AvatarFallback>JD</AvatarFallback>
    </Avatar>
    <div className="flex-1">
      <h3 className="font-semibold">Jan de Vries</h3>
      <p className="text-sm text-gray-500">Software Engineer</p>
      <p className="text-xs text-gray-400">Amsterdam</p>
    </div>
    <Button size="sm">View</Button>
  </div>
</Card>
```

### Stats Card

```tsx
<Card className="p-5">
  <div className="flex items-center justify-between mb-4">
    <h3 className="font-semibold">Statistieken</h3>
    <TrendingUp className="w-5 h-5 text-green-600" />
  </div>
  <div className="space-y-3">
    <div className="flex justify-between">
      <span className="text-sm text-gray-500">Sollicitaties</span>
      <span className="text-sm font-medium">234</span>
    </div>
    <div className="flex justify-between">
      <span className="text-sm text-gray-500">Gesprekken</span>
      <span className="text-sm font-medium">89</span>
    </div>
    <div className="flex justify-between">
      <span className="text-sm text-gray-500">Aannamen</span>
      <span className="text-sm font-medium">12</span>
    </div>
  </div>
</Card>
```

## Collapsible Card (CollapseBox)

Use the kit component `CollapseBox` for expandable card content with a consistent header and optional footer link.

```tsx
import { CollapseBox } from '@/components/kit/collapse-box';
import { FileText } from 'lucide-react';

<CollapseBox
  title="Vacaturetekst"
  icon={FileText}
  defaultOpen={false}
  contentMaxHeight="400px"
  footerLink={{ href: '/external', label: 'Bekijk in Salesforce' }}
>
  <div className="text-sm text-gray-600 prose prose-sm max-w-none">
    <h3 className="font-semibold text-gray-800">Over deze job</h3>
    <p>...</p>
    <ul className="list-disc list-inside">...</ul>
  </div>
</CollapseBox>
```

**When to use:** Long text (vacancy descriptions, terms, context) that should be expandable to save space; optional external link in footer.

## List Cards

### Card List Layout

```tsx
<div className="space-y-3">
  {items.map((item) => (
    <Card key={item.id} className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h4 className="font-semibold">{item.title}</h4>
          <p className="text-sm text-gray-500">{item.description}</p>
        </div>
        <Button size="sm" variant="ghost">
          View
        </Button>
      </div>
    </Card>
  ))}
</div>
```

### Compact List Card

```tsx
<Card className="divide-y">
  {items.map((item) => (
    <div key={item.id} className="p-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium">{item.name}</p>
          <p className="text-sm text-gray-500">{item.status}</p>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-400" />
      </div>
    </div>
  ))}
</Card>
```

## Status Cards

### Alert Card

```tsx
<Card className="p-4 border-amber-200 bg-amber-50">
  <div className="flex gap-3">
    <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
    <div>
      <h4 className="font-semibold text-amber-900">Let op</h4>
      <p className="text-sm text-amber-800 mt-1">
        Er zijn nog 3 vacatures die aandacht nodig hebben
      </p>
    </div>
  </div>
</Card>
```

### Success Card

```tsx
<Card className="p-4 border-green-200 bg-green-50">
  <div className="flex gap-3">
    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
    <div>
      <h4 className="font-semibold text-green-900">Succesvol</h4>
      <p className="text-sm text-green-800 mt-1">
        Alle vacatures zijn gepubliceerd
      </p>
    </div>
  </div>
</Card>
```

### Error Card

```tsx
<Card className="p-4 border-red-200 bg-red-50">
  <div className="flex gap-3">
    <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
    <div>
      <h4 className="font-semibold text-red-900">Fout</h4>
      <p className="text-sm text-red-800 mt-1">
        Er is een fout opgetreden bij het laden
      </p>
    </div>
  </div>
</Card>
```

## Specialized Cards

### Feature Card with Icon

```tsx
<Card className="p-6 text-center">
  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
    <Zap className="w-6 h-6 text-blue-600" />
  </div>
  <h3 className="font-semibold mb-2">Feature Name</h3>
  <p className="text-sm text-gray-500">
    Feature description goes here
  </p>
</Card>
```

### Pricing Card

```tsx
<Card className={cn(
  "p-6",
  featured && "border-2 border-blue-500"
)}>
  {featured && (
    <Badge className="mb-4">Most Popular</Badge>
  )}
  <h3 className="text-2xl font-bold mb-2">Pro Plan</h3>
  <div className="mb-4">
    <span className="text-4xl font-bold">€49</span>
    <span className="text-gray-500">/month</span>
  </div>
  <ul className="space-y-2 mb-6">
    <li className="flex items-center gap-2 text-sm">
      <Check className="w-4 h-4 text-green-600" />
      <span>Feature 1</span>
    </li>
    <li className="flex items-center gap-2 text-sm">
      <Check className="w-4 h-4 text-green-600" />
      <span>Feature 2</span>
    </li>
  </ul>
  <Button className="w-full">Get Started</Button>
</Card>
```

### Loading Card

```tsx
<Card className="p-5 animate-pulse">
  <div className="space-y-3">
    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
  </div>
</Card>
```

## Card Layouts

### Two-Column Card Grid

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  <Card className="p-5">
    <h3 className="font-semibold mb-2">Card 1</h3>
    <p className="text-sm text-gray-500">Content</p>
  </Card>
  <Card className="p-5">
    <h3 className="font-semibold mb-2">Card 2</h3>
    <p className="text-sm text-gray-500">Content</p>
  </Card>
</div>
```

### Three-Column Card Grid

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {features.map((feature) => (
    <Card key={feature.id} className="p-5">
      <h3 className="font-semibold mb-2">{feature.title}</h3>
      <p className="text-sm text-gray-500">{feature.description}</p>
    </Card>
  ))}
</div>
```

### Masonry-style Grid (Auto-fit)

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-min">
  {items.map((item) => (
    <Card key={item.id} className="p-5">
      {/* Varying content heights */}
    </Card>
  ))}
</div>
```

## Card Animations

### Entrance Animation

```tsx
<Card className="p-5 animate-[fade-in-up_0.3s_ease-out]">
  <h3 className="font-semibold">Animated Card</h3>
</Card>
```

### Staggered Grid Animation

```tsx
{items.map((item, index) => (
  <Card
    key={item.id}
    className="p-5 animate-[fade-in-up_0.3s_ease-out]"
    style={{ animationDelay: `${index * 50}ms` }}
  >
    <h3 className="font-semibold">{item.title}</h3>
  </Card>
))}
```

## Best Practices

**Do:**
- Use consistent padding (`p-5` for standard cards)
- Apply appropriate hover states for interactive cards
- Use MetricCard for dashboard metrics
- Keep card content focused and scannable
- Use semantic color coding (green for success, red for errors)
- Add appropriate spacing between cards in grids (`gap-4` or `gap-6`)

**Don't:**
- Overcrowd cards with too much content
- Use cards when a simple list would suffice
- Make cards too tall (consider splitting content)
- Use inconsistent padding across similar cards
- Forget hover states on clickable cards
- Nest cards unnecessarily
- Use cards for every piece of content (they add visual weight)

## Accessibility

**Interactive Cards:**
```tsx
<Card
  role="button"
  tabIndex={0}
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick();
    }
  }}
  className="cursor-pointer"
>
  {/* content */}
</Card>
```

**Card with Action:**
```tsx
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>
    <p>Content</p>
  </CardContent>
  <CardFooter>
    <Button aria-label="Learn more about this card">
      Learn More
    </Button>
  </CardFooter>
</Card>
```
