import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

const MIN_PAGE = 1
const MAX_PAGE = 10000
const MIN_PER_PAGE = 1
const MAX_PER_PAGE = 100

function parseBoundedInt(
  raw: string | null,
  fallback: number,
  min: number,
  max: number,
): number {
  if (raw == null || raw.trim() === '') return fallback
  if (!/^\d+$/.test(raw.trim())) return fallback
  const value = Number(raw.trim())
  if (!Number.isSafeInteger(value)) return fallback
  return Math.min(max, Math.max(min, value))
}

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

  // Initialize state from URL parameters and rewrite invalid / out-of-range values
  useEffect(() => {
    const pageParam = searchParamPrefix ? `${searchParamPrefix}_page` : 'page';
    const perPageParam = searchParamPrefix ? `${searchParamPrefix}_per_page` : 'per_page';
    
    const safeDefaultPerPage = parseBoundedInt(
      String(defaultPerPage),
      15,
      MIN_PER_PAGE,
      MAX_PER_PAGE,
    )
    const page = parseBoundedInt(searchParams.get(pageParam), MIN_PAGE, MIN_PAGE, MAX_PAGE)
    const perPageParamValue = parseBoundedInt(
      searchParams.get(perPageParam),
      safeDefaultPerPage,
      MIN_PER_PAGE,
      MAX_PER_PAGE,
    )

    setCurrentPage(page)
    setPerPage(perPageParamValue)

    // Normalize scanner / malformed payloads out of the address bar.
    const next = new URLSearchParams(searchParams)
    let dirty = false
    if (next.get(pageParam) !== String(page)) {
      next.set(pageParam, String(page))
      dirty = true
    }
    if (next.get(perPageParam) !== String(perPageParamValue)) {
      next.set(perPageParam, String(perPageParamValue))
      dirty = true
    }
    if (dirty) {
      setSearchParams(next, { replace: true })
    }
  }, [searchParams, searchParamPrefix, defaultPerPage, setSearchParams]);

  // Update URL when state changes (user pagination controls)
  useEffect(() => {
    const pageParam = searchParamPrefix ? `${searchParamPrefix}_page` : 'page';
    const perPageParam = searchParamPrefix ? `${searchParamPrefix}_per_page` : 'per_page';
    
    if (
      searchParams.get(pageParam) === currentPage.toString() &&
      searchParams.get(perPageParam) === perPage.toString()
    ) {
      return
    }

    const params = new URLSearchParams(searchParams);
    params.set(pageParam, currentPage.toString());
    params.set(perPageParam, perPage.toString());
    
    setSearchParams(params, { replace: true });
  }, [currentPage, perPage, searchParams, setSearchParams, searchParamPrefix]);

  const handlePageChange = (page: number) => {
    setCurrentPage(parseBoundedInt(String(page), MIN_PAGE, MIN_PAGE, MAX_PAGE))
  };

  const handlePerPageChange = (newPerPage: number) => {
    setPerPage(parseBoundedInt(String(newPerPage), defaultPerPage, MIN_PER_PAGE, MAX_PER_PAGE))
    setCurrentPage(MIN_PAGE)
  };

  const resetPagination = () => {
    setCurrentPage(MIN_PAGE)
    setPerPage(parseBoundedInt(String(defaultPerPage), 15, MIN_PER_PAGE, MAX_PER_PAGE))
  };

  // Keep every caller on the same bounds as values read from the URL.
  const setCurrentPageSafely = (page: number) => {
    setCurrentPage(parseBoundedInt(String(page), MIN_PAGE, MIN_PAGE, MAX_PAGE))
  }
  const setPerPageSafely = (value: number) => {
    const fallback = parseBoundedInt(String(defaultPerPage), 15, MIN_PER_PAGE, MAX_PER_PAGE)
    setPerPage(parseBoundedInt(String(value), fallback, MIN_PER_PAGE, MAX_PER_PAGE))
  }

  return {
    currentPage,
    perPage,
    totalPages,
    totalRecords,
    setCurrentPage: setCurrentPageSafely,
    setPerPage: setPerPageSafely,
    setTotalPages,
    setTotalRecords,
    handlePageChange,
    handlePerPageChange,
    resetPagination,
  };
};

export default usePagination;
