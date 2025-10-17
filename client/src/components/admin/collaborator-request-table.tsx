import { useMemo, useState } from "react";
import type {
  SortingState,
  PaginationState,
  ColumnDef,
} from "@tanstack/react-table";
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export type AdminCollaboratorRequestRow = {
  id: string;
  user_id: string;
  username: string;
  email: string;
  organization: string;
  position: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  updated_at: string;
  admin_notes?: string;
};

type CollaboratorRequestTableProps = {
  requests: AdminCollaboratorRequestRow[];
  onApprove: (request: AdminCollaboratorRequestRow) => void;
  onReject: (request: AdminCollaboratorRequestRow) => void;
  onViewDetails: (request: AdminCollaboratorRequestRow) => void;
  pageSizeOptions?: number[];
};

const DEFAULT_PAGE_SIZE = 10;

const FILTER_INPUT_CLASS =
  "h-11 rounded-xl border border-white/10 bg-slate-950/40 px-4 text-sm text-white placeholder:text-slate-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition focus:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-300/25";
const SELECT_TRIGGER_CLASS =
  "h-11 w-full rounded-xl border border-white/10 bg-slate-950/40 px-4 text-sm text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition focus:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-300/25 sm:w-56";
const SELECT_CONTENT_CLASS =
  "border border-white/10 bg-slate-900/90 text-slate-100 backdrop-blur-xl shadow-[0_32px_80px_-48px_rgba(16,185,129,0.5)]";
const SELECT_ITEM_CLASS =
  "relative cursor-pointer rounded-lg px-3 py-2 text-sm text-slate-200 transition data-[highlighted]:bg-emerald-500/20 data-[highlighted]:text-white data-[disabled]:opacity-50";
const ROWS_PER_PAGE_LABEL_CLASS =
  "text-[11px] uppercase tracking-[0.25em] text-emerald-100/70";
const TABLE_CONTAINER_CLASS =
  "overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl shadow-[0_32px_80px_-48px_rgba(16,185,129,0.65)]";
const TABLE_HEADER_CLASS =
  "bg-white/[0.02] text-[11px] font-semibold uppercase tracking-[0.25em] text-emerald-100/70";
const TABLE_CELL_TEXT_CLASS = "text-sm text-slate-200";
const TABLE_MUTED_TEXT_CLASS = "text-sm text-slate-400";
const ACTION_BUTTON_CLASS =
  "h-9 rounded-lg border border-white/20 bg-white/10 px-4 text-sm font-medium text-emerald-100/90 shadow-[0_12px_30px_-20px_rgba(16,185,129,0.8)] transition hover:border-emerald-300/70 hover:bg-white/20 hover:text-white";
const SUCCESS_BUTTON_CLASS =
  "h-9 rounded-lg border border-emerald-500/30 bg-emerald-500/15 px-4 text-sm font-medium text-emerald-100 shadow-[0_12px_30px_-20px_rgba(16,185,129,0.8)] transition hover:border-emerald-400/60 hover:bg-emerald-500/20 hover:text-white";
const DANGER_BUTTON_CLASS =
  "h-9 rounded-lg border border-rose-500/30 bg-rose-500/15 px-4 text-sm font-medium text-rose-100 shadow-[0_12px_30px_-20px_rgba(244,63,94,0.8)] transition hover:border-rose-400/60 hover:bg-rose-500/20 hover:text-white";
const PAGINATION_BUTTON_CLASS =
  "h-9 rounded-lg border border-white/15 bg-white/10 px-4 text-xs font-medium uppercase tracking-[0.2em] text-emerald-100/80 transition hover:border-emerald-300/60 hover:bg-white/20 hover:text-white disabled:opacity-40";

function getStatusBadge(status: string) {
  switch (status) {
    case "pending":
      return (
        <Badge
          variant="outline"
          className="border-yellow-400/30 bg-yellow-400/10 text-yellow-100"
        >
          Pending
        </Badge>
      );
    case "approved":
      return (
        <Badge
          variant="outline"
          className="border-emerald-400/30 bg-emerald-400/10 text-emerald-100"
        >
          Approved
        </Badge>
      );
    case "rejected":
      return (
        <Badge
          variant="outline"
          className="border-rose-400/30 bg-rose-400/10 text-rose-100"
        >
          Rejected
        </Badge>
      );
    default:
      return <span className={TABLE_MUTED_TEXT_CLASS}>—</span>;
  }
}

function CollaboratorRequestActionsCell({
  request,
  onApprove,
  onReject,
  onViewDetails,
}: {
  request: AdminCollaboratorRequestRow;
  onApprove: CollaboratorRequestTableProps["onApprove"];
  onReject: CollaboratorRequestTableProps["onReject"];
  onViewDetails: CollaboratorRequestTableProps["onViewDetails"];
}) {
  return (
    <div className="flex justify-end gap-2">
      <Button
        variant="outline"
        size="sm"
        className={ACTION_BUTTON_CLASS}
        onClick={() => onViewDetails(request)}
      >
        View
      </Button>
      {request.status === "pending" && (
        <>
          <Button
            variant="outline"
            size="sm"
            className={SUCCESS_BUTTON_CLASS}
            onClick={() => onApprove(request)}
          >
            Approve
          </Button>
          <Button
            variant="destructive"
            size="sm"
            className={DANGER_BUTTON_CLASS}
            onClick={() => onReject(request)}
          >
            Reject
          </Button>
        </>
      )}
    </div>
  );
}

