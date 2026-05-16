"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.quotationCustomerTemplate = void 0;
const formatCurrency = (v) => {
    return `$${(v ?? 0).toFixed(2)}`;
};
const quotationCustomerTemplate = (data) => {
    const { quotation: q, companyName, companyLogo } = data;
    const customerName = q.customerName || 'Valued Customer';
    const quotationCode = q.uniqueCode || q._id;
    const logoHtml = companyLogo
        ? `<img src="${companyLogo}" alt="${companyName} Logo" width="220" style="display: block; margin: 0px auto 0 auto;" />`
        : `<h2 style="margin: 0; color: #16a34a;">${companyName}</h2>`;
    return `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>Quotation</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: Arial, sans-serif;">
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f4f4;">
        <tr>
            <td align="center" style="padding: 20px 0;">
                <!-- Main Container -->
                <table border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; max-width: 600px;">
                    
                    <tr>
                        <td style="background-color: #f4f4f4; padding-bottom: 20px; color: #ffffff; text-align: center;">
                            ${logoHtml}
                        </td>
                    </tr>

                    <!-- Header -->
                    <tr>
                        <td align="center" style="background-color: #16a34a; padding: 30px; color: #ffffff;">
                            <h1 style="margin: 0; font-size: 28px; font-weight: bold; color: #ffffff;">Quotation</h1>
                            <p style="margin: 5px 0 0 0; font-size: 14px; color: #ffffff;">Thank you for your interest</p>
                        </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                        <td style="padding: 30px; color: #333333; line-height: 1.6; font-size: 15px;">
                            
                            <!-- Greeting -->
                            <p style="margin: 0 0 20px 0; font-size: 16px;">
                                Dear <strong>${customerName}</strong>,
                            </p>

                            <p style="margin: 0 0 20px 0;">
                                Thank you for your inquiry. Please find attached the quotation document (Quotation #${quotationCode}) for your reference.
                            </p>

                            <p style="margin: 20px 0;">
                                If you have any questions or would like to proceed with this quotation, please don't hesitate to contact us.
                            </p>

                            <p style="margin: 30px 0 0 0;">
                                Best regards,<br>
                                <b>${companyName}</b>
                            </p>

                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td align="center" style="background-color: #f4f4f4; padding: 20px 30px; color: #777777; font-size: 13px;">
                            <p style="margin: 0 0 10px 0;">
                                <strong>${companyName}</strong><br>                                Website: <a href="https://sadhguruinfotech.com" style="color: #16a34a; text-decoration: none;">sadhguruinfotech.com</a>
                            </p>
                            <p style="margin: 15px 0 0 0; font-size: 12px; color: #777777;">
                                © 2025 ${companyName}. All rights reserved.
                            </p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>
  `;
};
exports.quotationCustomerTemplate = quotationCustomerTemplate;
//# sourceMappingURL=quotationCustomer.template.js.map