import { useMemo, useState } from "react";
import type {
  ColumnDef,
  PaginationState,
  SortingState,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type AdminCityRow = {
  id: string;
  user_id: string | null;
  burmese_name: string | null;
  english_name: string;
  address: string | null;
  description: string | null;
  image_urls: string[] | string | null;
  geometry: string | null;
};

type CityTableProps = {
  cities: AdminCityRow[];
  onEdit: (city: AdminCityRow) => void;
  onDelete: (cityId: string) => void;
  pageSizeOptions?: number[];
};

const DEFAULT_PAGE_SIZE = 10;

const FILTER_INPUT_CLASS =
  "h-11 rounded-xl border border-white/10 bg-slate-950/40 px-4 text-sm text-white placeholder:text-slate-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition focus:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-300/25";
const ROWS_PER_PAGE_LABEL_CLASS =
  "text-[11px] uppercase tracking-[0.25em] text-emerald-100/70";
const TABLE_CONTAINER_CLASS =
  "overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl shadow-[0_32px_80px_-48px_rgba(16,185,129,0.65)]";
const SELECT_BASE_CLASS =
  "h-11 rounded-xl border border-white/10 bg-slate-950/40 px-4 text-sm text-white transition focus:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-300/25";
const ACTION_BUTTON_CLASS =
  "h-9 rounded-lg border border-white/20 bg-white/10 px-4 text-sm font-medium text-emerald-100/90 shadow-[0_12px_30px_-20px_rgba(16,185,129,0.8)] transition hover:border-emerald-300/70 hover:bg-white/20 hover:text-white";
const DANGER_BUTTON_CLASS =
  "h-9 rounded-lg border border-rose-500/30 bg-rose-500/15 px-4 text-sm font-medium text-rose-100 shadow-[0_12px_30px_-20px_rgba(244,63,94,0.8)] transition hover:border-rose-400/60 hover:bg-rose-500/20 hover:text-white";
const TABLE_HEADER_CLASS =
  "bg-white/[0.02] text-[11px] font-semibold uppercase tracking-[0.25em] text-emerald-100/70";
const TABLE_CELL_TEXT_CLASS = "text-sm text-slate-200";
const TABLE_MUTED_TEXT_CLASS = "text-sm text-slate-400";
const PAGINATION_BUTTON_CLASS =
  "h-9 rounded-lg border border-white/15 bg-white/10 px-4 text-xs font-medium uppercase tracking-[0.2em] text-emerald-100/80 transition hover:border-emerald-300/60 hover:bg-white/20 hover:text-white disabled:opacity-40";

function resolveCityName(city: AdminCityRow) {
  return city.english_name || city.burmese_name || city.id;
}

function getImageCount(imageValue: AdminCityRow["image_urls"]) {
  if (!imageValue) {
    return 0;
  }
  if (Array.isArray(imageValue)) {
    return imageValue.length;
  }
  try {
    const parsed = JSON.parse(imageValue);
    if (Array.isArray(parsed)) {
      return parsed.length;
    }
  } catch {
    const segments = imageValue.split(",").map((value) => value.trim());
    return segments.filter(Boolean).length;
  }
  return 0;
}

function CityActionsCell({
  city,
  onEdit,
  onDelete,
}: {
  city: AdminCityRow;
  onEdit: CityTableProps["onEdit"];
  onDelete: CityTableProps["onDelete"];
}) {
  return (
    <div className="flex justify-end gap-2">
      <Button
        variant="outline"
        size="sm"
        className={ACTION_BUTTON_CLASS}
        onClick={() => onEdit(city)}
      >
        Edit
      </Button>
      <Button
        variant="destructive"
        size="sm"
        className={DANGER_BUTTON_CLASS}
        onClick={() => onDelete(city.id)}
      >
        Delete
      </Button>
    </div>
  );
}

export default function CityTable({
  cities,
  onEdit,
  onDelete,
  pageSizeOptions = [5, 10, 20, 50],
}: CityTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sorting, setSorting] = useState<SortingState>([
    { id: "name", desc: false },
  ]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: DEFAULT_PAGE_SIZE,
  });

  const filteredCities = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    if (!normalizedSearch) {
      return cities;
    }
    return cities.filter((city) => {
      const haystack = [
        resolveCityName(city),
        city.address ?? "",
        city.description ?? "",
      ]
        .map((value) => value?.toLowerCase?.() ?? "")
        .join(" ");

      return haystack.includes(normalizedSearch);
    });
  }, [cities, searchTerm]);

  const columns = useMemo<ColumnDef<AdminCityRow>[]>(
    () => [
      {
        id: "name",
        header: () => "City",
        accessorFn: (row) => resolveCityName(row),
        cell: ({ row }) => (
          <div>
            <p className="text-sm font-semibold text-white">
              {resolveCityName(row.original)}
            </p>
          </div>
        ),
      },
      {
        id: "address",
        header: () => "Address",
        accessorFn: (row) => row.address ?? "",
        cell: ({ getValue }) => {
          const value = getValue<string>();
          if (!value) {
            return <span className={TABLE_MUTED_TEXT_CLASS}>—</span>;
          }
          return value;
        },
      },
      {
        id: "images",
        header: () => "Images",
        accessorFn: (row) => getImageCount(row.image_urls),
        cell: ({ getValue }) => getValue<number>() ?? 0,
      },
      {
        id: "actions",
        header: () => null,
        cell: ({ row }) => (
          <CityActionsCell
            city={row.original}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ),
        enableSorting: false,
      },
    ],
    [onDelete, onEdit]
  );

  const table = useReactTable({
    data: filteredCities,
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
  });

  const pageCount = table.getPageCount();
  const currentPage = table.getState().pagination.pageIndex + 1;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Input
          value={searchTerm}
          onChange={(event) => {
            setSearchTerm(event.target.value);
            setPagination((prev) => ({ ...prev, pageIndex: 0 }));
          }}
          placeholder="Search by name, address, or description"
          className={`${FILTER_INPUT_CLASS} md:w-96`}
        />
        <div className="flex items-center gap-2 self-start">
          <span className={ROWS_PER_PAGE_LABEL_CLASS}>Rows per page</span>
          <select
            value={String(pagination.pageSize)}
            onChange={(event) =>
              setPagination({
                pageIndex: 0,
                pageSize: Number(event.target.value),
              })
            }
            className={`${SELECT_BASE_CLASS} w-28 bg-slate-900/60`}
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
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
                  className="px-4 py-10 text-center text-sm text-slate-400"
                >
                  No cities found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col items-center justify-between gap-3 text-xs text-slate-400 sm:flex-row">
        <span>
          Page {currentPage} of {pageCount || 1}
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
