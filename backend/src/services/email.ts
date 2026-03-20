import { Resend } from 'resend';

// Only initialize Resend if API key is provided
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const EMAIL_FROM = process.env.EMAIL_FROM || 'DMAIC App <noreply@dmaic.app>';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

async function sendEmail({ to, subject, html }: EmailOptions): Promise<boolean> {
  try {
    if (!resend) {
      console.log('📧 Email (mode simulation - pas de clé API):');
      console.log(`  To: ${to}`);
      console.log(`  Subject: ${subject}`);
      console.log(`  Content: ${html.substring(0, 200)}...`);
      return true;
    }

    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to,
      subject,
      html,
    });

    if (error) {
      console.error('Erreur envoi email:', error);
      return false;
    }

    console.log('Email envoyé:', data?.id);
    return true;
  } catch (error) {
    console.error('Erreur service email:', error);
    return false;
  }
}

// Email de bienvenue après approbation
export async function sendWelcomeEmail(
  to: string,
  firstName: string
): Promise<boolean> {
  const subject = 'Bienvenue sur DMAIC App - Votre compte a été approuvé';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Bienvenue sur DMAIC App</h1>
        </div>
        <div class="content">
          <p>Bonjour <strong>${firstName}</strong>,</p>
          <p>Excellente nouvelle ! Votre demande d'accès a été <strong>approuvée</strong>.</p>
          <p>Vous pouvez maintenant vous connecter à l'application et commencer à gérer vos projets DMAIC.</p>
          <p style="text-align: center;">
            <a href="${FRONTEND_URL}/login" class="button">Se connecter</a>
          </p>
          <p>Si vous avez des questions, n'hésitez pas à contacter l'administrateur.</p>
          <p>Cordialement,<br>L'équipe DMAIC App</p>
        </div>
        <div class="footer">
          <p>Cet email a été envoyé automatiquement. Merci de ne pas y répondre.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({ to, subject, html });
}

// Email de rejet
export async function sendRejectionEmail(
  to: string,
  firstName: string,
  reason?: string
): Promise<boolean> {
  const subject = 'DMAIC App - Demande d\'accès non approuvée';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #ef4444; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
        .reason { background: #fee2e2; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Demande d'accès</h1>
        </div>
        <div class="content">
          <p>Bonjour <strong>${firstName}</strong>,</p>
          <p>Nous sommes désolés de vous informer que votre demande d'accès à DMAIC App n'a pas été approuvée.</p>
          ${reason ? `<div class="reason"><strong>Raison :</strong> ${reason}</div>` : ''}
          <p>Si vous pensez qu'il s'agit d'une erreur, veuillez contacter l'administrateur.</p>
          <p>Cordialement,<br>L'équipe DMAIC App</p>
        </div>
        <div class="footer">
          <p>Cet email a été envoyé automatiquement. Merci de ne pas y répondre.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({ to, subject, html });
}

// Email de réinitialisation de mot de passe
export async function sendPasswordResetEmail(
  to: string,
  firstName: string,
  resetToken: string
): Promise<boolean> {
  const resetUrl = `${FRONTEND_URL}/reset-password?token=${resetToken}`;
  const subject = 'DMAIC App - Réinitialisation de votre mot de passe';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .warning { background: #fef3c7; padding: 15px; border-radius: 5px; margin: 15px 0; color: #92400e; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        .link { word-break: break-all; color: #667eea; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔐 Réinitialisation du mot de passe</h1>
        </div>
        <div class="content">
          <p>Bonjour <strong>${firstName}</strong>,</p>
          <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
          <p>Cliquez sur le bouton ci-dessous pour définir un nouveau mot de passe :</p>
          <p style="text-align: center;">
            <a href="${resetUrl}" class="button">Réinitialiser mon mot de passe</a>
          </p>
          <p>Ou copiez ce lien dans votre navigateur :</p>
          <p class="link">${resetUrl}</p>
          <div class="warning">
            <strong>⚠️ Important :</strong> Ce lien expire dans 1 heure. Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.
          </div>
          <p>Cordialement,<br>L'équipe DMAIC App</p>
        </div>
        <div class="footer">
          <p>Cet email a été envoyé automatiquement. Merci de ne pas y répondre.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({ to, subject, html });
}

// Email de confirmation de changement de mot de passe
export async function sendPasswordChangedEmail(
  to: string,
  firstName: string
): Promise<boolean> {
  const subject = 'DMAIC App - Votre mot de passe a été modifié';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #22c55e; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
        .warning { background: #fee2e2; padding: 15px; border-radius: 5px; margin: 15px 0; color: #991b1b; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ Mot de passe modifié</h1>
        </div>
        <div class="content">
          <p>Bonjour <strong>${firstName}</strong>,</p>
          <p>Votre mot de passe DMAIC App a été modifié avec succès.</p>
          <div class="warning">
            <strong>⚠️ Si vous n'êtes pas à l'origine de cette modification</strong>, contactez immédiatement l'administrateur.
          </div>
          <p>Cordialement,<br>L'équipe DMAIC App</p>
        </div>
        <div class="footer">
          <p>Cet email a été envoyé automatiquement. Merci de ne pas y répondre.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({ to, subject, html });
}

export default {
  sendWelcomeEmail,
  sendRejectionEmail,
  sendPasswordResetEmail,
  sendPasswordChangedEmail,
};
