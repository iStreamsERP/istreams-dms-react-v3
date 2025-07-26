import { DataTable } from '@/components/common/DataTable';
import { Button } from '@/components/ui/button';
import { ArrowUpDown, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import type { ColumnDef } from '@tanstack/react-table';
import type { Category } from '@/types';

interface CategoryTableProps {
  categories: Category[];
  loading: boolean;
  error: string | null;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
}

export function CategoryTable({ categories, loading, error, onEdit, onDelete }: CategoryTableProps) {
  const columns: ColumnDef<Category>[] = [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'CATEGORY_NAME',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="p-0 font-semibold hover:bg-muted"
        >
          Category Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div
          className="capitalize"
          title={row.getValue('CATEGORY_NAME') || '-'}
        >
          {row.getValue('CATEGORY_NAME') || '-'}
        </div>
      ),
      enableSorting: true,
      enableHiding: true,
    },
    {
      accessorKey: 'DISPLAY_NAME',
      header: () => <div className="font-semibold">Display Name</div>,
      cell: ({ row }) => (
        <div
          className="capitalize"
          title={row.getValue('DISPLAY_NAME') || '-'}
        >
          {row.getValue('DISPLAY_NAME') || '-'}
        </div>
      ),
      enableSorting: true,
      enableHiding: true,
    },
    {
      accessorKey: 'MODULE_NAME',
      header: () => <div className="font-semibold">Module Name</div>,
      cell: ({ row }) => (
        <div
          className="capitalize"
          title={row.getValue('MODULE_NAME') || '-'}
        >
          {row.getValue('MODULE_NAME') || '-'}
        </div>
      ),
      enableSorting: true,
      enableHiding: true,
    },
    {
      accessorKey: 'SEARCH_TAGS',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="p-0 font-semibold hover:bg-muted"
        >
          Search Tags
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div
          className="capitalize"
          title={row.getValue('SEARCH_TAGS') || '-'}
        >
          {row.getValue('SEARCH_TAGS') || '-'}
        </div>
      ),
      enableSorting: true,
      enableHiding: true,
    },
    {
      id: 'action',
      header: () => <div className="font-semibold">Action</div>,
      cell: ({ row }) => {
        const item = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onEdit(item)}
                className="flex items-center gap-2"
              >
                <Pencil className="h-4 w-4" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                className="flex items-center gap-2 text-destructive"
                onClick={() => onDelete(item)}
              >
                <Trash2 className="h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
      enableSorting: false,
      enableHiding: false,
    },
  ];

  return <DataTable columns={columns} data={categories} loading={loading} error={error} />;
}