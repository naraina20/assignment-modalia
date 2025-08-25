
export const EmptyState: React.FC<{ title: string; subtitle?: string }>
  = ({ title, subtitle }) => (
    <div className="border border-dashed rounded-2xl p-10 text-center text-gray-600">
      <p className="text-lg font-medium mb-1">{title}</p>
      {subtitle && <p className="text-sm">{subtitle}</p>}
    </div>
  );