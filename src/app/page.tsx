"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import Header from "@/components/Header";

type Watch = {
  id: string;
  name: string;
  collection: string;
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
  const [timeLeft, setTimeLeft] = useState({ hours: 4, minutes: 59, seconds: 59 });
  const [currentSlide, setCurrentSlide] = useState(0);

  const searchParams = useSearchParams();
  const selectedCategory = searchParams.get("category") || "ALL";

  useEffect(() => {
    const search = searchParams.get("search") || "";
    Promise.all([
      fetch(`/api/watches?search=${search}`).then(res => res.json()),
      fetch("/api/slider").then(res => res.json())
    ]).then(([wData, sData]) => {
      setWatches(wData);
      setSlides(sData);
      setLoading(false);
    });
  }, [searchParams]);

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

  return (
    <div className="home-wrapper">
      <Header />

      {/* 4. HERO SLIDER SECTION */}
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

      {/* 5. PROMO BANNERS */}
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

      {/* 6. BLACK STRIP */}
      <div className="black-strip">
        <div className="container">
          <h2>¡LOS MEJORES PRECIOS DE BUCARAMANGA ESTÁN AQUÍ!</h2>
        </div>
      </div>

      {/* 7. PRODUCT GRID */}
      <section className="products-section container">
        <h2 className="section-title">Pura <span className="gold-text">Maquinaria</span> Santandereana</h2>
        
        {loading ? (
          <div className="loading-state">Cargando la bóveda...</div>
        ) : (
          <div className="product-grid">
            {watches.filter(w => selectedCategory === "ALL" || w.collection === selectedCategory).map((watch) => (
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
                    
                    <span className="collection-name">{watch.collection}</span>
                    <h3 className="watch-name">{watch.name}</h3>
                    
                    <div className="specs-mini">
                      <span>{watch.specs.caseSize}</span> • <span>{watch.specs.movement}</span>
                    </div>

                    <div className="price-container">
                      <span className="original-price">${watch.originalPrice.toLocaleString()} USD</span>
                      <span className="current-price">${watch.price.toLocaleString()} USD</span>
                    </div>
                    
                    <button className="btn-primary buy-btn">Lo Quiero Ahora</button>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* 8. TESTIMONIALS */}
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

      {/* 9. RISK REVERSAL FOOTER */}
      <section className="risk-reversal-footer">
        <div className="container">
          <h2>Palabra de Santandereano: Si no le gusta, me lo devuelve</h2>
          <p>En <strong>MrRelojesBga</strong> no jugamos con su tiempo. Le damos <strong>30 días de garantía total</strong>. 
          Si el reloj no lo hace sentir como el más elegante de la sala, me lo devuelve y le devuelvo cada peso. ¡Sin preguntas, mano!</p>
        </div>
      </section>

      <style jsx>{`
        .home-wrapper { min-height: 100vh; background-color: #fff; color: #000; overflow-x: hidden; }

        .hero-slider { position: relative; height: 600px; background: #000; overflow: hidden; }
        .slides-container { display: flex; transition: transform 0.8s cubic-bezier(0.4, 0, 0.2, 1); height: 100%; }
        .slide { min-width: 100%; height: 100%; background-size: cover; background-position: center; display: flex; align-items: center; position: relative; }
        .slide::after { content: ''; position: absolute; inset: 0; background: linear-gradient(90deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0) 100%); }
        .slide-content { position: relative; z-index: 10; color: #fff; max-width: 800px; }

        .slider-arrow { position: absolute; top: 50%; transform: translateY(-50%); background: rgba(255,255,255,0.1); color: #fff; border: none; width: 50px; height: 50px; border-radius: 50%; cursor: pointer; z-index: 20; font-size: 20px; transition: 0.3s; }
        .slider-arrow:hover { background: var(--accent-gold); }
        .slider-arrow.prev { left: 20px; }
        .slider-arrow.next { right: 20px; }

        .slider-dots { position: absolute; bottom: 30px; left: 50%; transform: translateX(-50%); display: flex; gap: 10px; z-index: 20; }
        .dot { width: 12px; height: 12px; background: rgba(255,255,255,0.5); border-radius: 50%; cursor: pointer; }
        .dot.active { background: var(--accent-gold); width: 25px; border-radius: 10px; }

        .slide-badge { color: var(--accent-gold); font-size: 14px; font-weight: bold; margin-bottom: 15px; border-left: 3px solid var(--accent-gold); padding-left: 10px; display: block;}
        .hero-headline { color: #fff; font-size: clamp(30px, 5vw, 45px); text-transform: uppercase; margin-bottom: 20px; font-family: var(--font-outfit); }
        .massive-text { font-size: clamp(40px, 10vw, 80px); font-weight: 900; display: block; line-height: 0.9; }
        .yellow-bg { color: #000; background: var(--gold-gradient); display: inline-block; padding: 0 10px; border-radius: 4px; }

        .btn-yellow { background: var(--gold-gradient); color: #000; padding: 15px 40px; font-weight: 900; font-size: 18px; margin-top: 20px; border: none; cursor: pointer; transition: 0.3s; border-radius: 4px; }
        .btn-yellow:hover { transform: scale(1.05); box-shadow: 0 0 20px rgba(212,175,55,0.4); }
        .hero-price { font-size: 24px; font-weight: bold; color: #fff; display: block; margin-top: 20px; }
        .terms-small { color: rgba(255,255,255,0.7); font-size: 11px; margin-top: 20px; }

        .promo-banners { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-top: 60px; position: relative; z-index: 30; }
        .banner { height: 350px; background-size: cover; background-position: center; border-radius: 8px; display: flex; align-items: center; padding: 40px; color: #fff; overflow: hidden; position: relative; }
        .banner::after { content: ''; position: absolute; inset: 0; background: rgba(0,0,0,0.3); }
        .banner-text { position: relative; z-index: 10; }
        .banner-left { background-image: url('https://images.unsplash.com/photo-1508057198894-247b23fe5ade?auto=format&fit=crop&q=80&w=800'); }
        .banner-right { background-image: url('https://images.unsplash.com/photo-1614164185128-e4ec99c436d7?auto=format&fit=crop&q=80&w=800'); }
        .banner h3 { font-size: 32px; font-weight: 900; margin: 10px 0; line-height: 1; }
        .big-percent { font-size: 48px; font-weight: 900; color: var(--accent-gold); }
        .btn-yellow-sm { background: var(--gold-gradient); color: #000; padding: 10px 20px; font-weight: bold; border: none; border-radius: 4px; margin-top: 15px; cursor: pointer; transition: 0.3s; }
        .btn-yellow-sm:hover { transform: scale(1.05); }

        .black-strip { background: #000; color: #fff; padding: 40px 0; text-align: center; margin: 60px 0; }
        .black-strip h2 { font-size: 28px; font-weight: 900; letter-spacing: 1px; }

        .section-title { font-size: clamp(24px, 5vw, 36px); font-weight: 900; text-align: center; margin-bottom: 50px; text-transform: uppercase; font-family: var(--font-outfit); }
        .gold-text { background: var(--gold-gradient); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }

        .product-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 30px; }
        .product-card { background: #fff; border: 1px solid #eee; transition: 0.3s; position: relative; display: flex; flex-direction: column; }
        .product-card:hover { transform: translateY(-10px); box-shadow: 0 15px 30px rgba(0,0,0,0.1); }
        
        .card-image-wrapper { height: 280px; background: #f9f9f9; display: flex; align-items: center; justify-content: center; padding: 20px; position: relative; }
        .card-image-wrapper img { max-width: 100%; max-height: 100%; object-fit: contain; }
        
        .urgency-tag { position: absolute; top: 10px; right: 10px; background: #ef0000; color: #fff; padding: 4px 8px; font-size: 10px; font-weight: bold; border-radius: 2px; }
        
        .card-content { padding: 20px; text-align: center; flex-grow: 1; display: flex; flex-direction: column; font-family: var(--font-outfit); }
        .review-stars { color: var(--accent-gold); font-size: 12px; margin-bottom: 10px; }
        .review-count { color: #888; margin-left: 5px; }
        .collection-name { font-size: 11px; font-weight: 800; color: var(--accent-gold); text-transform: uppercase; letter-spacing: 2px; }
        .watch-name { font-size: 16px; font-weight: 800; margin: 8px 0; height: 40px; overflow: hidden; text-transform: uppercase; }
        .specs-mini { font-size: 12px; color: #666; margin-bottom: 15px; }
        
        .price-container { margin-bottom: 20px; }
        .original-price { text-decoration: line-through; color: #999; font-size: 14px; margin-right: 10px; }
        .current-price { font-size: 20px; font-weight: 900; color: #000; }
        
        .buy-btn { width: 100%; padding: 14px; font-size: 13px; background: #000; color: #fff; border: none; font-weight: 900; cursor: pointer; transition: 0.3s; text-transform: uppercase; border-radius: 4px; }
        .buy-btn:hover { background: var(--gold-gradient); color: #000; }

        .testimonials { background: #000; padding: 100px 0; margin-top: 80px; color: #fff; border-top: 1px solid rgba(212,175,55,0.2); }
        .test-title { text-align: center; font-size: 28px; font-weight: 900; margin-bottom: 10px; font-family: var(--font-outfit); }
        .overall-rating { text-align: center; margin-bottom: 60px; }
        .overall-rating .stars { color: var(--accent-gold); font-size: 24px; }
        .testimonials-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 30px; }
        .test-card { background: #111; padding: 35px; border-radius: 12px; border: 1px solid #222; transition: 0.3s; }
        .test-card:hover { border-color: var(--accent-gold); transform: translateY(-5px); }
        .test-card .stars { color: var(--accent-gold); margin-bottom: 15px; display: block; }
        .test-card h4 { margin-bottom: 10px; font-weight: 800; text-transform: uppercase; font-family: var(--font-outfit); }
        .test-card p { font-size: 15px; color: #bbb; line-height: 1.8; margin-bottom: 20px; }
        .test-user { font-weight: 900; font-size: 14px; color: var(--accent-gold); text-transform: uppercase; }

        .risk-reversal-footer { background: #000; color: #fff; padding: 100px 0; text-align: center; border-top: 1px solid #111; }
        .risk-reversal-footer h2 { font-size: clamp(24px, 5vw, 36px); font-weight: 900; margin-bottom: 20px; background: var(--gold-gradient); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-family: var(--font-outfit); }
        .risk-reversal-footer p { max-width: 700px; margin: 0 auto; font-size: 16px; color: #aaa; line-height: 1.8; }

        @media (max-width: 1024px) {
          .product-grid { grid-template-columns: repeat(2, 1fr); }
          .promo-banners { grid-template-columns: 1fr; margin-top: 20px; }
          .testimonials-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 600px) {
          .product-grid { 
            grid-template-columns: 1fr; 
            gap: 20px;
          }
          .hero-slider { height: 450px; }
          .massive-text { font-size: 36px; }
          .container { padding: 0 20px; }
          .hero-headline { margin-bottom: 10px; }
          .btn-yellow { padding: 12px 30px; font-size: 16px; }
        }
      `}</style>
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
