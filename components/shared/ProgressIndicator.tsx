interface ProgressIndicatorProps {
  step: number
  total: number
  label?: string
}

export default function ProgressIndicator({ step, total, label }: ProgressIndicatorProps) {
  const percent = Math.round((step / total) * 100)

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-500">
          {label ?? `Step ${step} of ${total}`}
        </span>
        <span className="text-xs text-gray-400">{percent}%</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-gray-200 overflow-hidden">
        <div
          className="h-full rounded-full bg-indigo-600 transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}
