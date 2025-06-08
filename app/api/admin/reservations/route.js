import { NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabase';

// GET /api/admin/reservations - Dohvati sve rezervacije
export async function GET() {
  try {
    const { data: reservations, error } = await supabase
      .from('reservations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json(reservations);
  } catch (error) {
    console.error('Error fetching reservations:', error);
    return NextResponse.json(
      { error: error.message },
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

    const { data: reservation, error } = await supabase
      .from('reservations')
      .update({ status })
      .eq('id', parseInt(id))
      .select()
      .single();

    if (error) throw error;

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

    const { data: reservation, error } = await supabase
      .from('reservations')
      .delete()
      .eq('id', parseInt(id))
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting reservation:', error);
    return NextResponse.json(
      { error: 'Greška pri brisanju rezervacije' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { data: reservation, error } = await supabase
      .from('reservations')
      .insert([body])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(reservation);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 