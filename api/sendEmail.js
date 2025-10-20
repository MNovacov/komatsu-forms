// /api/sendEmail.js
import { Resend } from 'resend';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  try {
    const { to, subject, html, attachments = [] } = req.body || {};

    if (!to || !subject || !html) {
      return res.status(400).json({ ok: false, error: 'Faltan campos: to, subject, html' });
    }

    // Acepta string o array
    const recipients = Array.isArray(to) ? to : [to];

    const resend = new Resend(process.env.RESEND_API_KEY);

    const result = await resend.emails.send({
      from: 'Komatsu Reportes <noreply@komatsu.com>',
      to: recipients,
      subject,
      html,
      // Adjuntos opcionales por URL (p. ej. PDF de Uploadcare)
      attachments: attachments.map(a => ({
        filename: a.filename,
        path: a.path, // URL pública al PDF
      })),
    });

    return res.status(200).json({ ok: true, result });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, error: err.message });
  }
}
