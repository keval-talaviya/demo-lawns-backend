"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mail_sercice_1 = require("./services/mail.sercice");
(async () => {
    await (0, mail_sercice_1.sendEmail)({
        to: 'info.sadhguruinfotech@gmail.com',
        subject: '📄 New Quotation Created — Your Company',
        html: `
    <!doctype html>
    <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      <title>New Quotation — Your Company</title>
      <style>
        @media only screen and (max-width: 600px) {
          .container { width: 100% !important; padding: 16px !important; }
          .cta { display: block !important; width: 100% !important; text-align: center !important; }
          .btn { display: block !important; width: 100% !important; text-align: center !important; }
        }
        @media only screen and (max-width: 480px) {
          .container { width: 100% !important; padding: 16px !important; }
          .cta { display: block !important; width: 100% !important; text-align: center !important; }
          .btn { display: block !important; width: 100% !important; text-align: center !important; }
        }
      </style>
    </head>
    <body style="margin:0; padding:0; background:#f4f6f8; font-family:-apple-system, BlinkMacSystemFont,'Segoe UI',Roboto,Arial; color:#333;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8; padding:24px 0;">
        <tr>
          <td align="center">
            <table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" style="background:#fff; border-radius:8px; overflow:hidden; box-shadow:0 4px 18px rgba(0,0,0,0.06);">

              <!-- Header -->
              <tr>
                <td style="padding:18px 24px; background:linear-gradient(90deg,#2E8B57,#145A32); color:#fff;">
                  <table role="presentation" width="100%">
                    <tr>
                      <td><img src="https://sadhguruinfotech.com/logo.png" alt="Your Company" width="140" style="display:block; border:0;"></td>
                      <td style="text-align:right;">
                        <strong style="font-size:16px;">Your Company</strong><br/>
                        <span style="font-size:12px; opacity:0.9;">Professional Lawn & Garden Management</span>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Intro -->
              <tr>
                <td style="padding:20px 24px 10px 24px;">
                  <p style="margin:0 0 8px; font-size:16px;">Hello Team,</p>
                  <p style="margin:0; color:#555;">A new quotation has been generated in your CRM system. Here's a quick summary:</p>
                </td>
              </tr>

              <!-- Summary Table -->
              <tr>
                <td style="padding:12px 24px;">
                  <table width="100%" style="border-collapse:collapse; background:#fbfbfb; border:1px solid #eef1ef; border-radius:6px;">
                    <tr>
                      <td style="padding:10px;"><strong>Quotation No:</strong></td>
                      <td style="padding:10px;">QTN-2025-001</td>
                    </tr>
                    <tr>
                      <td style="padding:10px;"><strong>Customer:</strong></td>
                      <td style="padding:10px;">John Doe</td>
                    </tr>
                    <tr>
                      <td style="padding:10px;"><strong>Date:</strong></td>
                      <td style="padding:10px;">Nov 09, 2025</td>
                    </tr>
                    <tr>
                      <td style="padding:10px;"><strong>Total Amount:</strong></td>
                      <td style="padding:10px; color:#2E8B57; font-weight:600;">$12,500.00</td>
                    </tr>
                    <tr>
                      <td style="padding:10px;"><strong>Status:</strong></td>
                      <td style="padding:10px;">Sent</td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- CTA -->
              <tr>
                <td style="padding:16px 24px;">
                  <a href="https://sadhguruinfotech.com/franchise/quotations/123456"
                     class="cta"
                     style="background:#2E8B57; color:#fff; padding:12px 18px; border-radius:8px; text-decoration:none; font-weight:600;">
                    View Quotation in Dashboard
                  </a>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding:18px 24px; border-top:1px solid #eef1ef;">
                  <p style="margin:0; font-weight:600;">Your Company Management</p>
                  <p style="margin:6px 0; font-size:13px; color:#666;">
                    info.sadhguruinfotech@gmail.com | sadhguruinfotech.com
                  </p>
                  <p style="margin:10px 0 0; font-size:12px; color:#888;">
                    © 2025 Sadhguru Infotech. All rights reserved.
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
    `,
    });
})();
//# sourceMappingURL=testMailer.js.map