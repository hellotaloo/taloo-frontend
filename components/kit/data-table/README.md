# DataTable Component

A flexible, generic data table component built with React Context API for state management. Supports sorting, custom rendering, row selection, and empty states.

## Features

- 🎯 **Generic TypeScript support** - Fully typed with TypeScript generics
- 🔄 **Context-based architecture** - Share state between components seamlessly
- 📊 **Sortable columns** - Built-in sorting with visual indicators
- 🎨 **Custom rendering** - Render any content in table cells
- ✅ **Row selection** - Highlight and track selected rows
- 📭 **Empty states** - Beautiful empty state components
- 🎭 **Flexible styling** - Customize with Tailwind classes

## Basic Usage

```tsx
import {
  DataTable,
  DataTableHeader,
  DataTableBody,
  DataTableEmpty,
} from '@/components/kit/data-table';

interface User {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'inactive';
}

function UsersTable({ users }: { users: User[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const columns = [
    {
      key: 'name',
      header: 'Name',
      className: 'w-full',
    },
    {
      key: 'email',
      header: 'Email',
    },
    {
      key: 'status',
      header: 'Status',
      render: (user: User) => (
        <span className={user.status === 'active' ? 'text-green-600' : 'text-gray-400'}>
          {user.status}
        </span>
      ),
    },
  ];

  return (
    <DataTable
      data={users}
      columns={columns}
      selectedId={selectedId}
      onRowClick={(user) => setSelectedId(user.id)}
    >
      <DataTableHeader />
      <DataTableBody
        emptyState={
          <DataTableEmpty
            title="No users found"
            description="Start by adding your first user"
          />
        }
      />
    </DataTable>
  );
}
```

## Advanced Usage

### Custom Accessor for Sorting

```tsx
const columns = [
  {
    key: 'fullName',
    header: 'Name',
    accessor: (user: User) => `${user.firstName} ${user.lastName}`,
    render: (user: User) => (
      <div>
        <p className="font-medium">{user.firstName} {user.lastName}</p>
        <p className="text-xs text-gray-500">{user.email}</p>
      </div>
    ),
  },
];
```

### Default Sorting

```tsx
<DataTable
  data={users}
  columns={columns}
  defaultSortKey="createdAt"
  defaultSortDirection="desc"
>
  <DataTableHeader />
  <DataTableBody />
</DataTable>
```

### Custom Row Styling

```tsx
<DataTableBody
  rowClassName={(user, index) =>
    user.status === 'inactive' ? 'opacity-50' : ''
  }
/>
```

### Disable Sorting for Specific Columns

```tsx
const columns = [
  {
    key: 'actions',
    header: 'Actions',
    sortable: false, // Disable sorting for this column
    render: (user: User) => <Button>Edit</Button>,
  },
];
```

### Custom Empty State

```tsx
<DataTableBody
  emptyState={
    <DataTableEmpty
      icon={Users}
      title="No team members yet"
      description="Invite your first team member to get started"
      action={
        <Button onClick={() => setInviteDialogOpen(true)}>
          Invite Team Member
        </Button>
      }
    />
  }
/>
```

### Complex Example with All Features

```tsx
import { Users, Mail } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface Application {
  id: string;
  candidateName: string;
  email: string;
  score: number;
  status: 'pending' | 'approved' | 'rejected';
  appliedAt: Date;
}

function ApplicationsTable() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);

  const columns: Column<Application>[] = [
    {
      key: 'candidateName',
      header: 'Candidate',
      className: 'w-full',
      render: (app) => (
        <div>
          <p className="font-medium text-gray-900">{app.candidateName}</p>
          <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
            <Mail className="w-3 h-3" />
            {app.email}
          </p>
        </div>
      ),
      accessor: (app) => app.candidateName, // Sort by name
    },
    {
      key: 'score',
      header: 'Score',
      className: 'text-center',
      render: (app) => (
        <span className="font-semibold text-gray-900">{app.score}%</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (app) => {
        const variants = {
          pending: 'bg-orange-100 text-orange-700',
          approved: 'bg-green-100 text-green-700',
          rejected: 'bg-red-100 text-red-700',
        };
        return (
          <Badge className={variants[app.status]}>
            {app.status}
          </Badge>
        );
      },
    },
    {
      key: 'appliedAt',
      header: 'Applied',
      accessor: (app) => app.appliedAt.getTime(), // Sort by timestamp
      render: (app) => formatDate(app.appliedAt),
    },
    {
      key: 'actions',
      header: '',
      sortable: false,
      className: 'text-right',
      render: (app) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation(); // Prevent row click
            handleViewDetails(app.id);
          }}
        >
          View Details
        </Button>
      ),
    },
  ];

  return (
    <DataTable
      data={applications}
      columns={columns}
      selectedId={selectedId}
      onRowClick={(app) => setSelectedId(app.id)}
      defaultSortKey="score"
      defaultSortDirection="desc"
      keyExtractor={(app) => app.id}
    >
      <DataTableHeader />
      <DataTableBody
        rowClassName={(app) => app.status === 'rejected' ? 'opacity-60' : ''}
        emptyState={
          <DataTableEmpty
            icon={Users}
            title="No applications yet"
            description="Applications will appear here once candidates start applying"
          />
        }
      />
    </DataTable>
  );
}
```

