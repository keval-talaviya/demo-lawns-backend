export interface InvoiceFranchiseEmailData {
  invoiceNumber: string;
  customerName: string;
  franchiseName: string;
  customerEmail: string;
  issuedDate: Date;
  totalAmount: number;
  paidAmount: number;
  paymentStatus: string;
  jobAddress?: string;
  companyName?: string;
  companyLogo?: string;
}

const formatCurrency = (v: number) => {
  return `$${(v ?? 0).toFixed(2)}`;
};

export const invoiceFranchiseTemplate = (data: InvoiceFranchiseEmailData): string => {
  const franchiseName = data.franchiseName || 'Franchise';
  const customerName = data.customerName || 'Customer';
  const customerEmail = data.customerEmail || '—';
  const invoiceNumber = data.invoiceNumber || 'N/A';
  const companyName = data.companyName || 'Your Company';
  const companyLogo = data.companyLogo;
  const invoiceDate = data.issuedDate
    ? new Date(data.issuedDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
    : '—';

  const totalHtml = formatCurrency(data.totalAmount ?? 0);
  const paidHtml = formatCurrency(data.paidAmount ?? 0);

  const paymentStatusBadge = data.paymentStatus === 'PAID'
    ? '<span style="background:#4CAF50;color:#fff;padding:4px 12px;border-radius:4px;font-size:12px;">PAID</span>'
    : '<span style="background:#FF9800;color:#fff;padding:4px 12px;border-radius:4px;font-size:12px;">UNPAID</span>';

  const logoHtml = companyLogo
    ? `<img src="${companyLogo}" alt="${companyName} Logo" width="150" style="display: block; margin: 0 0 10px 0;" />`
    : `<h2 style="color:#2196F3; margin-bottom:6px;">Invoice Sent Confirmation</h2>`;

  return `
  <div style="font-family:Arial, sans-serif; color:#333; max-width:700px;">
    ${logoHtml}

    <p style="margin:4px 0 12px 0;">
      Hi <strong>${franchiseName}</strong>,<br/>
      An invoice has been successfully sent to your customer.
    </p>

    <div style="background:#f5f5f5; padding:16px; border-radius:8px; margin-bottom:16px;">
      <h3 style="margin:0 0 12px 0; color:#555;">Invoice Details</h3>
      
      <table style="width:100%;">
        <tr>
          <td style="padding:4px 0; width:40%;"><strong>Invoice Number:</strong></td>
          <td style="padding:4px 0;">${invoiceNumber}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;"><strong>Date Issued:</strong></td>
          <td style="padding:4px 0;">${invoiceDate}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;"><strong>Customer:</strong></td>
          <td style="padding:4px 0;">${customerName}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;"><strong>Customer Email:</strong></td>
          <td style="padding:4px 0;">${customerEmail}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;"><strong>Job Address:</strong></td>
          <td style="padding:4px 0;">${data.jobAddress || '—'}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;"><strong>Total Amount:</strong></td>
          <td style="padding:8px 0; font-size:16px;"><strong>${totalHtml}</strong></td>
        </tr>
        <tr>
          <td style="padding:4px 0;"><strong>Paid Amount:</strong></td>
          <td style="padding:4px 0; color:#4CAF50;"><strong>${paidHtml}</strong></td>
        </tr>
        <tr>
          <td style="padding:4px 0;"><strong>Payment Status:</strong></td>
          <td style="padding:4px 0;">${paymentStatusBadge}</td>
        </tr>
      </table>
    </div>

    <p style="background:#E3F2FD; padding:12px; border-left:4px solid #2196F3; margin:16px 0;">
      ✅ The invoice has been sent to <strong>${customerEmail}</strong>
    </p>

    <p style="color:#666; font-size:13px; margin-top:18px;">
      This is an automated notification from the ${companyName} CRM system.
    </p>

    <p style="margin-top:18px;">Best regards,<br/><strong>${companyName} CRM</strong></p>
  </div>
  `;
};
