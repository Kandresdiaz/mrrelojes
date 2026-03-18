"use client";

import { useEffect, useState, useCallback, Suspense, useRef } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import Header from "@/components/Header";
import "./home.css";

const PAGE_SIZE = 20;

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

type Slide = {
  id: string;
  image: string;
  badge?: string;
  headline: string;
  subheadline: string;
  price: string;
  buttonText: string;
  isYellowPrice: boolean;
};

function HomeContent() {
  const router = useRouter();
  const [watches, setWatches] = useState<Watch[]>([]);
  const [slides, setSlides] = useState<Slide[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [currentSlide, setCurrentSlide] = useState(0);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const searchParams = useSearchParams();
  const selectedCategory = searchParams.get("category") || "ALL";
  const search = searchParams.get("search") || "";

  // Initial load: reset and fetch first page
  useEffect(() => {
    setWatches([]);
    setOffset(0);
    setTotal(0);
    setLoading(true);

    Promise.all([
      fetch(`/api/watches?search=${search}&limit=${PAGE_SIZE}&offset=0`).then(res => res.json()),
      fetch("/api/slider").then(res => res.json())
    ]).then(([wData, sData]) => {
      if (wData && wData.items) {
        setWatches(wData.items);
        setTotal(wData.total);
        setOffset(PAGE_SIZE);
      }
      setSlides(Array.isArray(sData) ? sData : []);
      setLoading(false);
    }).catch(() => {
      setWatches([]);
      setSlides([]);
      setLoading(false);
    });
  }, [search]);

  const loadMore = useCallback(async () => {
    if (loadingMore || watches.length >= total) return;
    setLoadingMore(true);
    try {
      const res = await fetch(`/api/watches?search=${search}&limit=${PAGE_SIZE}&offset=${offset}`);
      const data = await res.json();
      if (data && data.items) {
        setWatches(prev => [...prev, ...data.items]);
        setOffset(prev => prev + PAGE_SIZE);
        setTotal(data.total);
      }
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, watches.length, total, search, offset]);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, [nextSlide, slides.length]);

  // Filter watches by category (client-side filtering on loaded items)
  const filteredWatches = watches.filter(w => {
    if (selectedCategory === "ALL") return true;
    const target = selectedCategory.toLowerCase().replace(/-/g, " ");
    return (
      w.collection?.toLowerCase().includes(target) ||
      (w.category || "").toLowerCase().includes(target) ||
      (w.brand || "").toLowerCase().includes(target)
    );
  });

  const hasMore = watches.length < total;

  return (
    <div className="home-wrapper">
      <Header />

      {/* HERO SLIDER SECTION */}
      <section className="hero-slider">
        {slides.length > 0 && (
          <div className="slides-container" style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
            {slides.map((slide) => (
              <div key={slide.id} className="slide" style={{ backgroundImage: `url(${slide.image})` }}>
                <div className="container slide-content">
                  <div className="animate-fade-in">
                    {slide.badge && <span className="slide-badge">{slide.badge}</span>}
                    <h2 className="hero-headline">
                      {slide.headline.split(' ').map((word, i) => (
                        <span key={i} className={`massive-text ${i === 2 ? 'yellow-bg' : ''}`}>{word} </span>
                      ))}
                    </h2>
                    <p className="hero-subheadline">{slide.subheadline}</p>
                    <div className="hero-price-action">
                      <span className="hero-price">{slide.price}</span>
                      <button className="btn-yellow" onClick={() => router.push("/collections/todos")}>{slide.buttonText}</button>
                    </div>
                    <p className="terms-small">*Aplican términos y condiciones. Válido en MrRelojesBga - 2026</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {slides.length > 1 && (
          <>
            <button className="slider-arrow prev" onClick={prevSlide}>❮</button>
            <button className="slider-arrow next" onClick={nextSlide}>❯</button>
            <div className="slider-dots">
              {slides.map((_, i) => (
                <span key={i} className={`dot ${i === currentSlide ? 'active' : ''}`} onClick={() => setCurrentSlide(i)}></span>
              ))}
            </div>
          </>
        )}
      </section>

      {/* PROMO BANNERS */}
      <section className="promo-banners container">
        <div className="banner banner-left">
          <div className="banner-text">
            <span>EDICIÓN FEMENINA</span>
            <h3>RELOJES PARA DAMA</h3>
            <p>ELEGANCIA CON <span className="big-percent">60% OFF</span></p>
            <button className="btn-yellow-sm" onClick={() => router.push("/collections/damas")}>VER CATÁLOGO</button>
          </div>
        </div>
        <div className="banner banner-right">
          <div className="banner-text">
            <h3>RELOJES PARA HOMBRE</h3>
            <p>POTENCIA QUE <br/><strong>NOS REPRESENTA</strong></p>
            <button className="btn-yellow-sm" onClick={() => router.push("/collections/caballeros")}>VER MÁS</button>
          </div>
        </div>
      </section>

      {/* BLACK STRIP */}
      <div className="black-strip">
        <div className="container">
          <h2>¡LOS MEJORES PRECIOS DE BUCARAMANGA ESTÁN AQUÍ!</h2>
        </div>
      </div>

      {/* PRODUCT GRID */}
      <section className="products-section container">
        <h2 className="section-title">Pura <span className="gold-text">Maquinaria</span> Santandereana</h2>

        {loading ? (
          <div className="loading-state">Cargando la bóveda...</div>
        ) : (
          <>
            <div className="product-grid">
              {filteredWatches.map((watch) => (
                <article key={watch.id} className="product-card">
                  <Link href={`/products/${watch.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div className="card-image-wrapper">
                      {watch.stock <= 3 && watch.stock > 0 && (
                        <div className="urgency-tag">¡Solo quedan {watch.stock}!</div>
                      )}
                      {watch.stock <= 0 && <div className="urgency-tag" style={{background: 'gray'}}>Agotado</div>}
                      <img src={watch.image} alt={watch.name} loading="lazy" />
                    </div>

                    <div className="card-content">
                      <div className="review-stars">
                        {"★".repeat(Math.floor(watch.rating))}
                        {"☆".repeat(5 - Math.floor(watch.rating))}
                        <span className="review-count">({watch.reviews})</span>
                      </div>

                      <div className="card-top-info">
                        <span className="collection-name">{watch.collection}</span>
                        {watch.brand && <span className="brand-name">{watch.brand}</span>}
                      </div>
                      <h3 className="watch-name">{watch.name}</h3>

                      <div className="specs-mini">
                        <span>{watch.specs?.caseSize}</span> • <span>{watch.specs?.movement}</span>
                      </div>

                      <div className="price-container">
                        <span className="original-price">${watch.originalPrice.toLocaleString('es-CO')}</span>
                        <span className="current-price">${watch.price.toLocaleString('es-CO')} COP</span>
                      </div>

                      <button className="btn-primary buy-btn">Lo Quiero Ahora</button>
                    </div>
                  </Link>
                </article>
              ))}
            </div>

            {/* VER MÁS / CONTADOR */}
            <div className="load-more-section" ref={loadMoreRef}>
              <p className="products-counter">
                Mostrando <strong>{filteredWatches.length}</strong> de <strong>{total}</strong> relojes
              </p>
              {hasMore && (
                <button
                  className="btn-load-more"
                  onClick={loadMore}
                  disabled={loadingMore}
                >
                  {loadingMore ? (
                    <span className="loading-spinner">⏳ Cargando más relojes...</span>
                  ) : (
                    <>Ver más relojes ↓</>
                  )}
                </button>
              )}
              {!hasMore && watches.length > 0 && (
                <p className="end-message">✅ ¡Has visto todo el catálogo!</p>
              )}
            </div>
          </>
        )}
      </section>

      {/* TESTIMONIALS */}
      <section className="testimonials">
        <div className="container">
          <h2 className="test-title">LO QUE DICEN NUESTROS VECINOS EN SANTANDER</h2>
          <div className="overall-rating">
            <span className="stars">★★★★★</span>
            <p>Más de 4.800 bumangueses felices</p>
          </div>

          <div className="testimonials-grid">
            <div className="test-card">
              <span className="stars">★★★★★</span>
              <h4>¡Excelente pieza, mano!</h4>
              <p>Me llegó a Floridablanca en menos de 2 horas. MrRelojesBga es pura confianza.</p>
              <div className="test-user">Jaime Pinzón</div>
            </div>
            <div className="test-card">
              <span className="stars">★★★★★</span>
              <h4>Calidad de la buena</h4>
              <p>Esos relojes son una elegancia, se nota que saben de esto aquí en Bga.</p>
              <div className="test-user">Maria Claudia</div>
            </div>
            <div className="test-card">
              <span className="stars">★★★★★</span>
              <h4>Súper recomendado</h4>
              <p>Lo pedí por WhatsApp y el trato fue de primer nivel. ¡Gracias mano!</p>
              <div className="test-user">Andrés Suárez</div>
            </div>
          </div>
        </div>
      </section>

      {/* RISK REVERSAL FOOTER */}
      <section className="risk-reversal-footer">
        <div className="container">
          <h2>Palabra de Santandereano: Si no le gusta, me lo devuelve</h2>
          <p>En <strong>MrRelojesBga</strong> no jugamos con su tiempo. Le damos <strong>30 días de garantía total</strong>.
          Si el reloj no lo hace sentir como el más elegante de la sala, me lo devuelve y le devuelvo cada peso. ¡Sin preguntas, mano!</p>
        </div>
      </section>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div>Cargando MrRelojesBga...</div>}>
      <HomeContent />
    </Suspense>
  );
}