## API Reference

### `<DataTable>`

The root component that provides context to all child components.

**Props:**
- `data: T[]` - Array of data items
- `columns: Column<T>[]` - Column definitions
- `selectedId?: string | null` - ID of the selected row
- `onRowClick?: (item: T, index: number) => void` - Row click handler
- `keyExtractor?: (item: T, index: number) => string` - Function to extract unique key (defaults to `item.id`)
- `defaultSortKey?: string` - Initial sort column key
- `defaultSortDirection?: 'asc' | 'desc'` - Initial sort direction
- `className?: string` - Additional CSS classes

### `Column<T>`

Column definition interface.

**Properties:**
- `key: string` - Unique column identifier
- `header: string` - Column header text
- `className?: string` - CSS classes for column cells
- `sortable?: boolean` - Enable/disable sorting (default: true)
- `render?: (item: T, index: number) => ReactNode` - Custom cell renderer
- `accessor?: (item: T) => any` - Function to extract sort value

### `<DataTableHeader>`

Renders the table header with sortable column headers.

**Props:**
- `className?: string` - Additional CSS classes

### `<DataTableBody>`

Renders the table body with rows and cells.

**Props:**
- `className?: string` - Additional CSS classes for table body
- `rowClassName?: string | ((item: T, index: number) => string)` - CSS classes for rows
- `emptyState?: ReactNode` - Custom empty state component

### `<DataTableEmpty>`

Pre-built empty state component.

**Props:**
- `icon?: LucideIcon` - Icon component (default: Inbox)
- `title?: string` - Main message
- `description?: string` - Secondary message
- `action?: ReactNode` - Call-to-action button or element
- `className?: string` - Additional CSS classes

### `useDataTable<T>()`

Hook to access DataTable context in custom child components.

**Returns:**
- `data: T[]` - Current (sorted) data
- `columns: Column<T>[]` - Column definitions
- `sortKey: string | null` - Current sort column
- `sortDirection: 'asc' | 'desc' | null` - Current sort direction
- `selectedId: string | null` - Selected row ID
- `onSort: (key: string) => void` - Sort handler
- `onRowClick?: (item: T, index: number) => void` - Row click handler
- `keyExtractor: (item: T, index: number) => string` - Key extraction function

## Migration from Inline Tables

### Before (Inline Table)

```tsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
      <TableHead>Email</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {users.map((user) => (
      <TableRow key={user.id} onClick={() => handleClick(user)}>
        <TableCell>{user.name}</TableCell>
        <TableCell>{user.email}</TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

### After (DataTable)

```tsx
<DataTable
  data={users}
  columns={[
    { key: 'name', header: 'Name' },
    { key: 'email', header: 'Email' },
  ]}
  onRowClick={handleClick}
>
  <DataTableHeader />
  <DataTableBody />
</DataTable>
```

## Benefits

1. **Less Boilerplate** - No need to manually map over data
2. **Built-in Sorting** - Automatic sorting with visual indicators
3. **Type Safety** - Full TypeScript support with generics
4. **Consistent UX** - Standardized table behavior across the app
5. **Easy Testing** - Isolated components are easier to test
6. **Reusability** - Use the same component everywhere

## Pattern: Context-Based Composition

This component follows the same pattern as `PromptInput`:

```tsx
// Root provides context
<DataTable {...config}>
  {/* Children consume context */}
  <DataTableHeader />
  <DataTableBody />
</DataTable>
```

This allows for flexible composition while sharing state seamlessly.
