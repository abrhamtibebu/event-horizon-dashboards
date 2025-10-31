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
    if (page !== currentPage) {
      onPageChange(page);
    }
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
    <div className={`flex items-center justify-center ${className}`}>
      {/* Main Pagination Container */}
      <div className="flex items-center space-x-3 bg-white rounded-full px-6 py-3 shadow-lg border border-blue-200">
        
        {/* Previous Page Button */}
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1 || totalPages <= 1}
          className="flex items-center justify-center w-10 h-10 rounded-full border border-blue-200 bg-white hover:bg-blue-50 hover:border-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Previous page"
        >
          <svg className="w-4 h-4 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Page Numbers */}
        <div className="flex items-center space-x-1">
          {getPageNumbers().map((page, index) => {
            if (page === '...') {
              return (
                <span key={`ellipsis-${index}`} className="px-2 py-1 text-gray-500 font-medium">
                  ...
                </span>
              );
            }

            const isCurrentPage = page === currentPage;
            return (
              <button
                key={page}
                onClick={() => handlePageChange(page as number)}
                className={`flex items-center justify-center w-10 h-10 rounded-full font-medium ${
                  isCurrentPage
                    ? 'bg-blue-500 text-white border border-blue-600'
                    : 'text-gray-800 hover:text-blue-600 hover:bg-blue-50'
                }`}
              >
                {page}
              </button>
            );
          })}
        </div>

        {/* Next Page Button */}
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages || totalPages <= 1}
          className="flex items-center justify-center w-10 h-10 rounded-full border border-blue-200 bg-white hover:bg-blue-50 hover:border-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Next page"
        >
          <svg className="w-4 h-4 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Records Per Page Selector */}
        <div className="flex items-center space-x-2 ml-4 pl-4 border-l border-blue-200">
          <select
            value={perPage}
            onChange={(e) => onPerPageChange(Number(e.target.value))}
            className="px-3 py-2 text-sm border border-blue-200 rounded-full bg-white hover:border-blue-300 hover:bg-blue-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer text-gray-800"
          >
            <option value={10}>10 / page</option>
            <option value={15}>15 / page</option>
            <option value={25}>25 / page</option>
            <option value={50}>50 / page</option>
            <option value={100}>100 / page</option>
          </select>
        </div>

        {/* Go To Page Input */}
        <div className="flex items-center space-x-2 ml-4 pl-4 border-l border-blue-200">
          <span className="text-sm text-gray-800 font-medium">Go to</span>
          <input
            type="number"
            value={goToPage}
            onChange={(e) => setGoToPage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder=""
            min="1"
            max={totalPages}
            className="w-16 px-3 py-2 text-sm border border-blue-200 rounded-full bg-white hover:border-blue-300 hover:bg-blue-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 text-center"
          />
          <span className="text-sm text-gray-800 font-medium">Page</span>
        </div>
      </div>
    </div>
  );
};

export default Pagination;