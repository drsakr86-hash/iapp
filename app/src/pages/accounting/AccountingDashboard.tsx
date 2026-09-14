/* -------------------------------------------------------------------------
 * AccountingDashboard — /accounting
 * -------------------------------------------------------------------------
 * Every number here is read from a view (v_account_balances /
 * v_daily_financial_summary) — nothing is a stored/editable balance.
 * PROVISIONAL: renders empty until the migration is applied and at least
 * one account exists.
 * ---------------------------------------------------------------------- */

import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card, EmptyState, Spinner } from '../../components/ui';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import * as reportsSvc from '../../services/accounting/reports';
import type { AccountBalanceRow } from '../../types/accounting.types';

export default function AccountingDashboard() {
  useDocumentTitle('الحسابات المالية');
  const [balances, setBalances] = useState<AccountBalanceRow[]>([]);
  const [today, setToday] = useState({ revenue: 0, expenses: 0, refunds: 0, net: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [b, t] = await Promise.all([reportsSvc.accountBalances(), reportsSvc.todaySummary()]);
      setBalances(b);
      setToday(t);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'تعذّر تحميل البيانات المالية');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect
    void load();
  }, [load]);

  return (
    <div className="stack">
      <div className="row" style={{ flexWrap: 'wrap', gap: 8 }}>
        <Link to="/accounting/revenue"><Button>+ تحصيل</Button></Link>
        <Link to="/accounting/expenses"><Button variant="outline">+ مصروف</Button></Link>
        <Link to="/accounting/transfers"><Button variant="outline">+ تحويل</Button></Link>
        <Link to="/accounting/refunds"><Button variant="outline">+ مرتجع</Button></Link>
        <Link to="/accounting/closing"><Button variant="outline">إغلاق اليوم</Button></Link>
        <Link to="/accounting/reports"><Button variant="outline">التقارير</Button></Link>
        <Link to="/accounting/settings"><Button variant="outline">الإعدادات</Button></Link>
      </div>

      {loading ? <Spinner label="جارٍ التحميل…" /> : null}
      {!loading && error ? <EmptyState icon="⚠️" text={error} /> : null}

      {!loading && !error ? (
        <>
          <Card title="ملخص اليوم">
            <div className="row" style={{ flexWrap: 'wrap', gap: 8 }}>
              <span className="tag">الإيرادات: {today.revenue.toFixed(2)}</span>
              <span className="tag">المصروفات: {today.expenses.toFixed(2)}</span>
              <span className="tag">المرتجعات: {today.refunds.toFixed(2)}</span>
              <span className="tag">صافي الحركة: {today.net.toFixed(2)}</span>
            </div>
          </Card>

          <Card title="الحسابات">
            {balances.length ? (
              <div className="stack" style={{ gap: 6 }}>
                {balances.map((b) => (
                  <div key={b.account_id} className="row" style={{ justifyContent: 'space-between' }}>
                    <span>{b.name_ar}</span>
                    <strong>
                      {b.current_balance.toFixed(2)} {b.currency}
                    </strong>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon="🏦"
                text="لا توجد حسابات/خزائن مُضافة بعد"
              />
            )}
            <div style={{ marginBlockStart: 8 }}>
              <Link to="/accounting/accounts">
                <Button variant="outline">إدارة الحسابات</Button>
              </Link>
            </div>
          </Card>
        </>
      ) : null}
    </div>
  );
}
