import { useState } from 'react';
import { useGameEvent } from '../../hooks/useGameEvent';
import { useGameAction } from '../../hooks/useGameAction';
import { COLE_DEBT_CONFIG, EVENT_NAMES } from '../../game/constants';

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
  const debt = useGameEvent(EVENT_NAMES.DEBT_CHANGED);
  const credits = useGameEvent(EVENT_NAMES.CREDITS_CHANGED);
  const finance = useGameEvent(EVENT_NAMES.FINANCE_CHANGED);
  const currentDay = useGameEvent(EVENT_NAMES.TIME_CHANGED);

  const { getDebtInfo, borrowFromCole, makeDebtPayment } = useGameAction();

  const [message, setMessage] = useState(null);

  const debtInfo =
    debt === undefined || !finance || credits === undefined
      ? null
      : getDebtInfo();

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
      const feeText = result.fee > 0 ? ` (+ ₡${result.fee} fee)` : '';
      setMessage({
        type: 'info',
        text:
          result.amount === debt
            ? 'Debt paid in full!'
            : `Paid ₡${result.amount}${feeText} toward debt`,
      });
    } else {
      setMessage({ type: 'error', text: result.reason });
    }
  };

  const payAllAmount =
    debtInfo.earlyRepaymentFeeRate > 0
      ? Math.min(
          Math.floor(credits / (1 + debtInfo.earlyRepaymentFeeRate)),
          debtInfo.debt
        )
      : Math.min(credits, debtInfo.debt);
  const payAll = () => handlePayment(payAllAmount);

  const lienPercent = Math.round(debtInfo.lienRate * 100);
  const interestPercent = Math.round(debtInfo.interestRate * 100);
  const daysUntilInterest = Math.max(0, debtInfo.nextInterestDay - currentDay);

  return (
    <div id="finance-panel" className="visible">
      <button className="close-btn" onClick={onClose} aria-label="Close">
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
            <span className="value">
              {interestPercent}% every {COLE_DEBT_CONFIG.INTEREST_PERIOD_DAYS}{' '}
              days
            </span>
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
            {debtInfo.earlyRepaymentFeeRate > 0 && (
              <p className="finance-warning">
                Early repayment:{' '}
                {Math.round(debtInfo.earlyRepaymentFeeRate * 100)}% processing
                fee applies.
              </p>
            )}
            <div className="finance-buttons">
              {COLE_DEBT_CONFIG.PAYMENT_TIERS.map((amount) => {
                const payAmount = Math.min(amount, debtInfo.debt);
                const fee =
                  debtInfo.earlyRepaymentFeeRate > 0
                    ? Math.ceil(payAmount * debtInfo.earlyRepaymentFeeRate)
                    : 0;
                return (
                  <button
                    key={amount}
                    className="station-btn"
                    disabled={credits < payAmount + fee || debtInfo.debt === 0}
                    onClick={() => handlePayment(payAmount)}
                  >
                    Pay ₡{payAmount}
                    {fee > 0 ? ` (+₡${fee} fee)` : ''}
                  </button>
                );
              })}
              {(() => {
                const payAllFee =
                  debtInfo.earlyRepaymentFeeRate > 0
                    ? Math.ceil(payAllAmount * debtInfo.earlyRepaymentFeeRate)
                    : 0;
                return (
                  <button
                    className="station-btn"
                    disabled={payAllAmount <= 0 || debtInfo.debt === 0}
                    onClick={payAll}
                  >
                    Pay All (₡{payAllAmount.toLocaleString()}
                    {payAllFee > 0 ? ` +₡${payAllFee} fee` : ''})
                  </button>
                );
              })()}
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
