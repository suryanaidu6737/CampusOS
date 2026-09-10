/**
 * Transactional Email Service for CampusOS AI
 * Handles activation email delivery via Resend API
 */

export const sendActivationEmail = async ({ to, name, institutionalId, activationCode }) => {
  const provider = (process.env.EMAIL_PROVIDER || '').toLowerCase();
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.EMAIL_FROM || 'CampusOS <no-reply@campusos.edu>';

  if (provider !== 'resend' || !apiKey || apiKey.trim() === '') {
    throw new Error('Email service is not configured. (Missing RESEND_API_KEY or EMAIL_PROVIDER)');
  }

  const subject = 'Activate your CampusOS account';

  const textBody = `Hello ${name},

Your institution has created a CampusOS account for you.

Institutional ID:
${institutionalId}

Your CampusOS activation code is:

${activationCode}

This code expires in 24 hours and can only be used once.

To activate your account, open the CampusOS portal and select:

"Activate your account"

Then enter your institutional ID and activation code and create your password.

If you did not expect this account, please contact your institution administrator.

Regards,
CampusOS`;

  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #0f172a; }
    .card { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; padding: 32px; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.05); }
    .header { font-size: 20px; font-weight: 900; color: #0284c7; letter-spacing: -0.5px; margin-bottom: 24px; }
    .greeting { font-size: 16px; font-weight: 700; color: #1e293b; margin-bottom: 12px; }
    .text { font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 20px; }
    .code-box { background: #f0f9ff; border: 2px dashed #0284c7; border-radius: 12px; padding: 16px; text-align: center; margin: 24px 0; }
    .code-title { font-size: 11px; font-weight: 800; text-transform: uppercase; color: #0369a1; letter-spacing: 1px; margin-bottom: 4px; }
    .code-val { font-family: monospace; font-size: 28px; font-weight: 900; color: #0284c7; letter-spacing: 4px; }
    .info-item { font-size: 13px; font-weight: 600; color: #334155; margin-bottom: 8px; }
    .footer { border-t: 1px solid #f1f5f9; margin-top: 32px; padding-top: 16px; font-size: 12px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">CampusOS AI</div>
    <div class="greeting">Hello ${name},</div>
    <div class="text">Your institution has created a CampusOS account for you.</div>

    <div class="info-item">Institutional ID: <strong>${institutionalId}</strong></div>

    <div class="code-box">
      <div class="code-title">Your Activation Code</div>
      <div class="code-val">${activationCode}</div>
    </div>

    <div class="text">
      This code expires in 24 hours and can only be used once.<br><br>
      To activate your account, open the CampusOS portal, select <strong>"Activate your account"</strong>, enter your institutional ID and activation code, and create your password.
    </div>

    <div class="text" style="font-size: 12px; color: #64748b;">
      If you did not expect this account, please contact your institution administrator.
    </div>

    <div class="footer">
      Regards,<br>
      <strong>CampusOS Team</strong>
    </div>
  </div>
</body>
</html>`;

  // Execute HTTP Request to Resend API
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey.trim()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [to],
      subject: subject,
      text: textBody,
      html: htmlBody,
    }),
  });

  const resData = await response.json();

  if (!response.ok) {
    console.error('[Resend Error]:', resData);
    throw new Error(resData.message || resData.name || 'Failed to deliver activation email via Resend');
  }

  return { success: true, id: resData.id };
};
