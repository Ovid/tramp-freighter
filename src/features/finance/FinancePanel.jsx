import { useState, useMemo } from 'react';
import { useGameEvent } from '../../hooks/useGameEvent';
import { useGameAction } from '../../hooks/useGameAction';

/**
 * FinancePanel - React component for Cole's credit line
 *
 * Displays current debt overview, allows voluntary payments,
 * and provides emergency borrowing. Uses the Bridge Pattern to
 * subscribe to debt, credit, finance, and time changes.
 *
 * @param {Object} props
 * @param {Function} props.onClose - Callback to close the panel
 */
export function FinancePanel({ onClose }) {
  const debt = useGameEvent('debtChanged');
  const credits = useGameEvent('creditsChanged');
  const finance = useGameEvent('financeChanged');
  const currentDay = useGameEvent('timeChanged');

  const { getDebtInfo, borrowFromCole, makeDebtPayment } = useGameAction();

  const [message, setMessage] = useState(null);

  const debtInfo = useMemo(() => {
    // Re-derive when debt/finance/credits change
    if (debt === undefined || !finance) return null;
    return getDebtInfo();
  }, [debt, finance, credits, getDebtInfo]);

  if (!debtInfo) return null;

  const handleBorrow = (amount) => {
    const result = borrowFromCole(amount);
    if (result.success) {
      setMessage({ type: 'info', text: `Borrowed ₡${amount} from Cole` });
    } else {
      setMessage({ type: 'error', text: result.reason });
    }
  };

  const handlePayment = (amount) => {
    const result = makeDebtPayment(amount);
    if (result.success) {
      setMessage({
        type: 'info',
        text:
          result.amount === debt
            ? 'Debt paid in full!'
            : `Paid ₡${result.amount} toward debt`,
      });
    } else {
      setMessage({ type: 'error', text: result.reason });
    }
  };

  const payAll = () => handlePayment(Math.min(credits, debt));

  const lienPercent = Math.round(debtInfo.lienRate * 100);
  const interestPercent = Math.round(debtInfo.interestRate * 100);
  const daysUntilInterest = Math.max(0, debtInfo.nextInterestDay - currentDay);

  return (
    <div id="finance-panel" className="visible">
      <button className="close-btn" onClick={onClose}>
        ×
      </button>
      <h2>Cole Credit Line</h2>

      <div className="finance-content">
        <div className="finance-section">
          <h3>Debt Overview</h3>
          <div className="info-row">
            <span className="label">Outstanding:</span>
            <span className="value">₡{debtInfo.debt.toLocaleString()}</span>
          </div>
          <div className="info-row">
            <span className="label">Withholding:</span>
            <span className="value">{lienPercent}% of trade sales</span>
          </div>
          <div className="info-row">
            <span className="label">Interest:</span>
            <span className="value">{interestPercent}% every 30 days</span>
          </div>
          <div className="info-row">
            <span className="label">Next interest:</span>
            <span className="value">
              {debtInfo.debt > 0 ? `${daysUntilInterest} days` : 'N/A'}
            </span>
          </div>
        </div>

        {debtInfo.debt > 0 && (
          <div className="finance-section">
            <h3>Make Payment</h3>
            <div className="finance-buttons">
              {[100, 500, 1000].map((amount) => (
                <button
                  key={amount}
                  className="station-btn"
                  disabled={
                    credits < Math.min(amount, debtInfo.debt) ||
                    debtInfo.debt === 0
                  }
                  onClick={() => handlePayment(Math.min(amount, debtInfo.debt))}
                >
                  Pay ₡{amount}
                </button>
              ))}
              <button
                className="station-btn"
                disabled={credits === 0 || debtInfo.debt === 0}
                onClick={payAll}
              >
                Pay All (₡{Math.min(credits, debtInfo.debt).toLocaleString()})
              </button>
            </div>
          </div>
        )}

        <div className="finance-section">
          <h3>Emergency Credit</h3>
          <p className="finance-warning">
            Borrowing increases withholding and draws Cole&apos;s attention.
          </p>
          <div className="info-row">
            <span className="label">Available:</span>
            <span className="value">
              up to ₡{debtInfo.maxDraw.toLocaleString()}
            </span>
          </div>
          <div className="finance-buttons">
            {debtInfo.availableDrawTiers.map((amount) => (
              <button
                key={amount}
                className="station-btn borrow-btn"
                onClick={() => handleBorrow(amount)}
              >
                Borrow ₡{amount}
              </button>
            ))}
          </div>
        </div>

        {message && (
          <div className={`validation-message ${message.type}`}>
            {message.text}
          </div>
        )}
      </div>
    </div>
  );
}
