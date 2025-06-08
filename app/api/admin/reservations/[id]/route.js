import { NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabase';

// GET /api/admin/reservations/[id] - Dohvati pojedinačnu rezervaciju
export async function GET(request, { params }) {
  try {
    const { id } = params;
    const { data: reservation, error } = await supabase
      .from('reservations')
      .select('*')
      .eq('id', parseInt(id))
      .single();

    if (error) throw error;

    return NextResponse.json(reservation);
  } catch (error) {
    console.error('Error fetching reservation:', error);
    return NextResponse.json(
      { error: error.message },
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

    const { data: updatedReservation, error } = await supabase
      .from('reservations')
      .update(data)
      .eq('id', parseInt(id))
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(updatedReservation);
  } catch (error) {
    console.error('Error updating reservation:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/reservations/[id] - Obriši rezervaciju
export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    const { error } = await supabase
      .from('reservations')
      .delete()
      .eq('id', parseInt(id));

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting reservation:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
} 