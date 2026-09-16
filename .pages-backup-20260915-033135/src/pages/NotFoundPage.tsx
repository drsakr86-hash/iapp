import { Link } from 'react-router-dom';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export default function NotFoundPage() {
  useDocumentTitle('صفحة غير موجودة');
  return (
    <div className="centered">
      <h1 style={{ fontSize: 'var(--fs-lg)', margin: 0 }}>الصفحة غير موجودة</h1>
      <Link to="/" className="btn">
        العودة للرئيسية
      </Link>
    </div>
  );
}
