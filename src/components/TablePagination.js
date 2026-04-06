import React from "react";

function TablePagination({
  currentPage,
  totalPages,
  totalItems,
  rangeStart,
  rangeEnd,
  onPageChange,
}) {
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

        <button
          type="button"
          className="pagination-btn active"
          aria-current="page"
          disabled
        >
          {currentPage}
        </button>

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
