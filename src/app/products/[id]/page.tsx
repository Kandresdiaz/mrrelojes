"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import "./product.css";

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
      const product = Array.isArray(data) ? data.find((w) => w.id === id) : null;

      if (product) {
        setWatch(product);
        setActiveImage(product.image);
        const shuffled = data.filter(w => w.id !== id).sort(() => 0.5 - Math.random());
        setRelatedWatches(shuffled.slice(0, 8));
      }
      setLoading(false);
    }
    fetchData();
  }, [id]);

  if (loading) return <div className="loading-container">Cargando pieza exclusiva...</div>;
  if (!watch) return <div className="loading-container">Reloj no encontrado</div>;

  const whatsappMessage = `Hola MrRelojesBga, me interesa el reloj: ${watch.name} ($${watch.price} USD). ¿Sigue disponible?`;
  const whatsappUrl = `https://wa.me/573043695986?text=${encodeURIComponent(whatsappMessage)}`;

  return (
    <div className="pdp-wrapper">
      <Header />

      <div className="container main-grid">
        {/* IMÁGENES */}
        <div className="gallery-column">
          <div className="main-image-box">
            <img src={activeImage} alt={watch.name} className="main-img" />
          </div>
          <div className="thumbnails-grid">
            {[watch.image, ...(watch.gallery || [])].map((img, idx) => (
              <div
                key={idx}
                className={`thumb-item ${img === activeImage ? "active" : ""}`}
                onClick={() => setActiveImage(img)}
              >
                <img src={img} alt={`Vista ${idx + 1}`} />
              </div>
            ))}
          </div>
        </div>

        {/* INFO */}
        <div className="info-column">
          <span className="collection-label">PURA MAQUINARIA: {watch.collection}</span>
          <h1 className="product-title">{watch.name}</h1>

          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="btn-whatsapp">
            📲 ¡Oiga mano! Envíeme fotos por WhatsApp
          </a>

          <div className="price-box">
            <span className="current-price">${watch.price.toLocaleString()} USD</span>
            {watch.stock <= 0 ? (
              <span className="stock-badge out">Ya se lo llevaron</span>
            ) : (
              <span className="stock-badge in">Disponible en Bga ({watch.stock} und.)</span>
            )}
          </div>

          <button className="btn-buy" disabled={watch.stock <= 0}>
            {watch.stock <= 0 ? "AGOTADO" : "¡LO QUIERO YA, MANO!"}
          </button>

          {watch.description && (
            <p className="description-text">{watch.description}</p>
          )}

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

      {/* PRODUCTOS RELACIONADOS */}
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
                  <div className="stars">{"★".repeat(5)} <span className="rev-count">({w.reviews || 0})</span></div>
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

      {/* GARANTÍA */}
      <section className="risk-reversal-footer">
        <div className="container">
          <h2>PALABRA DE SANTANDEREANO: SI NO LE GUSTA, ME LO DEVUELVE</h2>
          <p>En <strong>MrRelojesBga</strong> no jugamos con su tiempo. Le damos <strong>30 días de garantía total</strong>.
          Si el reloj no lo hace sentir como el más elegante de la sala, me lo devuelve y le devuelvo cada peso. ¡Sin preguntas, mano!</p>
        </div>
      </section>
    </div>
  );
}

export default function ProductDetail() {
  return (
    <Suspense fallback={<div className="loading-container">Cargando pieza...</div>}>
      <ProductDetailContent />
    </Suspense>
  );
}
