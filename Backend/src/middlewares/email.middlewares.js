import {Resend} from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY);


export const sendOtpEmail = async (to, otp) => {
  try {
     const { data, error } = await resend.emails.send({
    from: 'Resend <onboarding@resend.dev>',
    to: to,  // ONLY THIS EMAIL WILL WORK
    subject: 'Verify Your BarberQ Account',
    html: generateOTPEmailTemplate(otp)
  });

      if (error) {
        return console.error({error});
      } else {
        console.log(data);
        
      }

  } catch (error) {
    console.log("Sending Otp email failed", error);
    
  }
}


// Email templates
const generateOTPEmailTemplate = ( otp) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your BarberQ Account</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; color: white; }
        .content { padding: 40px; }
        .otp-box { background: #f8f9fa; border: 2px solid #e9ecef; padding: 25px; text-align: center; font-size: 42px; font-weight: bold; letter-spacing: 15px; margin: 30px 0; border-radius: 10px; font-family: 'Courier New', monospace; color: #212529; }
        .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; color: #856404; }
        .footer { text-align: center; padding: 20px; color: #6c757d; font-size: 12px; border-top: 1px solid #dee2e6; background-color: #f8f9fa; }
        .button { display: inline-block; padding: 14px 28px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; font-weight: 500; }
        @media (max-width: 600px) { .content { padding: 20px; } .otp-box { font-size: 32px; letter-spacing: 10px; } }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="margin: 0; font-size: 28px;">🔐 Email Verification</h1>
            <p style="margin: 10px 0 0; opacity: 0.9;">BarberQ Account Security</p>
        </div>
        <div class="content">
            
            <p>To complete your BarberQ registration and access all features, please verify your email address using the One-Time Password (OTP) below:</p>
            
            <div class="otp-box">${otp}</div>
            
            <div class="warning">
                <strong>⚠️ Important:</strong>
                <ul style="margin: 10px 0; padding-left: 20px;">
                    <li>This OTP will expire in <strong>10 minutes</strong></li>
                    <li>Never share this code with anyone</li>
                    <li>BarberQ will never ask for your OTP</li>
                </ul>
            </div>
            
            <p style="text-align: center;">
                <a href="${process.env.FRONTEND_URL}/verify-email" class="button">Verify Email Address</a>
            </p>
            
            <p style="color: #6c757d; font-size: 14px; margin-top: 30px;">
                If you didn't create a BarberQ account, please ignore this email or contact our security team at <a href="mailto:security@barberq.app">security@barberq.app</a>
            </p>
        </div>
        <div class="footer">
            <p>© ${new Date().getFullYear()} BarberQ. All rights reserved.</p>
            <p>This is an automated message, please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>
`;