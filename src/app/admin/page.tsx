"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";

type Watch = {
  id: string;
  name: string;
  collection: string;
  price: number;
  originalPrice: number;
  image: string;
  stock: number;
  isOffer?: boolean;
};

type Slide = {
  id: string;
  image: string;
  headline: string;
  subheadline: string;
  price: string;
};

export default function AdminPage() {
  const [activeView, setActiveView] = useState<"menu" | "watches" | "slider" | "offers">("menu");
  const [watches, setWatches] = useState<Watch[]>([]);
  const [slides, setSlides] = useState<Slide[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  
  // Auth Form
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // States for simple forms
  const [newWatch, setNewWatch] = useState({ id: '', name: '', collection: '', price: '', originalPrice: '', image: '', stock: '1' });
  const [newSlide, setNewSlide] = useState({ id: '', headline: '', subheadline: '', price: '', image: '' });
  
  const [uploading, setUploading] = useState(false);
  
  const [editingWatchId, setEditingWatchId] = useState<string | null>(null);
  const [editingSlideId, setEditingSlideId] = useState<string | null>(null);

  const handleFileUpload = async (file: File, bucket: 'watches' | 'slider') => {
    try {
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = fileName;

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error: any) {
      alert("Error subiendo imagen: " + error.message);
      return null;
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    checkUser();
    refreshData();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user ?? null);
    setLoadingAuth(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert("Error: " + error.message);
    else checkUser();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const refreshData = () => {
    fetch("/api/watches").then(res => res.json()).then(setWatches);
    fetch("/api/slider").then(res => res.json()).then(setSlides);
  };

  const addWatch = async () => {
    if (!newWatch.name || !newWatch.image) return alert("¡Mano, falta el nombre o la foto!");
    const watchData = { 
      ...newWatch, 
      id: editingWatchId || ('watch-' + Date.now().toString()),
      price: Number(newWatch.price), 
      originalPrice: Number(newWatch.originalPrice), 
      stock: Number(newWatch.stock) 
    };
    
    await fetch("/api/watches", {
      method: "POST",
      body: JSON.stringify(watchData),
    });
    
    setNewWatch({ id: '', name: '', collection: '', price: '', originalPrice: '', image: '', stock: '1' });
    setEditingWatchId(null);
    setActiveView("menu");
    refreshData();
  };

  const deleteWatch = async (id: string) => {
    if(!confirm("¿Seguro que quiere quitar este reloj, mano?")) return;
    // Note: Assuming API handles DELETE or we use POST with empty stock/flag
    // For now let's use the same supabase client directly for deletion as it's an admin panel
    await supabase.from('watches').delete().eq('id', id);
    refreshData();
  };

  const startEditWatch = (w: Watch) => {
    setNewWatch({
      id: w.id,
      name: w.name,
      collection: w.collection,
      price: w.price.toString(),
      originalPrice: w.originalPrice.toString(),
      image: w.image,
      stock: w.stock.toString()
    });
    setEditingWatchId(w.id);
    setActiveView("watches");
  }

  const addSlide = async () => {
    if (!newSlide.headline || !newSlide.image) return alert("¡Falta el título de la promo!");
    const slideData = { 
      ...newSlide, 
      id: editingSlideId || ('slide-' + Date.now().toString()),
      buttonText: 'VER OFERTA', 
      isYellowPrice: true, 
      badge: 'NUEVA PROMO' 
    };
    
    await fetch("/api/slider", {
      method: "POST",
      body: JSON.stringify(slideData),
    });
    
    setNewSlide({ id: '', headline: '', subheadline: '', price: '', image: '' });
    setEditingSlideId(null);
    setActiveView("menu");
    refreshData();
  };

  const startEditSlide = (s: Slide) => {
    setNewSlide({
      id: s.id,
      headline: s.headline,
      subheadline: s.subheadline,
      price: s.price,
      image: s.image
    });
    setEditingSlideId(s.id);
    setActiveView("slider");
  }

  const deleteSlide = async (id: string) => {
    if(!confirm("¿Quiere quitar este banner?")) return;
    await fetch("/api/slider", { method: "DELETE", body: JSON.stringify({ id }) });
    refreshData();
  };

  const automateOffers = async () => {
    setIsSyncing(true);
    try {
      // Logic: Pick 4 cheapest watches and mark them as offers
      // In a real scenario, this would be a specialized API endpoint
      const sorted = [...watches].sort((a, b) => a.price - b.price);
      const topOffers = sorted.slice(0, 4);

      for (const watch of watches) {
        const shouldBeOffer = topOffers.some(o => o.id === watch.id);
        if (watch.isOffer !== shouldBeOffer) {
          await fetch("/api/watches", {
            method: "POST",
            body: JSON.stringify({ ...watch, isOffer: shouldBeOffer }),
          });
        }
      }
      alert("¡Sincronización Inteligente Completa! Las 4 mejores ofertas ya están en la web.");
      refreshData();
    } catch (error) {
      alert("Hubo un problema sincronizando las ofertas.");
    } finally {
      setIsSyncing(false);
    }
  };

  if (loadingAuth) return <div className="loading-container">Verificando jefe...</div>;

  if (!user) {
    return (
      <div className="login-wrapper">
        <div className="login-box animate-slide-up">
          <div className="logo-inv">MR. RELOJES</div>
          <div className="logo-badge">BGA • PREMIUM STORE</div>
          <h1>Acceso de Administrador</h1>
          <form onSubmit={handleLogin}>
            <input type="email" placeholder="Correo electrónico" value={email} onChange={e => setEmail(e.target.value)} required />
            <input type="password" placeholder="Contraseña" value={password} onChange={e => setPassword(e.target.value)} required />
            <button type="submit" className="btn-save">ENTRAR AL PANEL 🔓</button>
          </form>
          <p className="hint">Solo para el dueño del negocio, mano.</p>
        </div>
        <style jsx>{`
          .login-wrapper { height: 100vh; display: flex; align-items: center; justify-content: center; background: #000; font-family: var(--font-outfit); }
          .login-box { background: #fff; padding: 50px; border-radius: 20px; text-align: center; width: 100%; max-width: 400px; }
          .logo-inv { font-size: 24px; font-weight: 900; letter-spacing: 2px; color: #000; margin-bottom: 5px; }
          .logo-badge { font-size: 10px; background: var(--gold-gradient); color: #000; padding: 3px 10px; font-weight: 800; border-radius: 2px; margin-bottom: 30px; display: inline-block; }
          h1 { font-size: 22px; margin-bottom: 25px; font-weight: 900; }
          input { width: 100%; padding: 15px; border: 2px solid #eee; border-radius: 10px; margin-bottom: 15px; font-size: 16px; outline: none; }
          input:focus { border-color: var(--accent-gold); }
          .btn-save { background: #000; color: #fff; width: 100%; padding: 15px; border-radius: 10px; border: none; font-weight: 900; cursor: pointer; font-size: 16px; }
          .btn-save:hover { background: #333; }
          .hint { margin-top: 20px; font-size: 13px; color: #888; }
          .animate-slide-up { animation: slideUp 0.4s ease-out; }
          @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        `}</style>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <header className="admin-header">
        <div className="user-bar">
          <span>Hola, <strong>{user.email}</strong></span>
          <button onClick={handleLogout} className="btn-logout">Cerrar Sesión 👋</button>
        </div>
        <h1>Control de MrRelojesBga</h1>
        <p>Panel Súper Fácil para el Jefe • 🚀 Supabase Cloud Enabled</p>
      </header>

      {activeView === "menu" && (
        <div className="main-menu">
          <button className="big-card-btn" onClick={() => { setEditingWatchId(null); setNewWatch({ id:'', name: '', collection: '', price: '', originalPrice: '', image: '', stock: '1' }); setActiveView("watches"); }}>
            <span className="icon">⌚</span>
            <h2>Gestión de Relojes</h2>
            <p>Sube nuevos o edita los existentes</p>
          </button>
          
          <button className="big-card-btn gold" onClick={() => { setEditingSlideId(null); setNewSlide({ id:'', headline: '', subheadline: '', price: '', image: '' }); setActiveView("slider"); }}>
            <span className="icon">🔥</span>
            <h2>Banner Principal</h2>
            <p>Las imágenes grandes que se mueven</p>
          </button>

          <button className="big-card-btn offer-btn" onClick={automateOffers} disabled={isSyncing}>
            <span className="icon">{isSyncing ? "⏳" : "🪄"}</span>
            <h2>Ofertas Inteligentes</h2>
            <p>{isSyncing ? "Sincronizando..." : "Auto-crear ofertas por mejores precios"}</p>
          </button>

          <button className="big-card-btn git-btn" onClick={() => alert("Todo listo para subir a GitHub y Vercel ✅")}>
            <span className="icon">☁️</span>
            <h2>Enviar a la Web</h2>
            <p>Sincronizar cambios finales</p>
          </button>

          <div className="stats-strip">
            <div className="stat">Tenemos <strong>{watches.length}</strong> Relojes</div>
            <div className="stat">Hay <strong>{slides.length}</strong> Promociones activa</div>
          </div>
        </div>
      )}

      {activeView === "watches" && (
        <div className="view-container animate-slide-up">
          <button className="btn-back" onClick={() => setActiveView("menu")}>⬅ Volver al Menú</button>
          
          <div className="dual-view">
            <div className="easy-form">
              <h2 className="title-promo">{editingWatchId ? 'Editando Reloj 📝' : 'Subir Nuevo Reloj ✨'}</h2>
              <h2>Paso 1: ¿Cómo se llama el reloj?</h2>
              <input placeholder="Ej: Pro Diver Gold" value={newWatch.name} onChange={e => setNewWatch({...newWatch, name: e.target.value})} />
              
              <h2>Paso 2: ¿A qué colección pertenece?</h2>
              <select value={newWatch.collection} onChange={e => setNewWatch({...newWatch, collection: e.target.value})}>
                <option value="">Selecciona una...</option>
                <option value="Pro Diver">Pro Diver</option>
                <option value="Venom">Venom</option>
                <option value="Reserve">Reserve</option>
                <option value="Damas">Damas</option>
                <option value="Caballeros">Caballeros</option>
              </select>

              <h2>Paso 3: Foto del Reloj (Arrastre aquí o haga clic)</h2>
              <div 
                className={`upload-zone ${newWatch.image ? 'has-file' : ''}`}
                onDragOver={(e) => e.preventDefault()}
                onDrop={async (e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files[0];
                  if (file) {
                    const url = await handleFileUpload(file, 'watches');
                    if (url) setNewWatch({ ...newWatch, image: url });
                  }
                }}
              >
                {newWatch.image ? (
                  <div className="preview-wrap">
                    <img src={newWatch.image} alt="Preview" className="upload-preview" />
                    <button className="btn-change" onClick={() => setNewWatch({...newWatch, image: ''})}>Cambiar</button>
                  </div>
                ) : (
                  <div className="upload-placeholder">
                    <span>{uploading ? 'Subiendo... ⏳' : '📥 Arrastre la foto del reloj o toque para subir'}</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const url = await handleFileUpload(file, 'watches');
                          if (url) setNewWatch({ ...newWatch, image: url });
                        }
                      }} 
                    />
                  </div>
                )}
              </div>

              <div className="row">
                <div className="col">
                  <h2>Precio Real</h2>
                  <input type="number" placeholder="Ej: 299900" value={newWatch.price} onChange={e => setNewWatch({...newWatch, price: e.target.value})} />
                </div>
                <div className="col">
                  <h2>Precio Antes (Tachado)</h2>
                  <input type="number" placeholder="Ej: 500000" value={newWatch.originalPrice} onChange={e => setNewWatch({...newWatch, originalPrice: e.target.value})} />
                </div>
              </div>

              <div className="row">
                <div className="col">
                  <h2>Existencias (Stock)</h2>
                  <input type="number" value={newWatch.stock} onChange={e => setNewWatch({...newWatch, stock: e.target.value})} />
                </div>
              </div>

              <button className="btn-save" onClick={addWatch}>
                {editingWatchId ? 'ACTUALIZAR DATOS ✅' : '¡LISTO! SUBIR RELOJ ✅'}
              </button>
              {editingWatchId && (
                <button className="btn-cancel" onClick={() => {setEditingWatchId(null); setNewWatch({ id:'', name: '', collection: '', price: '', originalPrice: '', image: '', stock: '1' });}}>Cancelar Edición</button>
              )}
            </div>

            <div className="current-list">
              <h2>Relojes en Inventario ({watches.length})</h2>
              <div className="list-scroll">
                {watches.map(w => (
                  <div key={w.id} className="promo-item">
                    <img src={w.image} alt="prev" />
                    <div className="p-info">
                      <h4>{w.name}</h4>
                      <p>${w.price.toLocaleString()} - {w.stock} uds</p>
                      <div className="btn-group">
                        <button className="btn-edit" onClick={() => startEditWatch(w)}>Editar ✏️</button>
                        <button className="btn-del" onClick={() => deleteWatch(w.id)}>Borrar 🗑️</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeView === "slider" && (
        <div className="view-container animate-slide-up">
          <button className="btn-back" onClick={() => setActiveView("menu")}>⬅ Volver al Menú</button>
          
          <div className="dual-view">
            <div className="easy-form">
              <h2 className="title-promo">{editingSlideId ? 'Editando Banner 📝' : 'Crear Nueva Promo 🔥'}</h2>
              <input placeholder="Título Grande (Ej: GRAN OFERTA)" value={newSlide.headline} onChange={e => setNewSlide({...newSlide, headline: e.target.value})} />
              <input placeholder="Subtítulo (Ej: SOLO POR HOY)" value={newSlide.subheadline} onChange={e => setNewSlide({...newSlide, subheadline: e.target.value})} />
              <input placeholder="Precio o Texto del botón" value={newSlide.price} onChange={e => setNewSlide({...newSlide, price: e.target.value})} />
              <div 
                className={`upload-zone ${newSlide.image ? 'has-file' : ''}`}
                onDragOver={(e) => e.preventDefault()}
                onDrop={async (e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files[0];
                  if (file) {
                    const url = await handleFileUpload(file, 'slider');
                    if (url) setNewSlide({ ...newSlide, image: url });
                  }
                }}
              >
                {newSlide.image ? (
                  <div className="preview-wrap">
                    <img src={newSlide.image} alt="Preview" className="upload-preview" />
                    <button className="btn-change" onClick={() => setNewSlide({...newSlide, image: ''})}>Cambiar</button>
                  </div>
                ) : (
                  <div className="upload-placeholder">
                    <span>{uploading ? 'Subiendo... ⏳' : '🖼️ Arrastre la imagen del banner'}</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const url = await handleFileUpload(file, 'slider');
                          if (url) setNewSlide({ ...newSlide, image: url });
                        }
                      }} 
                    />
                  </div>
                )}
              </div>
              <button className="btn-save-slider" onClick={addSlide} disabled={uploading}>
                {editingSlideId ? 'ACTUALIZAR BANNER ✅' : 'AÑADIR A LA PÁGINA ✅'}
              </button>
              {editingSlideId && (
                <button className="btn-cancel" onClick={() => {setEditingSlideId(null); setNewSlide({ id:'', headline: '', subheadline: '', price: '', image: '' });}}>Cancelar</button>
              )}
            </div>

            <div className="current-list">
              <h2>Promociones Actuales</h2>
              {slides.map(s => (
                <div key={s.id} className="promo-item">
                  <img src={s.image} alt="prev" />
                  <div className="p-info">
                    <h4>{s.headline}</h4>
                    <div className="btn-group">
                      <button className="btn-edit" onClick={() => startEditSlide(s)}>Editar ✏️</button>
                      <button className="btn-del" onClick={() => deleteSlide(s.id)}>Quitar ❌</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .admin-container { padding: 40px; font-family: var(--font-outfit), sans-serif; background: #f8f9fa; min-height: 100vh; color: #333; }
        .admin-header { text-align: center; margin-bottom: 50px; }
        .admin-header h1 { font-size: 42px; font-weight: 900; color: #000; margin-bottom: 5px; }
        .admin-header p { color: #666; font-size: 18px; }

        .main-menu { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; max-width: 900px; margin: 0 auto; }
        .big-card-btn { 
          background: #fff; border: none; padding: 30px; border-radius: 20px; cursor: pointer;
          box-shadow: 0 10px 30px rgba(0,0,0,0.05); transition: 0.3s; text-align: center;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
        }
        .big-card-btn:hover:not(:disabled) { transform: translateY(-5px); box-shadow: 0 15px 35px rgba(0,0,0,0.1); }
        .big-card-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        
        .big-card-btn.gold { background: var(--gold-gradient); color: #000; }
        .big-card-btn.offer-btn { background: #fee2e2; border: 2px dashed #b91c1c; }
        .big-card-btn.git-btn { background: #e0f2fe; border: 2px dashed #0369a1; }

        .icon { font-size: 40px; display: block; margin-bottom: 15px; }
        .big-card-btn h2 { font-size: 20px; font-weight: 800; margin-bottom: 5px; }
        .big-card-btn p { font-size: 13px; color: #666; }
        .big-card-btn.gold p { color: #333; }

        .stats-strip { grid-column: 1 / span 2; display: flex; justify-content: space-around; background: #000; color: #fff; padding: 20px; border-radius: 15px; margin-top: 10px;}
        .stat strong { color: var(--accent-gold); font-size: 20px; }

        .view-container { max-width: 800px; margin: 0 auto; }
        .btn-back { background: #ddd; padding: 10px 20px; border-radius: 10px; border: none; font-weight: bold; margin-bottom: 30px; cursor: pointer; }
        
        .easy-form { background: #fff; padding: 40px; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); }
        .easy-form h2 { font-size: 14px; font-weight: bold; color: #666; margin: 15px 0 8px; text-transform: uppercase; }
        input, select { width: 100%; padding: 12px; border: 2px solid #eee; border-radius: 10px; font-size: 15px; outline: none; transition: 0.2s; }
        input:focus { border-color: var(--accent-gold); }

        .row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .btn-save { background: #000; color: #fff; width: 100%; padding: 18px; border-radius: 12px; font-size: 18px; font-weight: 900; margin-top: 30px; border: none; cursor: pointer; }
        .btn-save:hover { background: #333; }

        .dual-view { display: grid; grid-template-columns: 1.2fr 1fr; gap: 30px; }
        .btn-save-slider { background: var(--gold-gradient); color: #000; width: 100%; padding: 15px; border-radius: 10px; font-weight: bold; margin-top: 20px; border: none; cursor: pointer; }
        
        .current-list { background: #fff; padding: 20px; border-radius: 20px; }
        .promo-item { display: flex; gap: 15px; align-items: center; margin-bottom: 15px; padding: 10px; border-bottom: 1px solid #eee; }
        .promo-item img { width: 60px; height: 40px; border-radius: 5px; object-fit: cover; }
        .p-info h4 { font-size: 14px; margin-bottom: 5px; }
        .btn-del { background: #fee2e2; color: #b91c1c; border: none; padding: 5px 10px; border-radius: 5px; font-size: 12px; cursor: pointer; }

        .user-bar { display: flex; justify-content: space-between; align-items: center; max-width: 900px; margin: 0 auto 20px; font-size: 14px; background: #eee; padding: 10px 20px; border-radius: 10px; }
        .btn-logout { background: transparent; border: 1px solid #ccc; padding: 5px 12px; border-radius: 5px; cursor: pointer; font-weight: bold; }
        .btn-logout:hover { background: #fff; border-color: #000; }

        .list-scroll { max-height: 500px; overflow-y: auto; padding-right: 10px; }
        .btn-group { display: flex; gap: 10px; margin-top: 10px; }
        .btn-edit { background: #e0f2fe; color: #0369a1; border: none; padding: 5px 10px; border-radius: 5px; font-size: 12px; cursor: pointer; }
        .btn-cancel { background: #eee; color: #666; width: 100%; padding: 10px; border-radius: 10px; border: none; font-weight: bold; margin-top: 10px; cursor: pointer; }

        .upload-zone {
          border: 3px dashed var(--accent-gold);
          border-radius: 15px;
          height: 180px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #fff9f0;
          cursor: pointer;
          transition: 0.3s;
          position: relative;
          margin-bottom: 20px;
          overflow: hidden;
        }
        .upload-zone:hover { background: #fff5e6; transform: scale(1.02); }
        .upload-zone.has-file { border-style: solid; background: #fff; }
        
        .upload-placeholder { display: flex; flex-direction: column; align-items: center; text-align: center; color: #8a6d1e; font-weight: bold; font-size: 14px; width: 100%; height: 100%; justify-content: center; }
        .upload-placeholder input { position: absolute; inset: 0; opacity: 0; cursor: pointer; }
        
        .preview-wrap { width: 100%; height: 100%; position: relative; }
        .upload-preview { width: 100%; height: 100%; object-fit: contain; padding: 10px; }
        .btn-change { position: absolute; bottom: 10px; right: 10px; background: rgba(0,0,0,0.7); color: #fff; border: none; padding: 5px 12px; border-radius: 20px; font-size: 12px; cursor: pointer; }

        .animate-slide-up { animation: slideUp 0.4s ease-out; }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

        @media (max-width: 768px) {
          .admin-container { padding: 20px; }
          .admin-header h1 { font-size: 32px; }
          .main-menu { grid-template-columns: 1fr; }
          .dual-view { grid-template-columns: 1fr; }
          .row { grid-template-columns: 1fr; }
          .stats-strip { flex-direction: column; gap: 15px; text-align: center; }
          .big-card-btn { padding: 25px; }
          .easy-form { padding: 25px; }
          .dual-view { gap: 20px; }
        }
      `}</style>
    </div>
  );
}
