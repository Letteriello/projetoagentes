import React from 'react';
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from '@/lib/utils';

interface ColumnConfig {
  width?: string; // e.g., "w-1/4", "w-[150px]"
  className?: string; // Additional classes for cell content skeleton
}

interface TableLoadingSkeletonProps {
  rowCount?: number;
  columnConfigs?: ColumnConfig[]; // Defines the number of columns and their properties
  className?: string;
  showTableHeader?: boolean;
  cellClassName?: string; // Class for the <TableCell> itself
  headerCellClassName?: string; // Class for the <TableHead> itself
}

const TableLoadingSkeleton: React.FC<TableLoadingSkeletonProps> = ({
  rowCount = 5,
  columnConfigs = [{ width: "w-1/4" }, { width: "w-1/2" }, { width: "w-1/4" }], // Default to 3 columns
  className,
  showTableHeader = true,
  cellClassName,
  headerCellClassName,
}) => {
  return (
    <div className={cn("rounded-md border overflow-hidden", className)}>
      <Table>
        {showTableHeader && (
          <TableHeader>
            <TableRow>
              {columnConfigs.map((col, index) => (
                <TableHead key={index} className={headerCellClassName}>
                  <Skeleton className={cn("h-5", col.width || "w-full", col.className)} />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
        )}
        <TableBody>
          {Array.from({ length: rowCount }).map((_, rowIndex) => (
            <TableRow key={rowIndex}>
              {columnConfigs.map((col, colIndex) => (
                <TableCell key={colIndex} className={cellClassName}>
                  <Skeleton className={cn("h-5", col.width || "w-full", col.className)} />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default TableLoadingSkeleton;
