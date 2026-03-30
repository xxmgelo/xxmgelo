import { useEffect, useMemo, useState } from "react";

function useTablePagination(items, itemsPerPage = 10) {
  const [currentPage, setCurrentPage] = useState(1);
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

  useEffect(() => {
    setCurrentPage((previousPage) => Math.min(previousPage, totalPages));
  }, [totalPages]);

  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return items.slice(startIndex, startIndex + itemsPerPage);
  }, [currentPage, items, itemsPerPage]);

  const rangeStart = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const rangeEnd = totalItems === 0 ? 0 : Math.min(currentPage * itemsPerPage, totalItems);

  return {
    currentPage,
    setCurrentPage,
    totalPages,
    paginatedItems,
    totalItems,
    rangeStart,
    rangeEnd,
    itemsPerPage,
  };
}

export default useTablePagination;
