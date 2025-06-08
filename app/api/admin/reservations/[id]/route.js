import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/admin/reservations/[id] - Dohvati pojedinačnu rezervaciju
export async function GET(request, { params }) {
  try {
    const { id } = params;
    const reservation = await prisma.reservation.findUnique({
      where: { id: parseInt(id) }
    });

    if (!reservation) {
      return NextResponse.json(
        { error: 'Rezervacija nije pronađena' },
        { status: 404 }
      );
    }

    return NextResponse.json({ reservation });
  } catch (error) {
    console.error('Error fetching reservation:', error);
    return NextResponse.json(
      { error: 'Greška pri dohvaćanju rezervacije' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/reservations/[id] - Ažuriraj rezervaciju
export async function PATCH(request, { params }) {
  try {
    const { id } = params;
    const data = await request.json();

    // Validacija statusa
    if (data.status && !['pending', 'confirmed', 'cancelled'].includes(data.status)) {
      return NextResponse.json(
        { error: 'Nevažeći status rezervacije' },
        { status: 400 }
      );
    }

    const reservation = await prisma.reservation.update({
      where: { id: parseInt(id) },
      data
    });

    return NextResponse.json({ reservation });
  } catch (error) {
    console.error('Error updating reservation:', error);
    return NextResponse.json(
      { error: 'Greška pri ažuriranju rezervacije' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/reservations/[id] - Obriši rezervaciju
export async function DELETE(request, { params }) {
  try {
    const { id } = params;

    await prisma.reservation.delete({
      where: { id: parseInt(id) }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting reservation:', error);
    return NextResponse.json(
      { error: 'Greška pri brisanju rezervacije' },
      { status: 500 }
    );
  }
} 