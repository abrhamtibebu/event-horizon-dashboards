import React from 'react';
import {
  Type,
  Mail,
  Phone,
  Calendar,
  List,
  CheckSquare,
  Upload,
  Hash,
  MapPin,
  Eye,
  CreditCard,
  FileText
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { FormFieldPaletteItem } from '@/types/forms';

interface FormFieldPaletteProps {
  onFieldSelect: (fieldType: string) => void;
  selectedCategory?: string;
  onCategoryChange?: (category: string) => void;
}

const fieldTypes: FormFieldPaletteItem[] = [
  // Basic Fields
  {
    type: 'text',
    label: 'Single Line Text',
    icon: 'Type',
    description: 'Short text input for names, titles, etc.',
    category: 'basic'
  },
  {
    type: 'textarea',
    label: 'Multi-line Text',
    icon: 'FileText',
    description: 'Long text input for descriptions, comments',
    category: 'basic'
  },
  {
    type: 'email',
    label: 'Email',
    icon: 'Mail',
    description: 'Email address input with validation',
    category: 'basic'
  },
  {
    type: 'phone',
    label: 'Phone Number',
    icon: 'Phone',
    description: 'Phone number input with formatting',
    category: 'basic'
  },

  // Advanced Fields
  {
    type: 'date',
    label: 'Date',
    icon: 'Calendar',
    description: 'Date picker for birth dates, event dates',
    category: 'advanced'
  },
  {
    type: 'datetime',
    label: 'Date & Time',
    icon: 'Calendar',
    description: 'Date and time picker',
    category: 'advanced'
  },
  {
    type: 'select',
    label: 'Dropdown',
    icon: 'List',
    description: 'Single selection from predefined options',
    category: 'advanced'
  },
  {
    type: 'radio',
    label: 'Radio Buttons',
    icon: 'CheckSquare',
    description: 'Single choice from multiple options',
    category: 'advanced'
  },
  {
    type: 'checkbox',
    label: 'Checkboxes',
    icon: 'CheckSquare',
    description: 'Multiple selections from options',
    category: 'advanced'
  },

  // Special Fields
  {
    type: 'number',
    label: 'Number',
    icon: 'Hash',
    description: 'Numeric input with validation',
    category: 'advanced'
  },
  {
    type: 'address',
    label: 'Address',
    icon: 'MapPin',
    description: 'Full address input with components',
    category: 'advanced'
  },
  {
    type: 'file',
    label: 'File Upload',
    icon: 'Upload',
    description: 'File upload for documents, images',
    category: 'advanced'
  },
  {
    type: 'payment',
    label: 'Payment Field',
    icon: 'CreditCard',
    description: 'Payment integration for ticketed events',
    category: 'advanced'
  },
  {
    type: 'hidden',
    label: 'Hidden Field',
    icon: 'Eye',
    description: 'Hidden field for internal data',
    category: 'layout'
  }
];

const categories = [
  { key: 'basic', label: 'Basic Fields', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' },
  { key: 'advanced', label: 'Advanced Fields', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' },
  { key: 'layout', label: 'Layout & Hidden', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300' }
];

const getIconComponent = (iconName: string) => {
  const icons: Record<string, React.ComponentType<any>> = {
    Type, Mail, Phone, Calendar, List, CheckSquare, Upload, Hash, MapPin, Eye, CreditCard, FileText
  };
  return icons[iconName] || Type;
};

export const FormFieldPalette: React.FC<FormFieldPaletteProps> = ({
  onFieldSelect,
  selectedCategory = 'basic',
  onCategoryChange
}) => {
  const filteredFields = fieldTypes.filter(field =>
    !selectedCategory || field.category === selectedCategory
  );

  return (
    <div className="space-y-4">
      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <button
            key={category.key}
            onClick={() => onCategoryChange?.(category.key)}
            className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
              selectedCategory === category.key
                ? category.color
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
            }`}
          >
            {category.label}
          </button>
        ))}
      </div>

      {/* Fields Grid */}
      <div className="grid grid-cols-1 gap-3">
        {filteredFields.map((field) => {
          const IconComponent = getIconComponent(field.icon);

          return (
            <Card
              key={field.type}
              className="cursor-pointer hover:shadow-md transition-all duration-200 hover:border-primary/50 group"
              onClick={() => onFieldSelect(field.type)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <IconComponent className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm text-foreground group-hover:text-primary transition-colors">
                      {field.label}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      {field.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Badge variant="secondary" className="text-xs">
                      Drag
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Tips */}
      <div className="mt-6 p-4 bg-muted/50 rounded-lg">
        <h4 className="font-medium text-sm text-foreground mb-2">💡 Quick Tips</h4>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li>• Drag fields to add them to your form</li>
          <li>• Click fields to configure properties</li>
          <li>• Use conditional logic for dynamic forms</li>
          <li>• Map fields to badge placeholders</li>
        </ul>
      </div>
    </div>
  );
};

export default FormFieldPalette;
