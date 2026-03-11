"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";

type Watch = {
  id: string;
  name: string;
  collection: string;
  price: number;
  originalPrice: number;
  image: string;
  gallery?: string[];
  description?: string;
  specs: { 
    caseSize: string; 
    movement: string; 
    waterResistance: string;
    material?: string;
    glass?: string;
    clasp?: string;
  };
  stock: number;
  rating: number;
  reviews: number;
};

function ProductDetailContent() {
  const { id } = useParams();
  const [watch, setWatch] = useState<Watch | null>(null);
  const [relatedWatches, setRelatedWatches] = useState<Watch[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState("");

  useEffect(() => {
    async function fetchData() {
      const res = await fetch("/api/watches");
      const data: Watch[] = await res.json();
      const product = data.find((w) => w.id === id);
      
      if (product) {
        setWatch(product);
        setActiveImage(product.image);
        // Shuffle and take 8
        const shuffled = data.filter(w => w.id !== id).sort(() => 0.5 - Math.random());
        setRelatedWatches(shuffled.slice(0, 8));
      }
      setLoading(false);
    }
    fetchData();
  }, [id]);

  if (loading) return <div className="loading-container">Cargando pieza exclusiva...</div>;
  if (!watch) return <div className="error-container">Reloj no encontrado</div>;

  const whatsappMessage = `Hola MrRelojesBga, me interesa el reloj: ${watch.name} ($${watch.price} USD). ¿Sigue disponible?`;
  const whatsappUrl = `https://wa.me/573043695986?text=${encodeURIComponent(whatsappMessage)}`;

  return (
    <div className="pdp-wrapper">
      <Header />

      <div className="container main-grid" style={{marginTop: '40px'}}>
        {/* LEFT COLUMN: IMAGES */}
        <div className="gallery-column">
          <div className="main-image-box">
            <img src={activeImage} alt={watch.name} className="main-img" />
          </div>
          <div className="thumbnails-grid">
            {[watch.image, ...(watch.gallery || [])].map((img, idx) => (
              <div 
                key={idx} 
                className={`thumb-item ${img === activeImage ? 'active' : ''}`}
                onClick={() => setActiveImage(img)}
              >
                <img src={img} alt={`${watch.name} view ${idx}`} />
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT COLUMN: INFO */}
        <div className="info-column">
          <span className="collection-label">PURA MAQUINARIA: {watch.collection}</span>
          <h1 className="product-title">{watch.name}</h1>
          
          <div className="whatsapp-action">
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="btn-whatsapp">
              ¡Oiga mano! Envíeme fotos de este por WhatsApp
            </a>
          </div>

          <div className="price-box">
            <span className="current-price">${watch.price.toLocaleString()} USD</span>
            {watch.stock <= 0 ? (
              <span className="stock-badge out">Ya se lo llevaron</span>
            ) : (
              <span className="stock-badge in">Disponible en Bga ({watch.stock} unidades)</span>
            )}
          </div>

          <div className="actions">
            <button className="btn-buy" disabled={watch.stock <= 0}>
              {watch.stock <= 0 ? 'AGOTADO' : '¡LO QUIERO YA, MANO!'}
            </button>
            <p className="description-text">{watch.description}</p>
          </div>

          <div className="specs-section">
            <h3>Detalles Técnicos</h3>
            <ul className="specs-list">
              <li><strong>Movimiento:</strong> {watch.specs.movement}</li>
              <li><strong>Caja:</strong> {watch.specs.caseSize}</li>
              <li><strong>Resistencia al Agua:</strong> {watch.specs.waterResistance}</li>
              {watch.specs.material && <li><strong>Material:</strong> {watch.specs.material}</li>}
              {watch.specs.glass && <li><strong>Cristal:</strong> {watch.specs.glass}</li>}
              {watch.specs.clasp && <li><strong>Broche:</strong> {watch.specs.clasp}</li>}
            </ul>
          </div>
        </div>
      </div>

      {/* RELATED PRODUCTS */}
      <section className="related-section container">
        <h2 className="related-title">OTROS QUE LE PUEDEN GUSTAR</h2>
        <div className="related-grid">
            {relatedWatches.map((w) => {
              const discount = Math.round(((w.originalPrice - w.price) / w.originalPrice) * 100);
              return (
                <Link href={`/products/${w.id}`} key={w.id} className="related-card">
                  <div className="related-img-box">
                    {discount > 0 && <span className="discount-badge">-{discount}%</span>}
                    <img src={w.image} alt={w.name} />
                  </div>
                  <div className="related-info">
                    <h4 className="related-name">{w.name}</h4>
                    <div className="stars">{"★".repeat(5)} <span className="rev-count">({w.reviews || 0} opiniones)</span></div>
                    <div className="price-stack">
                      {w.originalPrice > w.price && <span className="old-price">${w.originalPrice.toLocaleString()}</span>}
                      <span className="current-p">${w.price.toLocaleString()}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
        </div>
      </section>

      {/* LOCAL TRUST FOOTER */}
      <section className="risk-reversal-footer" style={{marginTop: '80px'}}>
        <div className="container">
          <h2>PALABRA DE SANTANDEREANO: SI NO LE GUSTA, ME LO DEVUELVE</h2>
          <p>En <strong>MrRelojesBga</strong> no jugamos con su tiempo. Le damos <strong>30 días de garantía total</strong>. 
          Si el reloj no lo hace sentir como el más elegante de la sala, me lo devuelve y le devuelvo cada peso. ¡Sin preguntas, mano!</p>
        </div>
      </section>

      <style jsx>{`
        .pdp-wrapper { background: #fff; color: #000; min-height: 100vh; padding-bottom: 50px; font-family: var(--font-outfit); }
        
        .main-grid { display: grid; grid-template-columns: 1.2fr 1fr; gap: 60px; }
        
        .main-image-box { background: #fdfdfd; border: 1px solid #f0f0f0; height: 500px; display: flex; align-items: center; justify-content: center; overflow: hidden; border-radius: 8px; }
        .main-img { max-width: 100%; max-height: 100%; object-fit: contain; }
        
        .thumbnails-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-top: 20px; }
        .thumb-item { border: 1px solid #eee; cursor: pointer; height: 100px; overflow: hidden; border-radius: 4px; transition: 0.3s; }
        .thumb-item.active { border: 2px solid var(--accent-gold); box-shadow: 0 0 10px rgba(212,175,55,0.3); }
        .thumb-item img { width: 100%; height: 100%; object-fit: cover; }

        .collection-label { color: var(--accent-gold); text-transform: uppercase; letter-spacing: 2px; font-weight: 800; font-size: 11px; }
        .product-title { font-size: 36px; font-weight: 900; margin: 10px 0 25px; text-transform: uppercase; line-height: 1.1; }
        
        .btn-whatsapp { 
          background-color: #25D366; 
          color: #fff; 
          padding: 12px 20px; 
          display: block; 
          text-align: center; 
          font-weight: bold; 
          text-decoration: none;
          border-radius: 4px;
          margin-bottom: 20px;
        }

        .price-box { margin-bottom: 30px; display: flex; align-items: center; gap: 20px; }
        .current-price { font-size: 28px; font-weight: bold; color: #000; }
        .stock-badge { padding: 4px 10px; font-size: 11px; font-weight: bold; border-radius: 20px; }
        .stock-badge.in { background: #e6f7ed; color: #15803d; }
        .stock-badge.out { background: #fee2e2; color: #b91c1c; }

        .btn-buy { background: #000; color: #fff; width: 100%; padding: 20px; font-weight: 900; border: none; font-size: 16px; margin-bottom: 20px; text-transform: uppercase; cursor: pointer; transition: 0.3s; border-radius: 4px; }
        .btn-buy:hover { background: var(--gold-gradient); color: #000; }
        .btn-buy:disabled { background: #ccc; cursor: not-allowed; }

        .description-text { line-height: 1.6; color: #444; margin-bottom: 40px; }

        .specs-section { border-top: 1px solid #eee; padding-top: 20px; }
        .specs-section h3 { font-size: 18px; margin-bottom: 15px; text-transform: uppercase; }
        .specs-list { list-style: none; padding: 0; }
        .specs-list li { padding: 8px 0; border-bottom: 1px solid #f4f4f4; font-size: 14px; color: #555; }
        .specs-list li strong { color: #000; width: 150px; display: inline-block; }

        .related-section { margin-top: 60px; padding-top: 40px; border-top: 1px solid #f0f0f0; }
        .related-title { text-align: center; font-size: 22px; font-weight: 900; margin-bottom: 40px; text-transform: uppercase; color: #000; letter-spacing: 1px; }
        .related-grid { display: grid; grid-gap: 20px; grid-template-columns: repeat(4, 1fr); }
        
        .related-card { 
          text-decoration: none; 
          color: #000; 
          transition: 0.3s;
          background: #f0f0f0; /* Gris más oscuro para que SE NOTE el cuadro */
          border-radius: 4px; 
          border: 1px solid #ddd;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          height: 100%;
        }
        .related-card:hover { transform: translateY(-5px); box-shadow: 0 12px 30px rgba(0,0,0,0.15); border-color: #000; }
        
        .related-img-box { height: 260px; background: #fff; display: flex; align-items: center; justify-content: center; position: relative; padding: 15px; border: 15px solid #f0f0f0; } /* El "borde" grueso de color gris crea el marco */
        .related-img-box img { max-width: 100%; max-height: 100%; object-fit: contain; }
        
        .discount-badge { position: absolute; top: 12px; right: 12px; background: #e31e24; color: #fff; padding: 4px 10px; font-size: 14px; font-weight: 900; border-radius: 0; z-index: 10; }
        
        .related-info { padding: 20px 15px; text-align: center; flex-grow: 1; display: flex; flex-direction: column; align-items: center; background: #f0f0f0; }
        .related-name { font-size: 11px; font-weight: 700; color: #111; margin-bottom: 12px; height: 32px; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; text-transform: uppercase; line-height: 1.4; }
        
        .stars { color: #f5c518; font-size: 12px; margin-bottom: 15px; font-family: sans-serif; }
        .rev-count { color: #555; font-size: 11px; font-weight: 400; text-decoration: underline; margin-left: 5px; }
        
        .price-stack { display: flex; flex-direction: row; gap: 15px; justify-content: center; align-items: center; margin-top: auto; }
        .old-price { text-decoration: line-through; color: #333; font-size: 16px; font-weight: 800; }
        .current-p { color: #e31e24; font-size: 20px; font-weight: 900; }

        .risk-reversal-footer { background-color: #000; text-align: center; padding: 5rem 1rem; color: #fff; border-top: 1px solid rgba(212,175,55,0.2); }
        .risk-reversal-footer h2 { background: var(--gold-gradient); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 1.5rem; font-weight: 900; font-size: clamp(24px, 5vw, 32px); }
        .risk-reversal-footer p { max-width: 650px; margin: 0 auto; color: #aaa; line-height: 1.8; font-size: 16px; }

        .loading-container { height: 100vh; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: bold; font-family: var(--font-outfit); }

        @media (max-width: 1024px) {
          .main-grid { grid-template-columns: 1fr; gap: 40px; }
          .main-image-box { height: 400px; }
          .related-grid { grid-template-columns: repeat(3, 1fr); }
        }

        @media (max-width: 768px) {
          .product-title { font-size: 28px; }
          .related-grid { 
            display: flex; 
            overflow-x: auto; 
            gap: 20px; 
            padding-bottom: 20px;
            scroll-snap-type: x mandatory;
            scrollbar-width: none;
          }
          .related-grid::-webkit-scrollbar { display: none; }
          .related-card { min-width: 200px; scroll-snap-align: start; }
          .main-grid { padding: 0 15px; }
          .info-column { text-align: center; }
          .price-box { justify-content: center; flex-direction: column; gap: 10px; }
          .specs-list li strong { width: 120px; }
        }

        @media (max-width: 480px) {
          .main-image-box { height: 300px; }
          .thumbnails-grid { grid-template-columns: repeat(4, 1fr); }
          .thumb-item { height: 70px; }
        }
      `}</style>
    </div>
  );
}

export default function ProductDetail() {
  return (
    <Suspense fallback={<div>Cargando pieza...</div>}>
      <ProductDetailContent />
    </Suspense>
  );
}
