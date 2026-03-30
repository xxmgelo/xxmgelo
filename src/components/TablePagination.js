import React, { useMemo } from "react";

function TablePagination({
  currentPage,
  totalPages,
  totalItems,
  rangeStart,
  rangeEnd,
  onPageChange,
}) {
  const pageNumbers = useMemo(() => {
    if (totalPages <= 1) {
      return [1];
    }

    const pages = new Set([1, totalPages, currentPage]);

    for (let offset = 1; offset <= 1; offset += 1) {
      pages.add(Math.max(1, currentPage - offset));
      pages.add(Math.min(totalPages, currentPage + offset));
    }

    return Array.from(pages).sort((left, right) => left - right);
  }, [currentPage, totalPages]);

  return (
    <div className="table-footer">
      <p className="pagination-info">
        Showing <strong>{rangeStart}-{rangeEnd}</strong> of <strong>{totalItems}</strong> records
      </p>

      <div className="pagination-controls" aria-label="Table pagination">
        <button
          type="button"
          className="pagination-btn pagination-btn-nav"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          Prev
        </button>

        {pageNumbers.map((pageNumber, index) => {
          const previousPage = pageNumbers[index - 1];
          const showGap = previousPage && pageNumber - previousPage > 1;

          return (
            <React.Fragment key={pageNumber}>
              {showGap ? <span className="pagination-gap">...</span> : null}
              <button
                type="button"
                className={`pagination-btn ${currentPage === pageNumber ? "active" : ""}`}
                onClick={() => onPageChange(pageNumber)}
              >
                {pageNumber}
              </button>
            </React.Fragment>
          );
        })}

        <button
          type="button"
          className="pagination-btn pagination-btn-nav"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default TablePagination;
