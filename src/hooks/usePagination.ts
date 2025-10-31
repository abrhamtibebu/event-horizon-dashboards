import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

interface UsePaginationOptions {
  defaultPerPage?: number;
  searchParamPrefix?: string;
}

interface UsePaginationReturn {
  currentPage: number;
  perPage: number;
  totalPages: number;
  totalRecords: number;
  setCurrentPage: (page: number) => void;
  setPerPage: (perPage: number) => void;
  setTotalPages: (pages: number) => void;
  setTotalRecords: (records: number) => void;
  handlePageChange: (page: number) => void;
  handlePerPageChange: (perPage: number) => void;
  resetPagination: () => void;
}

export const usePagination = (options: UsePaginationOptions = {}): UsePaginationReturn => {
  const { defaultPerPage = 10, searchParamPrefix = '' } = options;
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(defaultPerPage);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Initialize state from URL parameters
  useEffect(() => {
    const pageParam = searchParamPrefix ? `${searchParamPrefix}_page` : 'page';
    const perPageParam = searchParamPrefix ? `${searchParamPrefix}_per_page` : 'per_page';
    
    const page = parseInt(searchParams.get(pageParam) || '1');
    const perPageParamValue = parseInt(searchParams.get(perPageParam) || defaultPerPage.toString());

    setCurrentPage(page);
    setPerPage(perPageParamValue);
  }, [searchParams, searchParamPrefix, defaultPerPage]);

  // Update URL when state changes
  useEffect(() => {
    const pageParam = searchParamPrefix ? `${searchParamPrefix}_page` : 'page';
    const perPageParam = searchParamPrefix ? `${searchParamPrefix}_per_page` : 'per_page';
    
    const params = new URLSearchParams(searchParams);
    params.set(pageParam, currentPage.toString());
    params.set(perPageParam, perPage.toString());
    
    setSearchParams(params, { replace: true });
  }, [currentPage, perPage, searchParams, setSearchParams, searchParamPrefix]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePerPageChange = (newPerPage: number) => {
    setPerPage(newPerPage);
    setCurrentPage(1); // Reset to first page when changing per page
  };

  const resetPagination = () => {
    setCurrentPage(1);
    setPerPage(defaultPerPage);
  };

  return {
    currentPage,
    perPage,
    totalPages,
    totalRecords,
    setCurrentPage,
    setPerPage,
    setTotalPages,
    setTotalRecords,
    handlePageChange,
    handlePerPageChange,
    resetPagination,
  };
};

export default usePagination;
