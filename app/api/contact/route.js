import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// Konfiguracija email transportera
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export async function POST(request) {
  try {
    const { name, email, subject, message } = await request.json();

    // Validacija
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'Sva polja su obavezna' },
        { status: 400 }
      );
    }

    // Slanje emaila
    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: process.env.CONTACT_EMAIL,
      subject: `Nova poruka od ${name}: ${subject}`,
      text: `
        Ime: ${name}
        Email: ${email}
        Predmet: ${subject}
        
        Poruka:
        ${message}
      `,
      html: `
        <h2>Nova poruka s web stranice</h2>
        <p><strong>Ime:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Predmet:</strong> ${subject}</p>
        <p><strong>Poruka:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { error: 'Greška pri slanju poruke' },
      { status: 500 }
    );
  }
} 