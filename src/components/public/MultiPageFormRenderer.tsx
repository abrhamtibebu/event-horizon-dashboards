import React, { useState } from 'react';
import { ArrowRight, ArrowLeft, CheckCircle, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import FormFieldRenderer from './FormFieldRenderer';
import type { FormField } from '@/types/forms';

interface MultiPageFormRendererProps {
  fields: FormField[];
  formValues: Record<string, any>;
  errors: Record<string, string>;
  onFieldChange: (fieldKey: string, value: any) => void;
  onCheckboxChange: (fieldKey: string, optionValue: string, checked: boolean) => void;
  onNextPage: () => void;
  onPrevPage: () => void;
  onSubmit: () => void;
  currentPage: number;
  totalPages: number;
  isSubmitting?: boolean;
}

export const MultiPageFormRenderer: React.FC<MultiPageFormRendererProps> = ({
  fields,
  formValues,
  errors,
  onFieldChange,
  onCheckboxChange,
  onNextPage,
  onPrevPage,
  onSubmit,
  currentPage,
  totalPages,
  isSubmitting = false
}) => {
  const progress = (currentPage / totalPages) * 100;
  const currentPageFields = fields.filter(field => field.page_number === currentPage);
  const isLastPage = currentPage === totalPages;

  const evaluateConditionalLogic = (logic: any, formData: Record<string, any>): boolean => {
    if (!logic) return true;

    const fieldValue = formData[logic.field_id];
    if (fieldValue === undefined || fieldValue === null) return false;

    switch (logic.operator) {
      case 'equals':
        return fieldValue === logic.value;
      case 'not_equals':
        return fieldValue !== logic.value;
      case 'contains':
        return String(fieldValue).toLowerCase().includes(String(logic.value).toLowerCase());
      case 'greater_than':
        return Number(fieldValue) > Number(logic.value);
      case 'less_than':
        return Number(fieldValue) < Number(logic.value);
      case 'is_empty':
        return !fieldValue || fieldValue === '';
      case 'is_not_empty':
        return fieldValue && fieldValue !== '';
      default:
        return true;
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress Indicator */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span>Page {currentPage} of {totalPages}</span>
          <span>{Math.round(progress)}% Complete</span>
        </div>
        <Progress value={progress} className="w-full" />
      </div>

      {/* Page Indicator */}
      <div className="flex items-center justify-center gap-2">
        {Array.from({ length: totalPages }, (_, i) => {
          const pageNum = i + 1;
          const isCompleted = pageNum < currentPage;
          const isCurrent = pageNum === currentPage;

          return (
            <div key={pageNum} className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                isCompleted
                  ? 'bg-green-500 border-green-500 text-white'
                  : isCurrent
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-muted-foreground text-muted-foreground'
              }`}>
                {isCompleted ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <span className="text-xs font-medium">{pageNum}</span>
                )}
              </div>
              {pageNum < totalPages && (
                <div className={`w-8 h-0.5 ${
                  pageNum < currentPage ? 'bg-green-500' : 'bg-muted-foreground'
                }`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Form Fields for Current Page */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-6">
            {currentPageFields.length > 0 ? (
              currentPageFields.map(field => (
                <FormFieldRenderer
                  key={field.id}
                  field={field}
                  value={formValues[field.field_key]}
                  error={errors[field.field_key]}
                  onChange={onFieldChange}
                  onCheckboxChange={onCheckboxChange}
                  conditionalLogicEvaluator={evaluateConditionalLogic}
                  formData={formValues}
                />
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No fields on this page.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={onPrevPage}
          disabled={currentPage === 1}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Previous
        </Button>

        <div className="flex items-center gap-2">
          {!isLastPage ? (
            <Button
              onClick={onNextPage}
              className="flex items-center gap-2"
            >
              Next
              <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={onSubmit}
              disabled={isSubmitting}
              className="flex items-center gap-2"
            >
              {isSubmitting ? 'Submitting...' : 'Complete Registration'}
              <CheckCircle className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Page Summary */}
      <div className="text-center text-sm text-muted-foreground">
        <p>
          {currentPageFields.length} field{currentPageFields.length !== 1 ? 's' : ''} on this page
          {isLastPage && (
            <span className="block mt-1 font-medium text-foreground">
              This is the final page - review your information before submitting
            </span>
          )}
        </p>
      </div>
    </div>
  );
};

export default MultiPageFormRenderer;