export default function CollaboratorRequestTable({
  requests,
  onApprove,
  onReject,
  onViewDetails,
  pageSizeOptions = [5, 10, 20, 50],
}: CollaboratorRequestTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sorting, setSorting] = useState<SortingState>([
    { id: "created_at", desc: true },
  ]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: DEFAULT_PAGE_SIZE,
  });

  const filteredRequests = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return requests.filter((request) => {
      if (statusFilter !== "all" && request.status !== statusFilter) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const haystack = [
        request.username,
        request.email,
        request.organization,
        request.position,
        request.reason,
      ]
        .map((value) => value?.toLowerCase?.() ?? "")
        .join(" ");

      return haystack.includes(normalizedSearch);
    });
  }, [requests, searchTerm, statusFilter]);

  const columns = useMemo<ColumnDef<AdminCollaboratorRequestRow>[]>(
    () => [
      {
        id: "user",
        header: () => "User",
        accessorFn: (row) => row.username,
        cell: ({ row }) => (
          <div>
            <p className="text-sm font-semibold text-white">
              {row.original.username}
            </p>
            <p className="text-xs text-slate-400">{row.original.email}</p>
          </div>
        ),
      },
      {
        id: "organization",
        header: () => "Organization",
        accessorFn: (row) => row.organization,
        cell: ({ row }) => (
          <div>
            <p className="text-sm font-semibold text-white">
              {row.original.organization}
            </p>
            <p className="text-xs text-slate-400">{row.original.position}</p>
          </div>
        ),
      },
      {
        id: "status",
        header: () => "Status",
        accessorFn: (row) => row.status,
        cell: ({ getValue }) => getStatusBadge(getValue<string>()),
      },
      {
        id: "created_at",
        header: () => "Submitted",
        accessorFn: (row) => row.created_at,
        cell: ({ getValue }) => {
          const date = new Date(getValue<string>());
          return (
            <span className={TABLE_CELL_TEXT_CLASS}>
              {date.toLocaleDateString()}
            </span>
          );
        },
      },
      {
        id: "actions",
        header: () => null,
        cell: ({ row }) => (
          <CollaboratorRequestActionsCell
            request={row.original}
            onApprove={onApprove}
            onReject={onReject}
            onViewDetails={onViewDetails}
          />
        ),
        enableSorting: false,
      },
    ],
    [onApprove, onReject, onViewDetails]
  );

  const table = useReactTable({
    data: filteredRequests,
    columns,
    state: {
      sorting,
      pagination,
    },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: false,
  });

  const pageCount = table.getPageCount();
  const currentPage = table.getState().pagination.pageIndex + 1;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          <Input
            value={searchTerm}
            onChange={(event) => {
              setSearchTerm(event.target.value);
              setPagination((prev) => ({ ...prev, pageIndex: 0 }));
            }}
            placeholder="Search by name, email, or organization"
            className={FILTER_INPUT_CLASS}
          />
          <Select
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value);
              setPagination((prev) => ({ ...prev, pageIndex: 0 }));
            }}
          >
            <SelectTrigger className={SELECT_TRIGGER_CLASS}>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent className={SELECT_CONTENT_CLASS}>
              <SelectItem className={SELECT_ITEM_CLASS} value="all">
                All statuses
              </SelectItem>
              <SelectItem className={SELECT_ITEM_CLASS} value="pending">
                Pending
              </SelectItem>
              <SelectItem className={SELECT_ITEM_CLASS} value="approved">
                Approved
              </SelectItem>
              <SelectItem className={SELECT_ITEM_CLASS} value="rejected">
                Rejected
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2 self-start">
          <span className={ROWS_PER_PAGE_LABEL_CLASS}>Rows per page</span>
          <Select
            value={String(pagination.pageSize)}
            onValueChange={(value) =>
              setPagination({ pageIndex: 0, pageSize: Number(value) })
            }
          >
            <SelectTrigger className={`${SELECT_TRIGGER_CLASS} w-32`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className={SELECT_CONTENT_CLASS}>
              {pageSizeOptions.map((size) => (
                <SelectItem
                  key={size}
                  value={String(size)}
                  className={SELECT_ITEM_CLASS}
                >
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className={TABLE_CONTAINER_CLASS}>
        <Table>
          <TableHeader className={TABLE_HEADER_CLASS}>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const isSortable = header.column.getCanSort();
                  const sortStatus = header.column.getIsSorted();
                  return (
                    <TableHead
                      key={header.id}
                      className={`px-4 py-3 text-xs font-medium text-emerald-100/80 ${
                        header.id === "actions"
                          ? "text-right"
                          : "cursor-pointer select-none"
                      }`}
                      onClick={
                        isSortable
                          ? header.column.getToggleSortingHandler()
                          : undefined
                      }
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                      {isSortable ? (
                        <span className="ml-2 text-[10px] text-emerald-200/60">
                          {sortStatus === "asc"
                            ? "▲"
                            : sortStatus === "desc"
                            ? "▼"
                            : ""}
                        </span>
                      ) : null}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody className="divide-y divide-white/5">
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="hover:bg-white/10">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={`px-4 py-3 ${TABLE_CELL_TEXT_CLASS} ${
                        cell.column.id === "actions" ? "text-right" : ""
                      }`}
                    >
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
                  className="px-4 py-8 text-center text-sm text-slate-400"
                >
                  No collaborator requests found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col items-center justify-between gap-3 text-xs text-slate-400 sm:flex-row">
        <span>
          Showing{" "}
          {table.getState().pagination.pageIndex *
            table.getState().pagination.pageSize +
            1}
          -
          {Math.min(
            (table.getState().pagination.pageIndex + 1) *
              table.getState().pagination.pageSize,
            filteredRequests.length
          )}{" "}
          of {filteredRequests.length} requests
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className={PAGINATION_BUTTON_CLASS}
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <span>
            Page {currentPage} of {Math.max(pageCount, 1)}
          </span>
          <Button
            variant="outline"
            size="sm"
            className={PAGINATION_BUTTON_CLASS}
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
