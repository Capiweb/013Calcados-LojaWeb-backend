import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const DEV_MODE = process.env.NODE_ENV !== 'production';
const DEV_EMAIL = 'cavaleirooficia@gmail.com';

export const sendPasswordResetCode = async (email, code) => {
  const toEmail = DEV_MODE ? DEV_EMAIL : email;

  if (DEV_MODE) {
    console.log(`🔑 [DEV] Código para ${email}: ${code}`);
  }

  return resend.emails.send({
    from: process.env.RESEND_FROM || '013 Calçados <onboarding@resend.dev>',
    to: toEmail,
    subject: DEV_MODE ? `[DEV] Código de recuperação` : 'Código de recuperação de senha',
    html: `
      ${DEV_MODE ? `<p style="color: #6b7680; font-size: 12px;">🔧 Modo desenvolvimento — código real: <strong>${code}</strong> (destinatário original: ${email})</p>` : ''}
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #101727;">Recuperação de Senha</h2>
        <p>Olá! Recebemos uma solicitação para redefinir sua senha.</p>
        <p>Seu código de verificação é:</p>
        <div style="background: #f2f4f6; padding: 16px; text-align: center; border-radius: 8px; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #101727;">${code}</span>
        </div>
        <p style="color: #6b7680; font-size: 14px;">Este código expira em 10 minutos.</p>
        <p style="color: #6b7680; font-size: 14px;">Se você não solicitou essa alteração, ignore este email.</p>
      </div>
    `,
  });
};
