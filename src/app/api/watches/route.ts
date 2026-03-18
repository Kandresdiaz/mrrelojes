import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search');
  const limit = parseInt(searchParams.get('limit') || '20', 10);
  const offset = parseInt(searchParams.get('offset') || '0', 10);

  let query = supabase.from('watches').select('*', { count: 'exact' });

  if (search) {
    query = query.or(`name.ilike.%${search}%,collection.ilike.%${search}%,description.ilike.%${search}%,brand.ilike.%${search}%,category.ilike.%${search}%`);
  }

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const formattedData = (data || []).map(w => ({
    id: w.id,
    name: w.name,
    collection: w.collection,
    price: w.price,
    originalPrice: w.original_price,
    image: w.image,
    gallery: w.gallery,
    description: w.description,
    specs: w.specs,
    stock: w.stock,
    rating: w.rating,
    reviews: w.reviews,
    isOffer: w.is_offer,
    brand: w.brand,
    category: w.category
  }));

  return NextResponse.json({ items: formattedData, total: count ?? 0 });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const id = body.id || 'watch-' + Date.now().toString();

    const dbPayload = {
      id: id,
      name: body.name,
      collection: body.collection,
      category: body.category,
      price: Number(body.price),
      original_price: Number(body.originalPrice),
      image: body.image,
      gallery: body.gallery || [],
      description: body.description,
      specs: body.specs,
      stock: Number(body.stock) || 0,
      rating: Number(body.rating) || 5,
      reviews: Number(body.reviews) || 0,
      is_offer: body.isOffer || false,
      brand: body.brand
    };

    const { data, error } = await supabase.from('watches').upsert(dbPayload).select();

    if (error) throw error;

    return NextResponse.json(data[0], { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
