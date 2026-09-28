import { useEffect, useState } from 'react'

type Preview = { key: string; url: string; name: string }

function toFiles(files: File[] | FileList | File | null | undefined): File[] {
  if (!files) return []
  if (files instanceof File) return [files]
  return Array.from(files)
}

export function useImagePreviews(files: File[] | FileList | File | null | undefined) {
  const [previews, setPreviews] = useState<Preview[]>([])

  useEffect(() => {
    const next = toFiles(files)
      .filter((file) => file.type.startsWith('image/'))
      .map((file) => ({
        key: `${file.name}-${file.size}-${file.lastModified}`,
        url: URL.createObjectURL(file),
        name: file.name,
      }))
    setPreviews(next)
    return () => next.forEach((item) => URL.revokeObjectURL(item.url))
  }, [files])

  return previews
}

export function AttachedImagePreview({
  files,
}: {
  files: File[] | FileList | File | null | undefined
}) {
  const previews = useImagePreviews(files)
  if (previews.length === 0) return null

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {previews.map((item) => (
        <img
          key={item.key}
          src={item.url}
          alt={item.name}
          className="aspect-video w-full rounded-xl border border-border object-cover"
        />
      ))}
    </div>
  )
}
