import React, { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/frontend/components/ui/table";
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
  FilterFn,
} from "@tanstack/react-table";
import { profileService, SecurityLog } from "../../../../lib/api";
import {
  Activity,
  Calendar,
  Info,
  User,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import LoaderComponent from "../../components/ui/LoaderComponent";
import { Button } from "@/app/frontend/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/frontend/components/ui/select";

const actionTypes = {
  LOGIN: "Login",
  LOGOUT: "Logout",
  PASSWORD_CHANGE: "Password Change",
  EMAIL_CHANGE: "Email Change",
  PROFILE_UPDATE: "Profile Update",
  TWO_FACTOR_ENABLED: "Two Factor Enabled",
  TWO_FACTOR_DISABLED: "Two Factor Disabled",
  TWO_FACTOR_LOGIN: "Two Factor Login",
  DOCUMENT_UPLOAD: "Document Upload",
  DOCUMENT_DELETE: "Document Delete",
  DOCUMENT_DOWNLOAD: "Document Download",
  CHAT_SAVE: "Chat Save",
  CHAT_DELETE: "Chat Delete",
};

// Custom filter function for date range
const dateRangeFilter: FilterFn<SecurityLog> = (row, columnId, filterValue) => {
  const date = new Date(row.getValue(columnId));
  const [startDate, endDate] = filterValue;

  if (startDate && endDate) {
    return date >= startDate && date <= endDate;
  } else if (startDate) {
    return date >= startDate;
  } else if (endDate) {
    return date <= endDate;
  }
  return true;
};

const columns: ColumnDef<SecurityLog>[] = [
  {
    accessorKey: "user.name",
    header: ({ column }) => {
      return (
        <div className="flex items-center gap-1">
          <User className="w-4 h-4" />
          User
        </div>
      );
    },
    cell: ({ row }) => {
      const user = row.original.user;
      return <div className="font-medium">{user.name || user.email}</div>;
    },
    enableSorting: true,
    enableHiding: false,
  },
  {
    accessorKey: "action",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 flex items-center gap-1"
        >
          <Activity className="w-4 h-4" />
          Action
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const action = row.getValue("action") as string;
      const details = row.original.details;
      return (
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium">
            {actionTypes[action as keyof typeof actionTypes] || action}
          </span>
          {details && (
            <span className="text-xs text-muted-foreground max-w-xs truncate">
              {details}
            </span>
          )}
        </div>
      );
    },
    enableSorting: true,
    enableHiding: false,
  },
  {
    accessorKey: "ip_address",
    header: ({ column }) => {
      return (
        <div className="flex items-center gap-1">
          <Info className="w-4 h-4" />
          IP Address
        </div>
      );
    },
    cell: ({ row }) => {
      return (
        <div className="font-mono text-sm">{row.getValue("ip_address")}</div>
      );
    },
    enableSorting: true,
    enableHiding: false,
  },
  {
    accessorKey: "created_at",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 flex items-center gap-1"
        >
          <Calendar className="w-4 h-4" />
          Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const date = new Date(row.getValue("created_at"));
      return (
        <div className="text-sm">
          {date.toLocaleString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      );
    },
    enableSorting: true,
    enableHiding: false,
    filterFn: dateRangeFilter,
  },
];

function SecuritySettings() {
  const [logs, setLogs] = useState<SecurityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sorting, setSorting] = useState<SortingState>([
    {
      id: "created_at",
      desc: true,
    },
  ]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [globalFilter, setGlobalFilter] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<{ start?: Date; end?: Date }>({});

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await profileService.getSecurityLogs();
        setLogs(response.logs);
      } catch (error) {
        console.error("Failed to fetch security logs:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLogs();
  }, []);

  // Apply filters
  const filteredData = React.useMemo(() => {
    let filtered = [...logs];

    // Global filter
    if (globalFilter) {
      filtered = filtered.filter(
        (log) =>
          log.user.email?.toLowerCase().includes(globalFilter.toLowerCase()) ||
          log.action.toLowerCase().includes(globalFilter.toLowerCase()) ||
          log.details?.toLowerCase().includes(globalFilter.toLowerCase())
      );
    }

    // Action filter
    if (actionFilter !== "all") {
      filtered = filtered.filter((log) => log.action === actionFilter);
    }

    // Date range filter
    if (dateRange.start || dateRange.end) {
      filtered = filtered.filter((log) => {
        const logDate = new Date(log.created_at);
        if (dateRange.start && dateRange.end) {
          return logDate >= dateRange.start && logDate <= dateRange.end;
        } else if (dateRange.start) {
          return logDate >= dateRange.start;
        } else if (dateRange.end) {
          return logDate <= dateRange.end;
        }
        return true;
      });
    }

    return filtered;
  }, [logs, globalFilter, actionFilter, dateRange]);

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  const clearFilters = () => {
    setGlobalFilter("");
    setActionFilter("all");
    setDateRange({});
    table.resetColumnFilters();
  };

  return (
    <div className="h-full flex flex-col">
      <div className="rounded border border-tertiary mx-4 mb-5 flex-1 flex flex-col overflow-hidden">
        {/* Filters Section */}
        <div className="p-4 space-y-4 border-b border-tertiary">
          <div className="flex justify-between gap-4">
            {/* Action Filter */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Action Type</label>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Select action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  {Object.entries(actionTypes).map(([key, value]) => (
                    <SelectItem key={key} value={key}>
                      {value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="text-xs"
              >
                Clear All Filters
              </Button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="p-4 flex-1 overflow-auto">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    No results found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-tertiary flex-shrink-0">
          <div className="p-2">
            <p className="text-sm text-muted-foreground">
              Showing {table.getFilteredRowModel().rows.length} of {logs.length}{" "}
              total logs
              {globalFilter && ` (filtered by "${globalFilter}")`}
            </p>
          </div>
          <div className="flex items-center space-x-6 lg:space-x-8">
            <div className="flex w-[100px] items-center justify-center text-sm font-medium">
              Page {table.getState().pagination.pageIndex + 1} of{" "}
              {table.getPageCount()}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to first page</span>
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to previous page</span>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to next page</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to last page</span>
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Summary */}
      </div>
    </div>
  );
}

export default SecuritySettings;
