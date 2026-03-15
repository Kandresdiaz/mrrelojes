"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import "./header.css";

type WatchSuggestion = {
  id: string;
  name: string;
  collection: string;
  price: number;
};

const KEYWORD_MAP: Record<string, string> = {
  dama: "Damas", damas: "Damas", mujer: "Damas", mujeres: "Damas", femenino: "Damas",
  caballero: "Caballeros", caballeros: "Caballeros", hombre: "Caballeros", hombres: "Caballeros", masculino: "Caballeros",
  "pro diver": "Pro Diver", diver: "Pro Diver", buceo: "Pro Diver",
  venom: "Venom", reserve: "Reserve", reserva: "Reserve",
  automatico: "Automáticos", automático: "Automáticos",
  cronografo: "Cronógrafos", cronógrafo: "Cronógrafos",
  oferta: "Ofertas", ofertas: "Ofertas",
  nuevo: "Nuevos Ingresos", nuevos: "Nuevos Ingresos",
};

export default function Header() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentCategory = searchParams.get("category") || "ALL";

  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState<WatchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleFilter = (category: string) => {
    setMenuOpen(false);
    if (category === "ALL") {
      router.push("/");
    } else {
      const slug = category.toLowerCase().replace(/ /g, "-").replace(/á/g, "a").replace(/é/g, "e").replace(/ó/g, "o").replace(/ú/g, "u").replace(/ñ/g, "n");
      router.push(`/collections/${slug}`);
    }
  };

  const doSearch = (term: string) => {
    if (!term.trim()) return;
    const lower = term.toLowerCase().trim();
    const matched = KEYWORD_MAP[lower];
    setShowSuggestions(false);
    setMenuOpen(false);
    if (matched) {
      handleFilter(matched);
    } else {
      router.push(`/?search=${encodeURIComponent(term)}`);
    }
  };

  const fetchSuggestions = useCallback(async (term: string) => {
    if (term.length < 2) { setSuggestions([]); setShowSuggestions(false); return; }
    setIsLoading(true);
    try {
      const res = await fetch(`/api/watches?search=${encodeURIComponent(term)}`);
      const data = await res.json();
      if (Array.isArray(data)) { setSuggestions(data.slice(0, 6)); setShowSuggestions(true); }
    } catch { setSuggestions([]); }
    finally { setIsLoading(false); }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchTerm(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (val.trim().length < 2) { setSuggestions([]); setShowSuggestions(false); return; }
    debounceRef.current = setTimeout(() => fetchSuggestions(val.trim()), 300);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Bloquear scroll cuando el menú está abierto
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  const highlightMatch = (text: string, query: string) => {
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return <span>{text}</span>;
    return <span>{text.slice(0, idx)}<mark>{text.slice(idx, idx + query.length)}</mark>{text.slice(idx + query.length)}</span>;
  };

  return (
    <>
      {/* BARRA PROMO (oculta en móvil via CSS) */}
      <div className="top-promo-bar">
        <div className="container promo-content">
          <span>🇨🇴 <strong>MrRelojesBga</strong>: Elegancia Santandereana para toda Colombia</span>
          <div className="promo-links">
            <span>🛵 Envíos Gratis en Bucaramanga</span>
            <span>📍 Ciudad de los Parques</span>
            <span className="contact-link">📞 Contáctanos</span>
          </div>
        </div>
      </div>

      <header className="main-header">
        <div className="container header-container">

          {/* HAMBURGUESA — solo visible en móvil */}
          <button className="hamburger-btn" onClick={() => setMenuOpen(true)} aria-label="Abrir menú">
            ☰
          </button>

          <Link href="/" className="logo">
            <span className="logo-inv">MR. RELOJES</span>
            <div className="logo-badge">BGA • PREMIUM STORE</div>
          </Link>

          {/* NAV DESKTOP */}
          <nav className="main-nav">
            <ul>
              <li className={`nav-item ${currentCategory === "ALL" ? "active-link" : ""}`} onClick={() => handleFilter("ALL")}>INICIO</li>
              <li className="nav-item has-dropdown">
                RELOJES ▾
                <div className="dropdown-menu">
                  <div className="dropdown-item" onClick={() => handleFilter("Pro Diver")}>Colección Pro Diver</div>
                  <div className="dropdown-item" onClick={() => handleFilter("Venom")}>Colección Venom</div>
                  <div className="dropdown-item" onClick={() => handleFilter("Reserve")}>Colección Reserve</div>
                  <div className="dropdown-item" onClick={() => handleFilter("Damas")}>Relojes para Dama</div>
                  <div className="dropdown-item" onClick={() => handleFilter("Caballeros")}>Relojes para Hombre</div>
                  <div className="dropdown-item" onClick={() => handleFilter("ALL")}>Ver Todos</div>
                </div>
              </li>
              <li className="nav-item has-dropdown">
                CATEGORÍAS ▾
                <div className="dropdown-menu">
                  <div className="dropdown-item" onClick={() => handleFilter("Automáticos")}>Automáticos</div>
                  <div className="dropdown-item" onClick={() => handleFilter("Cronógrafos")}>Cronógrafos</div>
                  <div className="dropdown-item" onClick={() => handleFilter("Edicion Especial")}>Edición Especial</div>
                  <div className="dropdown-item" onClick={() => handleFilter("Nuevos Ingresos")}>Nuevos Ingresos</div>
                </div>
              </li>
              <li className="nav-item">ACCESORIOS</li>
            </ul>
          </nav>

          {/* ACCIONES DESKTOP */}
          <div className="header-actions">
            <button className="super-oferta-btn" onClick={() => router.push("/collections/ofertas")}>OFERTAS 🔥</button>
            <div className="icon-group">
              <div className="search-wrapper" ref={wrapperRef}>
                <form onSubmit={(e) => { e.preventDefault(); doSearch(searchTerm); }} className="search-form">
                  <input
                    type="text"
                    placeholder="Buscar reloj, dama, caballero..."
                    value={searchTerm}
                    onChange={handleInputChange}
                    onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                    className="search-input"
                    autoComplete="off"
                  />
                  <button type="submit" className="search-btn">{isLoading ? "⏳" : "🔍"}</button>
                </form>
                {showSuggestions && (
                  <div className="suggestions-box">
                    {suggestions.length > 0 ? (
                      <>
                        <div className="suggestions-header">Sugerencias</div>
                        {suggestions.map((watch) => (
                          <div key={watch.id} className="suggestion-item" onMouseDown={() => { setShowSuggestions(false); router.push(`/products/${watch.id}`); }}>
                            <span className="suggestion-icon">⌚</span>
                            <div className="suggestion-text">
                              <div className="suggestion-name">{highlightMatch(watch.name, searchTerm)}</div>
                              <div className="suggestion-collection">{watch.collection}</div>
                            </div>
                            <span className="suggestion-price">${watch.price.toLocaleString('es-CO')} COP</span>
                          </div>
                        ))}
                        <div className="suggestions-footer" onMouseDown={() => doSearch(searchTerm)}>
                          🔍 Ver todos los resultados para "{searchTerm}"
                        </div>
                      </>
                    ) : (
                      !isLoading && <div className="suggestions-no-results">😕 No encontramos "{searchTerm}"</div>
                    )}
                  </div>
                )}
              </div>
              <Link href="/admin"><span className="nav-icon">👤</span></Link>
              <span className="nav-icon">🛒</span>
            </div>
          </div>
        </div>
      </header>

      {/* ====== MENÚ MÓVIL LATERAL ====== */}
      <div className={`mobile-nav-overlay ${menuOpen ? "open" : ""}`} onClick={() => setMenuOpen(false)} />
      <div className={`mobile-nav-drawer ${menuOpen ? "open" : ""}`}>
        <div className="mobile-nav-header">
          <span className="mobile-nav-logo">MR. RELOJES</span>
          <button className="mobile-nav-close" onClick={() => setMenuOpen(false)}>✕</button>
        </div>

        {/* BUSCADOR EN MÓVIL */}
        <div className="mobile-search-bar">
          <form onSubmit={(e) => { e.preventDefault(); doSearch(searchTerm); }}>
            <input
              type="text"
              placeholder="Buscar reloj, dama, caballero..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button type="submit">🔍</button>
          </form>
        </div>

        <button className="mobile-oferta-btn" onClick={() => router.push("/collections/ofertas")}>🔥 VER OFERTAS</button>

        <div className="mobile-nav-items">
          <div className="mobile-nav-section-title">Menú</div>
          <span className="mobile-nav-item" onClick={() => handleFilter("ALL")}>🏠 Inicio</span>

          <div className="mobile-nav-section-title">Relojes</div>
          <span className="mobile-nav-item" onClick={() => handleFilter("Pro Diver")}>⌚ Colección Pro Diver</span>
          <span className="mobile-nav-item" onClick={() => handleFilter("Venom")}>⌚ Colección Venom</span>
          <span className="mobile-nav-item" onClick={() => handleFilter("Reserve")}>⌚ Colección Reserve</span>
          <span className="mobile-nav-item" onClick={() => handleFilter("Damas")}>👸 Relojes para Dama</span>
          <span className="mobile-nav-item" onClick={() => handleFilter("Caballeros")}>🤵 Relojes para Hombre</span>

          <div className="mobile-nav-section-title">Categorías</div>
          <span className="mobile-nav-item" onClick={() => handleFilter("Automáticos")}>⚙️ Automáticos</span>
          <span className="mobile-nav-item" onClick={() => handleFilter("Cronógrafos")}>⏱️ Cronógrafos</span>
          <span className="mobile-nav-item" onClick={() => handleFilter("Edicion Especial")}>💎 Edición Especial</span>
          <span className="mobile-nav-item" onClick={() => handleFilter("Nuevos Ingresos")}>🆕 Nuevos Ingresos</span>

          <div className="mobile-nav-section-title">Mi cuenta</div>
          <Link href="/admin" className="mobile-nav-item" onClick={() => setMenuOpen(false)}>👤 Administrador</Link>
        </div>
      </div>

      {/* FRANJA DORADA */}
      <div className="trust-divider">
        <div className="marquee-content">
          <div className="trust-items">
            <span>🤝 TRATO DE AMIGO, NEGOCIO SERIO</span>
            <span>💨 ENVÍO RELÁMPAGO DESDE BGA</span>
            <span>✅ GARANTÍA DE BUMANGUÉS A BUMANGUÉS</span>
            <span>💳 PAGO CONTRA ENTREGA DISPONIBLE</span>
            <span>🌟 CALIDAD QUE NO FALLA, MANO</span>
          </div>
          <div className="trust-items" aria-hidden="true">
            <span>🤝 TRATO DE AMIGO, NEGOCIO SERIO</span>
            <span>💨 ENVÍO RELÁMPAGO DESDE BGA</span>
            <span>✅ GARANTÍA DE BUMANGUÉS A BUMANGUÉS</span>
            <span>💳 PAGO CONTRA ENTREGA DISPONIBLE</span>
            <span>🌟 CALIDAD QUE NO FALLA, MANO</span>
          </div>
        </div>
      </div>
    </>
  );
}
