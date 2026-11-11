import React from 'react';
import type { FieldType } from '@/types/forms';
import { FIELD_TYPES, FIELD_TYPE_GROUPS } from './fieldTypes';

interface FormFieldPaletteProps {
  onFieldSelect: (fieldType: FieldType) => void;
}

/** Picker for the type of field to add. */
export const FormFieldPalette: React.FC<FormFieldPaletteProps> = ({ onFieldSelect }) => (
  <div className="space-y-5">
    {FIELD_TYPE_GROUPS.map((group) => (
      <div key={group.key} className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{group.label}</p>
        <div className="grid grid-cols-2 gap-2">
          {FIELD_TYPES.filter((item) => item.group === group.key).map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.type}
                type="button"
                title={item.hint}
                onClick={() => onFieldSelect(item.type)}
                className="flex items-center gap-2.5 rounded-lg border border-border bg-background px-3 py-2.5 text-left text-sm font-medium text-foreground transition-colors hover:border-primary/50 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    ))}
  </div>
);

export default FormFieldPalette;
