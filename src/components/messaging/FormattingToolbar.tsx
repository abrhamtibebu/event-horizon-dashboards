import React, { useState } from 'react'
import { Bold, Italic, Strikethrough, Code, Link, List, Hash, AtSign } from 'lucide-react'
import { Button } from '../ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip'

interface FormattingToolbarProps {
  onFormat: (format: string) => void
  onInsertMention: () => void
  onInsertHashtag: () => void
  className?: string
}

export const FormattingToolbar: React.FC<FormattingToolbarProps> = ({
  onFormat,
  onInsertMention,
  onInsertHashtag,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false)

  const formattingButtons = [
    {
      icon: Bold,
      format: '**bold**',
      tooltip: 'Bold text',
      shortcut: 'Ctrl+B'
    },
    {
      icon: Italic,
      format: '*italic*',
      tooltip: 'Italic text',
      shortcut: 'Ctrl+I'
    },
    {
      icon: Strikethrough,
      format: '~~strikethrough~~',
      tooltip: 'Strikethrough text',
      shortcut: 'Ctrl+Shift+S'
    },
    {
      icon: Code,
      format: '`code`',
      tooltip: 'Inline code',
      shortcut: 'Ctrl+`'
    },
    {
      icon: Link,
      format: '[link](url)',
      tooltip: 'Insert link',
      shortcut: 'Ctrl+K'
    },
    {
      icon: List,
      format: '- list item',
      tooltip: 'Bullet list',
      shortcut: 'Ctrl+Shift+8'
    }
  ]

  const handleFormatClick = (format: string) => {
    onFormat(format)
    setIsOpen(false)
  }

  return (
    <div className={`relative ${className}`}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 text-gray-500 hover:text-gray-700"
            >
              <Bold className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Formatting options</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-50">
          <div className="flex flex-col space-y-1">
            {/* Text formatting */}
            <div className="flex space-x-1">
              {formattingButtons.map((button, index) => (
                <TooltipProvider key={index}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleFormatClick(button.format)}
                        className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                      >
                        <button.icon className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{button.tooltip}</p>
                      <p className="text-xs text-gray-400">{button.shortcut}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200 my-1"></div>

            {/* Special formatting */}
            <div className="flex space-x-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        onInsertMention()
                        setIsOpen(false)
                      }}
                      className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                    >
                      <AtSign className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Mention user</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        onInsertHashtag()
                        setIsOpen(false)
                      }}
                      className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                    >
                      <Hash className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Insert hashtag</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default FormattingToolbar



