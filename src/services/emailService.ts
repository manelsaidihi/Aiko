import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const FRONTEND_URL = process.env.FRONTEND_URL || 'https://aiko-app.onrender.com';

export const sendVerificationEmail = async (email: string, token: string) => {
  const verificationUrl = `${FRONTEND_URL}/verify-email?token=${token}`;

  const mailOptions = {
    from: `"Aiko" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Aiko - Confirm your email / تأكيد البريد الإلكتروني',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #0F6E56; text-align: center;">Welcome to Aiko | مرحباً بك في آيكو</h2>
        <p>Please confirm your email address by clicking the button below:</p>
        <p style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" style="background-color: #0F6E56; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Confirm Email | تأكيد البريد</a>
        </p>
        <p>This link is valid for 24 hours.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="text-align: right; direction: rtl;">يرجى تأكيد بريدك الإلكتروني من خلال الضغط على الزر أعلاه. الرابط صالح لمدة 24 ساعة.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

export const sendResetPasswordEmail = async (email: string, token: string) => {
  const resetUrl = `${FRONTEND_URL}/reset-password?token=${token}`;

  const mailOptions = {
    from: `"Aiko" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Aiko - Reset Password / إعادة تعيين كلمة المرور',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #D4891A; text-align: center;">Reset Password | إعادة تعيين كلمة المرور</h2>
        <p>You requested to reset your password. Click the button below to proceed:</p>
        <p style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #D4891A; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password | تعيين كلمة جديدة</a>
        </p>
        <p>This link is valid for 1 hour.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="text-align: right; direction: rtl;">لقد طلبت إعادة تعيين كلمة المرور. اضغط على الزر أعلاه للمتابعة. الرابط صالح لمدة ساعة واحدة.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};
