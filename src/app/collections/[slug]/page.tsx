"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";

type Watch = {
  id: string;
  name: string;
  collection: string;
  brand?: string;
  category?: string;
  price: number;
  originalPrice: number;
  image: string;
  stock: number;
  rating: number;
  reviews: number;
  specs: { caseSize: string; movement: string };
};

function CollectionContent() {
  const { slug } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [watches, setWatches] = useState<Watch[]>([]);
  const [filteredWatches, setFilteredWatches] = useState<Watch[]>([]);
  const [loading, setLoading] = useState(true);

  // Map slug to human readable name
  const collectionName = (slug as string).split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

  useEffect(() => {
    async function fetchData() {
      const search = searchParams.get("search") || "";
      const isOfferPage = slug === "ofertas";
      
      const res = await fetch(`/api/watches?search=${search}`);
      const data: Watch[] = await res.json();
      setWatches(data);
      
      let filtered = data;
      if (isOfferPage) {
        filtered = data.filter(w => (w as any).isOffer === true);
      } else if (slug !== "todos") {
        filtered = data.filter(w => {
          const target = (slug as string).toLowerCase().replace(/-/g, " ");
          const wColl = w.collection.toLowerCase();
          const wBrand = (w.brand || "").toLowerCase();
          const wCat = (w.category || "").toLowerCase();
          
          return (
            wColl.includes(target) || 
            target.includes(wColl) || 
            wBrand.includes(target) || 
            target.includes(wBrand) ||
            wCat.includes(target) ||
            target.includes(wCat)
          );
        });
      }
      
      setFilteredWatches(filtered);
      setLoading(false);
    }
    fetchData();
  }, [slug, searchParams]);

  return (
    <div className="collection-page">
      <Header />

      <div className="container breadcrumbs">
        <Link href="/">INICIO</Link> <span>&gt;</span> <span className="current">{collectionName.toUpperCase()}</span>
      </div>

      <header className="collection-header">
        <h1>{collectionName}</h1>
      </header>

      <div className="container main-layout">
        <aside className="sidebar">
          <div className="filter-group">
            <h3>COLECCIÓN ▾</h3>
            <ul>
              <li onClick={() => router.push("/collections/pro-diver")}>Pro Diver</li>
              <li onClick={() => router.push("/collections/venom")}>Venom</li>
              <li onClick={() => router.push("/collections/reserve")}>Reserve</li>
              <li onClick={() => router.push("/collections/damas")}>Damas</li>
            </ul>
          </div>
          <div className="filter-group">
            <h3>PRECIO ▾</h3>
            <div className="price-inputs">
              <input type="number" placeholder="Min" />
              <span>-</span>
              <input type="number" placeholder="Max" />
            </div>
          </div>
          <div className="filter-group">
            <h3>DIÁMETRO ▾</h3>
            <ul>
              <li>40mm</li>
              <li>48mm</li>
              <li>52mm</li>
            </ul>
          </div>
        </aside>

        <main className="product-listing">
          <div className="listing-controls">
            <span className="count">{filteredWatches.length} Productos</span>
            <div className="sort-group">
              <label>Mostrar</label>
              <select><option>20</option></select>
              <label>Ordenar por</label>
              <select><option>Destacados</option></select>
            </div>
          </div>

          {loading ? (
            <div className="loading">Consultando inventario...</div>
          ) : (
            <div className="product-grid">
              {filteredWatches.map((watch) => (
                <article key={watch.id} className="product-card">
                  <Link href={`/products/${watch.id}`} className="card-link">
                    <div className="image-box">
                      <div className="discount-tag">-{Math.round((1 - watch.price / watch.originalPrice) * 100)}%</div>
                      <img src={watch.image} alt={watch.name} />
                    </div>
                    <div className="info-box">
                      <div className="stars">{"★".repeat(5)} <span className="rev">({watch.reviews})</span></div>
                      <h3>Reloj Para {watch.collection === 'Damas' ? 'Dama' : 'Hombre'} {watch.name}</h3>
                      <div className="prices">
                        <span className="old">${watch.originalPrice.toLocaleString('es-CO')}</span>
                        <span className="new">${watch.price.toLocaleString('es-CO')} COP</span>
                      </div>
                    </div>
                  </Link>
                </article>
              ))}
            </div>
          )}
        </main>
      </div>

      <style jsx>{`
        .collection-page { background: #fff; min-height: 100vh; color: #333; }
        
        .breadcrumbs { padding: 20px 0; font-size: 12px; color: #888; }
        .breadcrumbs span { margin: 0 10px; }
        .breadcrumbs .current { color: #000; font-weight: bold; }

        .collection-header { text-align: center; padding: 40px 0; border-bottom: 1px solid #eee; margin-bottom: 40px; }
        .collection-header h1 { font-size: 36px; font-weight: 900; font-style: italic; border-bottom: 3px solid #bf953f; display: inline-block; padding-bottom: 5px; }

        .main-layout { display: grid; grid-template-columns: 250px 1fr; gap: 40px; padding-bottom: 80px; }

        .sidebar { border-right: 1px solid #eee; padding-right: 20px; }
        .filter-group { margin-bottom: 30px; }
        .filter-group h3 { font-size: 14px; font-weight: bold; border-bottom: 1px solid #eee; padding-bottom: 10px; margin-bottom: 15px; }
        .filter-group ul { list-style: none; }
        .filter-group li { padding: 8px 0; font-size: 13px; cursor: pointer; color: #555; }
        .filter-group li:hover { color: #bf953f; }
        
        .price-inputs { display: flex; align-items: center; gap: 10px; }
        .price-inputs input { width: 80px; padding: 5px; border: 1px solid #eee; border-radius: 4px; font-size: 12px; }

        .listing-controls { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 1px solid #eee; font-size: 13px; }
        .sort-group { display: flex; gap: 10px; align-items: center; }
        .sort-group select { padding: 5px; border: 1px solid #eee; border-radius: 4px; }

        .product-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
        .product-card { border: 1px solid #eee; transition: 0.3s; }
        .product-card:hover { border-color: #bf953f; transform: translateY(-3px); }
        .card-link { text-decoration: none; color: inherit; }
        
        .image-box { aspect-ratio: 1; background: #fff; position: relative; display: flex; align-items: center; justify-content: center; padding: 20px; }
        .image-box img { max-width: 100%; max-height: 100%; object-fit: contain; }
        .discount-tag { position: absolute; top: 10px; right: 10px; background: #ff0000; color: #fff; padding: 5px 10px; font-size: 12px; font-weight: bold; border-radius: 2px; }

        .info-box { padding: 20px; border-top: 1px solid #f9f9f9; text-align: center; }
        .stars { color: var(--accent-gold); font-size: 10px; margin-bottom: 5px; }
        .rev { color: #888; font-size: 11px; }
        .info-box h3 { font-size: 13px; font-weight: 700; color: #333; margin-bottom: 12px; height: 32px; overflow: hidden; text-transform: uppercase; font-family: var(--font-outfit); }
        
        .prices { display: flex; flex-direction: column; gap: 2px; align-items: center; }
        .old { text-decoration: line-through; color: #999; font-size: 12px; }
        .new { font-size: 18px; font-weight: 900; color: #000; font-family: var(--font-outfit); }

        @media (max-width: 1024px) {
          .main-layout { grid-template-columns: 1fr; padding: 15px; }
          .sidebar { display: none; }
          .product-grid { grid-template-columns: repeat(2, 1fr); gap: 15px; }
        }
        @media (max-width: 600px) {
          .product-grid { grid-template-columns: 1fr; }
          .category-title { font-size: 28px; }
        }
      `}</style>
    </div>
  );
}

export default function CollectionPage() {
  return (
    <Suspense fallback={<div>Cargando colección...</div>}>
      <CollectionContent />
    </Suspense>
  );
}
