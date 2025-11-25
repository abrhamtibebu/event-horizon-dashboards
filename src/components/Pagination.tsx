import React, { useState } from 'react';

// Pagination component without animations

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalRecords: number;
  perPage: number;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalRecords,
  perPage,
  onPageChange,
  onPerPageChange,
  className = ''
}) => {
  const [goToPage, setGoToPage] = useState('');

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // Add first page and ellipsis if needed
    if (startPage > 1) {
      pages.push(1);
      if (startPage > 2) {
        pages.push('...');
      }
    }

    // Add visible pages
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    // Add last page and ellipsis if needed
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push('...');
      }
      pages.push(totalPages);
    }

    return pages;
  };

  const handlePageChange = (page: number) => {
    // Validate page number
    const targetPage = Math.max(1, Math.min(page, totalPages));
    
    // Only change if it's different from current page and valid
    if (targetPage !== currentPage && targetPage >= 1 && targetPage <= totalPages && totalPages > 0) {
      onPageChange(targetPage);
      // Scroll to top of the page when changing pages
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevious = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (currentPage > 1) {
      handlePageChange(currentPage - 1);
    }
  };

  const handleNext = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (currentPage < totalPages) {
      handlePageChange(currentPage + 1);
    }
  };

  const handlePageClick = (page: number) => (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    handlePageChange(page);
  };

  const handleGoToPage = () => {
    const page = parseInt(goToPage);
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange(page);
      setGoToPage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleGoToPage();
    }
  };

  return (
    <div className={`flex items-center justify-center mt-6 ${className}`}>
      {/* Main Pagination Container */}
      <div className="flex items-center gap-2">
        {/* Previous Page Button */}
        <button
          type="button"
          onClick={handlePrevious}
          disabled={currentPage === 1 || totalPages <= 1}
          className="px-4 py-2 rounded-lg bg-card border border-border text-foreground hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium active:scale-95"
          title="Previous page"
          aria-label="Go to previous page"
        >
          ← Previous
        </button>

        {/* Page Numbers */}
        <div className="flex items-center gap-1">
          {getPageNumbers().map((page, index) => {
            if (page === '...') {
              return (
                <span key={`ellipsis-${index}`} className="px-2 py-1 text-muted-foreground font-medium">
                  ...
                </span>
              );
            }

            const isCurrentPage = page === currentPage;
            const pageNumber = page as number;
            return (
              <button
                key={page}
                type="button"
                onClick={handlePageClick(pageNumber)}
                disabled={isCurrentPage || totalPages === 0}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                  isCurrentPage
                    ? 'bg-success text-white cursor-default scale-105'
                    : 'bg-card border border-border text-foreground hover:bg-accent cursor-pointer active:scale-95'
                }`}
                aria-label={`Go to page ${page}`}
                aria-current={isCurrentPage ? 'page' : undefined}
              >
                {page}
              </button>
            );
          })}
        </div>

        {/* Next Page Button */}
        <button
          type="button"
          onClick={handleNext}
          disabled={currentPage === totalPages || totalPages <= 1}
          className="px-4 py-2 rounded-lg bg-card border border-border text-foreground hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium active:scale-95"
          title="Next page"
          aria-label="Go to next page"
        >
          Next →
        </button>
      </div>
    </div>
  );
};

export default Pagination;