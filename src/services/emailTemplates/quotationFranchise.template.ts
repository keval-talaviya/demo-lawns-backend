import { QuotationDocument } from '../../modules/quotation/interfaces/quotation.interface';

export const quotationFranchiseTemplate = (q: QuotationDocument): string => {
  // Map status numbers to readable text
  const statusMap: Record<number, string> = {
    1: 'Draft',
    2: 'Sent',
    3: 'Approved',
    4: 'Rejected',
  };

  // Graceful fallbacks
  const quotationCode = q.uniqueCode || q._id;
  const quotationDate = q.quotationDate
    ? new Date(q.quotationDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : '—';

  const customerName =
    // 👇 If you later store a name field in your quotation
    // (like customerNameSnapshot), this will show that instead of ID.
    (q as any).customerNameSnapshot ||
    (q as any).customerName ||
    'Unknown Customer';

  const totalFormatted = `$${(q.totalAmount ?? 0).toFixed(2)}`;
  const statusText = statusMap[q.status] || 'Unknown';

  // Build email HTML
  return `
    <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px;">
      <h2 style="color: #007BFF;">New Quotation Created</h2>

      <p>Hi Team,</p>
      <p>A new quotation has been created for your franchise.</p>

      <table style="border-collapse: collapse; width: 100%; margin-top: 10px;">
        <tr>
          <td style="padding: 6px 0;"><b>Quotation No:</b></td>
          <td>${quotationCode}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0;"><b>Customer:</b></td>
          <td>${customerName}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0;"><b>Date:</b></td>
          <td>${quotationDate}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0;"><b>Total Amount:</b></td>
          <td>${totalFormatted}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0;"><b>Status:</b></td>
          <td>${statusText}</td>
        </tr>
      </table>

      <p style="margin-top: 20px;">Regards,<br/><b>Your Company</b></p>
    </div>
  `;
};
