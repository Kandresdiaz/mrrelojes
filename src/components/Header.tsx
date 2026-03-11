"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

export default function Header() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentCategory = searchParams.get("category") || "ALL";

  const [searchTerm, setSearchTerm] = useState("");

  const handleFilter = (category: string) => {
    if (category === "ALL") {
      router.push("/");
    } else {
      const slug = category.toLowerCase().replace(/ /g, "-");
      router.push(`/collections/${slug}`);
    }
  };

  const pathname = usePathname();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      router.push(`${pathname}?search=${encodeURIComponent(searchTerm)}`);
    }
  };

  return (
    <>
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
          <Link href="/" className="logo">
            <span className="logo-inv">MR. RELOJES</span>
            <div className="logo-badge">BGA • PREMIUM STORE</div>
          </Link>
          
          <nav className="main-nav">
            <ul>
              <li className={`nav-item ${currentCategory === "ALL" ? "active-link" : ""}`} onClick={() => handleFilter("ALL")}>
                INICIO
              </li>
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

          <div className="header-actions">
            <button className="super-oferta-btn" onClick={() => router.push("/collections/ofertas")}>OFERTAS 🔥</button>
            <div className="icon-group">
              <form onSubmit={handleSearch} className="search-form">
                <input 
                  type="text" 
                  placeholder="Buscar..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
                <button type="submit" className="search-btn">🔍</button>
              </form>
              <Link href="/admin"><span className="nav-icon">👤</span></Link>
              <span className="nav-icon">🛒</span>
            </div>
          </div>
        </div>
      </header>

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

      <style jsx>{`
        .top-promo-bar { background-color: #000; color: #fff; padding: 8px 0; font-size: 13px; font-weight: 500; border-bottom: 1px solid #333; }
        .promo-content { display: flex; justify-content: space-between; align-items: center; }
        .promo-links { display: flex; gap: 20px; }
        .contact-link { color: var(--accent-gold); font-weight: bold; cursor: pointer; }

        .main-header { background-color: #000; color: #fff; padding: 15px 0; position: sticky; top: 0; z-index: 1000; box-shadow: 0 4px 20px rgba(0,0,0,0.5); }
        .header-container { display: flex; justify-content: space-between; align-items: center; }
        .logo { display: flex; flex-direction: column; align-items: center; cursor: pointer; text-decoration: none; border: 1px solid rgba(212,175,55,0.2); padding: 5px 12px; border-radius: 4px; }
        .logo-inv { font-size: 24px; font-weight: 800; letter-spacing: 3px; line-height: 1; color: #fff; text-transform: uppercase; font-family: var(--font-outfit); }
        .logo-badge { font-size: 9px; background: var(--gold-gradient); color: #000; padding: 2px 8px; margin-top: 4px; font-weight: 900; border-radius: 2px; }

        .main-nav ul { display: flex; gap: 25px; list-style: none; font-size: 13px; font-weight: 700; font-family: var(--font-outfit); }
        .nav-item { cursor: pointer; transition: 0.3s; position: relative; padding-bottom: 5px; color: #eee; }
        .nav-item:hover { color: var(--accent-gold); }
        .active-link { color: var(--accent-gold); }
        .active-link::after { content: ''; position: absolute; bottom: 0; left: 0; width: 100%; height: 2px; background: var(--gold-gradient); }

        .has-dropdown { padding-bottom: 20px; margin-bottom: -20px; }
        .dropdown-menu {
          position: absolute; top: 100%; left: 0; background: #111; min-width: 220px;
          box-shadow: 0 10px 20px rgba(0,0,0,0.5); display: none; flex-direction: column;
          padding: 10px 0; border-top: 2px solid #bf953f; z-index: 2000;
        }
        .has-dropdown:hover .dropdown-menu { display: flex; }
        .dropdown-item { padding: 12px 20px; color: #eee; transition: 0.2s; font-size: 12px; border-bottom: 1px solid #222; }
        .dropdown-item:hover { background: #222; color: #bf953f; }

        .header-actions { display: flex; align-items: center; gap: 20px; }
        .super-oferta-btn {
          background: var(--accent-red); color: #fff; padding: 8px 18px; font-weight: 900; border-radius: 4px;
          clip-path: polygon(10% 0%, 100% 0%, 90% 100%, 0% 100%); border: none; cursor: pointer;
          font-family: var(--font-outfit); font-size: 11px; transition: 0.3s;
        }
        .super-oferta-btn:hover { transform: scale(1.05); }

        .icon-group { display: flex; gap: 15px; font-size: 18px; align-items: center; }
        .nav-icon { cursor: pointer; color: #fff; text-decoration: none; transition: 0.3s; }
        .nav-icon:hover { color: var(--accent-gold); }

        .search-form { display: flex; align-items: center; background: #1a1a1a; border: 1px solid #333; border-radius: 20px; padding: 2px 10px; }
        .search-input { background: transparent; border: none; color: #fff; font-size: 12px; outline: none; width: 100px; padding: 5px; }
        .search-btn { background: transparent; border: none; cursor: pointer; font-size: 14px; }

        .trust-divider { background: var(--gold-gradient); color: #000; padding: 10px 0; font-size: 11px; font-weight: 900; overflow: hidden; white-space: nowrap; position: relative; }
        .marquee-content { display: flex; animation: marquee 30s linear infinite; width: max-content; }
        .trust-items { display: flex; gap: 50px; padding-right: 50px; }
      `}</style>
    </>
  );
}
