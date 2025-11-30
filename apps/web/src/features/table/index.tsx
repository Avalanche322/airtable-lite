import { useCallback, useEffect, useMemo, useRef } from "react";

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  Row,
  useReactTable,
} from "@tanstack/react-table";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useVirtualizer } from "@tanstack/react-virtual";
import { getAllItems } from "./services/itemsAPI";
import { Item, ItemsPage } from "./types";
import {
  Box,
  Paper,
  Table as MuiTable,
  TableBody as MuiTableBody,
  TableCell as MuiTableCell,
  TableContainer,
  TableHead as MuiTableHead,
  TableRow as MuiTableRow,
  Typography,
  CircularProgress,
  Container,
} from "@mui/material";
import EditableCell from "./components/EditableCell";
// services functions imported above

const fetchSize = 50;

const Table = () => {
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const columns = useMemo<ColumnDef<Item>[]>(
    () => [
      { accessorKey: "id", header: "ID", size: 60 },
      {
        accessorKey: "title",
        header: "Title",
        cell: (info) => <EditableCell info={info} field="title" />,
      },
      {
        accessorKey: "category",
        header: "Category",
        cell: (info) => <EditableCell info={info} field="category" />,
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: (info) => <EditableCell info={info} field="status" />,
      },
      {
        accessorKey: "priority",
        header: "Priority",
        cell: (info) => <EditableCell info={info} field="priority" />,
      },
      {
        accessorKey: "owner",
        header: "Owner",
        cell: (info) => <EditableCell info={info} field="owner" />,
      },
      {
        accessorKey: "assignee",
        header: "Assignee",
        cell: (info) => <EditableCell info={info} field="assignee" />,
      },
      {
        accessorKey: "score",
        header: "Score",
        cell: (info) => <EditableCell info={info} field="score" />,
      },
      {
        accessorKey: "size",
        header: "Size",
        cell: (info) => <EditableCell info={info} field="size" />,
      },
      {
        accessorKey: "rating",
        header: "Rating",
        cell: (info) => <EditableCell info={info} field="rating" />,
      },
      { accessorKey: "tags", header: "Tags" },
      {
        accessorKey: "comments",
        header: "Comments",
        cell: (info) => <EditableCell info={info} field="comments" />,
      },
      {
        accessorKey: "notes",
        header: "Notes",
        cell: (info) => <EditableCell info={info} field="notes" />,
      },
      {
        accessorKey: "color",
        header: "Color",
        cell: (info) => <EditableCell info={info} field="color" />,
      },
      {
        accessorKey: "source",
        header: "Source",
        cell: (info) => <EditableCell info={info} field="source" />,
      },
      {
        accessorKey: "type",
        header: "Type",
        cell: (info) => <EditableCell info={info} field="type" />,
      },
      {
        accessorKey: "location",
        header: "Location",
        cell: (info) => <EditableCell info={info} field="location" />,
      },
      { accessorKey: "approved", header: "Approved" },
      { accessorKey: "active", header: "Active" },
      {
        accessorKey: "created_at",
        header: "Created At",
        cell: (info) => {
          const v = info.getValue<string | undefined>();
          if (!v) return "";
          return new Date(v).toLocaleString();
        },
        size: 200,
      },
    ],
    [],
  );

  const { data, fetchNextPage, isFetching, isLoading } = useInfiniteQuery<
    ItemsPage,
    Error,
    ItemsPage,
    string[],
    number | null
  >({
    queryKey: ["items"],
    queryFn: async ({ pageParam = null }) => {
      const page = await getAllItems({
        cursor: pageParam as number | null,
        fetchSize,
      });
      return page;
    },
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    refetchOnWindowFocus: false,
  });

  const pages = (data as { pages?: ItemsPage[] })?.pages;
  const flatData = useMemo(
    () => pages?.flatMap((page) => page.items) ?? [],
    [pages],
  );
  const totalDBRowCount = pages?.[0]?.total ?? undefined;
  const totalFetched = flatData.length;

  const fetchMoreOnBottomReached = useCallback(
    (containerRefElement?: HTMLDivElement | null) => {
      if (containerRefElement) {
        const { scrollHeight, scrollTop, clientHeight } = containerRefElement;
        if (scrollHeight - scrollTop - clientHeight < 500 && !isFetching) {
          fetchNextPage();
        }
      }
    },
    [fetchNextPage, isFetching, totalFetched, totalDBRowCount],
  );

  useEffect(() => {
    fetchMoreOnBottomReached(tableContainerRef.current);
  }, [fetchMoreOnBottomReached]);

  const table = useReactTable<Item>({
    data: flatData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualSorting: true,
    debugTable: true,
  });

  const { rows } = table.getRowModel();

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    estimateSize: () => 33,
    getScrollElement: () => tableContainerRef.current,
    measureElement:
      typeof window !== "undefined" &&
      navigator.userAgent.indexOf("Firefox") === -1
        ? (element) => element?.getBoundingClientRect().height
        : undefined,
    overscan: 5,
  });

  if (isLoading) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 2, display: "flex", justifyContent: "flex-end" }}>
        <Typography variant="body1">
          {flatData.length} of {totalDBRowCount ?? "?"} rows fetched
        </Typography>
      </Box>

      <Paper variant="outlined">
        <TableContainer
          onScroll={(e) => fetchMoreOnBottomReached(e.currentTarget)}
          ref={tableContainerRef}
          sx={{ maxHeight: 600 }}
        >
          <MuiTable
          >
            <MuiTableHead
              sx={{ position: "sticky", top: 0, zIndex: 1, backgroundColor: "background.paper" }}
            >
              {table.getHeaderGroups().map((headerGroup) => (
                <MuiTableRow
                  key={headerGroup.id}
                  sx={{ display: "flex", width: "100%" }}
                >
                  {headerGroup.headers.map((header) => (
                    <MuiTableCell
                      key={header.id}
                      sx={{
                        display: "flex",
                        width: header.getSize()
                          ? `${header.getSize()}px`
                          : "auto",
                      }}
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                    </MuiTableCell>
                  ))}
                </MuiTableRow>
              ))}
            </MuiTableHead>

            <MuiTableBody
              sx={{
                height: `${rowVirtualizer.getTotalSize()}px`,
                position: "relative",
                display: "block",
              }}
            >
              {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const row = rows[virtualRow.index] as Row<Item> | undefined;
                if (!row) return null;
                return (
                  <MuiTableRow
                    hover
                    data-index={virtualRow.index}
                    ref={(node: HTMLElement | null) =>
                      rowVirtualizer.measureElement(node)
                    }
                    key={row.id}
                    sx={{
                      display: "flex",
                      position: "absolute",
                      transform: `translateY(${virtualRow.start}px)`,
                      width: "100%",
                    }}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <MuiTableCell
                        key={cell.id}
                        sx={{
                          display: "flex",
                          cursor: "pointer",
                          width: cell.column.getSize()
                            ? `${cell.column.getSize()}px`
                            : "auto",
                        }}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </MuiTableCell>
                    ))}
                  </MuiTableRow>
                );
              })}
            </MuiTableBody>
          </MuiTable>
        </TableContainer>
      </Paper>

      {isFetching && (
        <Box mt={1} display="flex" alignItems="center" gap={1}>
          <CircularProgress size={16} />
          <Typography variant="body2">Fetching more...</Typography>
        </Box>
      )}
    </Container>
  );
};

export default Table;
