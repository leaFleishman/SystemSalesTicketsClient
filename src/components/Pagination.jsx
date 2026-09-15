export default function Pagination({ pageNumber, totalPages, hasNextPage, hasPreviousPage, onChange }) {
  if (!totalPages || totalPages <= 1) return null;

  return (
    <div className="pagination">
      <button className="btn btn-secondary btn-sm" disabled={!hasPreviousPage} onClick={() => onChange(pageNumber - 1)}>
        הקודם
      </button>
      <span>
        עמוד {pageNumber} מתוך {totalPages}
      </span>
      <button className="btn btn-secondary btn-sm" disabled={!hasNextPage} onClick={() => onChange(pageNumber + 1)}>
        הבא
      </button>
    </div>
  );
}
