import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  const { data, error } = await supabase.from('slider').select('*').order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Map database fields to frontend fields
  const formattedData = data.map(s => ({
    id: s.id,
    image: s.image,
    badge: s.badge,
    headline: s.headline,
    subheadline: s.subheadline,
    price: s.price,
    buttonText: s.button_text,
    isYellowPrice: s.is_yellow_price
  }));

  return NextResponse.json(formattedData);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const id = body.id || 'slide-' + Date.now();

    const dbPayload = {
      id: id,
      image: body.image,
      badge: body.badge,
      headline: body.headline,
      subheadline: body.subheadline,
      price: body.price,
      button_text: body.buttonText,
      is_yellow_price: body.isYellowPrice
    };

    const { data, error } = await supabase.from('slider').upsert(dbPayload).select();

    if (error) throw error;

    return NextResponse.json(data[0], { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    const { error } = await supabase.from('slider').delete().eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
