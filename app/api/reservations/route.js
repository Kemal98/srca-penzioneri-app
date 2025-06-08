import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// Konfiguracija email transportera
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

export async function POST(request) {
  try {
    const data = await request.json();
    
    // Validacija datuma
    const checkIn = new Date(data.checkIn);
    const checkOut = new Date(data.checkOut);
    const today = new Date();
    
    if (checkIn < today) {
      return NextResponse.json(
        { error: 'Datum dolaska ne može biti u prošlosti' },
        { status: 400 }
      );
    }
    
    if (checkOut <= checkIn) {
      return NextResponse.json(
        { error: 'Datum odlaska mora biti nakon datuma dolaska' },
        { status: 400 }
      );
    }

    // Ovdje bi išao kod za spremanje u bazu podataka
    // Za sada samo simulirajmo uspješno spremanje
    
    // Slanje email potvrde
    const emailContent = `
      <h2>Potvrda rezervacije</h2>
      <p>Poštovani ${data.name},</p>
      <p>Vaša rezervacija je uspješno primljena.</p>
      <h3>Detalji rezervacije:</h3>
      <ul>
        <li>Dolazak: ${data.checkIn}</li>
        <li>Odlazak: ${data.checkOut}</li>
        <li>Broj gostiju: ${data.guests}</li>
        <li>Tip smještaja: ${data.roomType}</li>
      </ul>
      <p>Uskoro ćemo vas kontaktirati za potvrdu i dodatne informacije.</p>
      <p>S poštovanjem,<br>Tim Ajdinovići</p>
    `;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: data.email,
      subject: 'Potvrda rezervacije - Ajdinovići',
      html: emailContent
    });

    // Slanje emaila administratoru
    const adminEmailContent = `
      <h2>Nova rezervacija</h2>
      <p>Detalji rezervacije:</p>
      <ul>
        <li>Ime: ${data.name}</li>
        <li>Email: ${data.email}</li>
        <li>Telefon: ${data.phone}</li>
        <li>Dolazak: ${data.checkIn}</li>
        <li>Odlazak: ${data.checkOut}</li>
        <li>Broj gostiju: ${data.guests}</li>
        <li>Tip smještaja: ${data.roomType}</li>
        <li>Posebni zahtjevi: ${data.specialRequests || 'Nema'}</li>
      </ul>
    `;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.ADMIN_EMAIL,
      subject: 'Nova rezervacija - Ajdinovići',
      html: adminEmailContent
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Rezervacija uspješno spremljena' 
    });

  } catch (error) {
    console.error('Error processing reservation:', error);
    return NextResponse.json(
      { error: 'Došlo je do greške prilikom obrade rezervacije' },
      { status: 500 }
    );
  }
} 