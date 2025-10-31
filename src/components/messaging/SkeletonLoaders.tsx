import React from 'react'

export const ConversationListSkeleton: React.FC = () => {
  return (
    <div className="space-y-2 p-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center space-x-3 p-3 rounded-lg">
          <div className="w-12 h-12 rounded-full bg-slate-200 animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-slate-200 rounded animate-pulse w-3/4" />
            <div className="h-3 bg-slate-200 rounded animate-pulse w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}

export const MessageSkeleton: React.FC = () => {
  return (
    <div className="flex items-start space-x-3 p-4">
      <div className="w-10 h-10 rounded-full bg-slate-200 animate-pulse" />
      <div className="flex-1 space-y-2">
        <div className="h-3 bg-slate-200 rounded animate-pulse w-24" />
        <div className="space-y-1">
          <div className="h-4 bg-slate-200 rounded animate-pulse w-full" />
          <div className="h-4 bg-slate-200 rounded animate-pulse w-5/6" />
          <div className="h-4 bg-slate-200 rounded animate-pulse w-3/4" />
        </div>
      </div>
    </div>
  )
}

export const MessageThreadSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col h-full">
      <div className="h-16 bg-slate-200 animate-pulse" />
      <div className="flex-1 p-4 space-y-4">
        {[1, 2, 3].map((i) => (
          <MessageSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}

export const ThreadPanelSkeleton: React.FC = () => {
  return (
    <div className="w-[480px] bg-white border-l border-slate-200 flex flex-col h-full">
      <div className="h-20 bg-slate-200 animate-pulse" />
      <div className="flex-1 p-6 space-y-4">
        <div className="p-4 bg-slate-50 rounded-lg space-y-2">
          <div className="h-4 bg-slate-200 rounded animate-pulse w-1/2" />
          <div className="h-16 bg-slate-200 rounded animate-pulse" />
        </div>
        {[1, 2].map((i) => (
          <div key={i} className="flex items-start space-x-3">
            <div className="w-9 h-9 rounded-full bg-slate-200 animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-slate-200 rounded animate-pulse w-24" />
              <div className="h-12 bg-slate-200 rounded-lg animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export const InfoPanelSkeleton: React.FC = () => {
  return (
    <div className="w-80 bg-white border-l border-slate-200 flex flex-col h-full">
      <div className="h-16 bg-slate-200 animate-pulse" />
      <div className="p-6 space-y-6">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-24 h-24 rounded-full bg-slate-200 animate-pulse" />
          <div className="h-6 bg-slate-200 rounded animate-pulse w-32" />
          <div className="h-4 bg-slate-200 rounded animate-pulse w-48" />
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-slate-200 rounded animate-pulse w-24" />
          <div className="h-20 bg-slate-200 rounded animate-pulse" />
        </div>
      </div>
    </div>
  )
}

