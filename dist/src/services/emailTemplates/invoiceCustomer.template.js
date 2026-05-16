"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.invoiceCustomerTemplate = void 0;
const formatCurrency = (v) => {
    return `$${(v ?? 0).toFixed(2)}`;
};
const invoiceCustomerTemplate = (data) => {
    const customerName = data.customerName || 'Customer';
    const companyName = data.companyName || 'LawnMasterCRM';
    return `
  <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
    
    <div style="background-color: #f0f4f8; padding: 15px; text-align: center; margin-bottom: 20px; border-radius: 5px;">
      <h2 style="margin: 0; color: #5a6b7c;">${companyName}</h2>
    </div>

    <hr style="border: none; border-top: 1px solid #eaeaea; margin: 20px 0;" />

    <div style="background-color: #ffffff; padding: 30px; border-radius: 5px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      <h3 style="margin-top: 0; color: #333;">Hello, ${customerName}</h3>

      <p style="font-size: 16px; line-height: 1.5; color: #555;">
        Please find your invoice attached.
      </p>

      <p style="font-size: 16px; line-height: 1.5; color: #555;">
        Thank you!
      </p>
      <p style="font-size: 15px; margin-top: 20px; font-weight: bold; color: #555;">
        Regards,<br>
        ${companyName}
      </p>
    </div>

    <div style="text-align: center; font-size: 12px; color: #999; margin-top: 20px;">
      &copy; ${new Date().getFullYear()} ${companyName}. All rights reserved.
    </div>

  </div>
  `;
};
exports.invoiceCustomerTemplate = invoiceCustomerTemplate;
//# sourceMappingURL=invoiceCustomer.template.js.map