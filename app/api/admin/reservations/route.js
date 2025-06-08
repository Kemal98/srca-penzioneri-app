import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/admin/reservations - Dohvati sve rezervacije
export async function GET() {
  try {
    const reservations = await prisma.reservation.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ reservations });
  } catch (error) {
    console.error('Error fetching reservations:', error);
    return NextResponse.json(
      { error: 'Greška pri dohvaćanju rezervacija' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/reservations/[id] - Ažuriraj status rezervacije
export async function PATCH(request, { params }) {
  try {
    const { id } = params;
    const { status } = await request.json();

    if (!['pending', 'confirmed', 'cancelled'].includes(status)) {
      return NextResponse.json(
        { error: 'Nevažeći status rezervacije' },
        { status: 400 }
      );
    }

    const reservation = await prisma.reservation.update({
      where: { id: parseInt(id) },
      data: { status }
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