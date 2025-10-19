import React, { useMemo, useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getGroupedRowModel,
  getExpandedRowModel,
  //getAggregatedRowModel,
  flexRender
} from '@tanstack/react-table';

const ModernDataTable1 = ({ data }) => {
  const [columnVisibility, setColumnVisibility] = useState({});
  const [sorting, setSorting] = useState([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [expandedRowId, setExpandedRowId] = useState(null);

  const columns = useMemo(() => [
    { accessorKey: 'Zone', header: 'Zone' },
    { accessorKey: 'Location', header: 'Location' },
    { accessorKey: 'Vehicle Number', header: 'Vehicle Number' },
    //{ accessorKey: 'Transporter', header: 'Transporter' },
    //{ accessorKey: 'Invoice No', header: 'Invoice No' },
    //{ accessorKey: 'Load No', header: 'Load No' },
    { accessorKey: 'Route No', header: 'Route No' },
    //{ accessorKey: 'Trip Status', header: 'Trip Status' },
    { accessorKey: 'Trip Name', header: 'Trip Name' },
    //{ accessorKey: 'Driver Name', header: 'Driver Name' },
   //{ accessorKey: 'From Datetime', header: 'From Datetime' },
    //{ accessorKey: 'Start Location', header: 'Start Location' },
    //{ accessorKey: 'Speed (Km/Hr)', header: 'Speed (Km/Hr)' },
    //{ accessorKey: 'To Datetime', header: 'To Datetime' },
    //{ accessorKey: 'End Location', header: 'End Location' },
    //{ accessorKey: 'Speed (Km/Hr)2', header: 'Speed (Km/Hr)2' },
    //{ accessorKey: 'Distance', header: 'Distance' },
    //{ accessorKey: 'Duration (HH:MM)', header: 'Duration (HH:MM)' },
    //{ accessorKey: 'Remark', header: 'Remark' },
    //{ accessorKey: 'Action Performed', header: 'Action Performed' },
    { accessorKey: 'Duration (min)', header: 'Duration (min)' },
    //{ accessorKey: 'Stoppage Location', header: 'Stoppage Location' },
    //{ accessorKey: 'Stoppage Latitude', header: 'Stoppage Latitude' },
    //{ accessorKey: 'Stoppage Longitude', header: 'Stoppage Longitude' },
    //{ accessorKey: 'Stoppage Count', header: 'Stoppage Count' }
  ], []);

  const expandedDetails = [
    'Transporter',
    'Invoice No',
    'Load No',
    'Trip Status',
    'Driver Name',
    'From Datetime',
    'Start Location',
    'Speed (Km/Hr)',
    'To Datetime',
    'End Location',
    'Speed (Km/Hr)2',
    'Distance',
    'Duration (HH:MM)',
    'Remark',
    'Action Performed',
    'Stoppage Latitude',
    'Stoppage Longitude',
    'Stoppage Count'
  ];

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      globalFilter,
      pagination,
      columnVisibility
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel()
  });

  return (
    <div className="bg-white rounded-lg shadow p-4">
      {/* 🔍 Global Filter */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search..."
          value={globalFilter ?? ''}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="w-full px-3 py-2 border rounded"
        />
      </div>

      {/* 📊 Table */}
      <table className="min-w-full table-auto border">
        <thead className="bg-gray-100">
          {table.getHeaderGroups().map(headerGroup => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map(header => (
                <th
                  key={header.id}
                  className="px-4 py-2 border cursor-pointer"
                  onClick={header.column.getToggleSortingHandler()}
                >
                  {flexRender(header.column.columnDef.header, header.getContext())}
                  {header.column.getIsSorted() === 'asc' && ' 🔼'}
                  {header.column.getIsSorted() === 'desc' && ' 🔽'}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map(row => (
            <React.Fragment key={row.id}>
              <tr
                className="border-t cursor-pointer hover:bg-gray-50"
                onClick={() => setExpandedRowId(expandedRowId === row.id ? null : row.id)}
              >
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id} className="px-4 py-2 border">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>

              {expandedRowId === row.id && (
                <tr className="bg-gray-50">
                  <td colSpan={columns.length} className="px-4 py-2 border">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm text-gray-700">
                      {expandedDetails.map(key => (
                        <div key={key}>
                          <strong>{key}:</strong> {row.original[key] ?? '—'}
                        </div>
                      ))}
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>

      {/* 📄 Pagination */}
      <div className="flex justify-between items-center mt-4">
        <div>
          Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="px-3 py-1 border rounded"
          >
            Prev
          </button>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="px-3 py-1 border rounded"
          >
            Next
          </button>
        </div>
      </div>

      {/* 👁️ Column Visibility Toggle */}
      <div className="mt-4">
        <h3 className="font-semibold mb-2">Toggle Columns</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {table.getAllLeafColumns().map(column => (
            <label key={column.id} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={column.getIsVisible()}
                onChange={column.getToggleVisibilityHandler()}
              />
              {column.columnDef.header}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ModernDataTable1;