import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const id = params.id;

    const { data: productData, error: productError } = await supabase
      .from('watches')
      .select('*')
      .eq('id', id)
      .single();

    if (productError || !productData) {
      return NextResponse.json({ error: 'Watch not found' }, { status: 404 });
    }

    const { data: relatedData, error: relatedError } = await supabase
      .from('watches')
      .select('*')
      .eq('brand', productData.brand || 'Invicta')
      .neq('id', id)
      .limit(8);

    const formatWatch = (w: any) => ({
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
    });

    return NextResponse.json({
      watch: formatWatch(productData),
      related: (relatedData || []).map(formatWatch)
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
