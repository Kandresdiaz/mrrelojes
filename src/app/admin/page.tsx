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
  const [activeView, setActiveView] = useState<"menu" | "watches" | "slider" | "offers" | "import">("menu");
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

  // CSV Import
  const [csvImporting, setCsvImporting] = useState(false);
  const [csvProgress, setCsvProgress] = useState({ done: 0, total: 0, current: '', errors: [] as string[] });
  const [csvPreview, setCsvPreview] = useState<any[]>([]);

  const downloadTemplate = () => {
    const header = 'nombre,coleccion,precio,precio_antes,url_imagen,stock,descripcion';
    const example1 = 'KOSMO RELOJ HOMBRE DORADO,Caballeros,230000,320000,https://ejemplo.com/foto.jpg,1,"Reloj elegante con acabado dorado"';
    const example2 = 'INVICTA PRO DIVER AZUL,Pro Diver,180000,250000,https://ejemplo.com/foto2.jpg,2,"Resistente al agua 200m"';
    const example3 = 'RELOJ DAMA PLATEADO,Damas,150000,200000,https://ejemplo.com/foto3.jpg,1,"Elegante reloj femenino"';
    const csv = [header, example1, example2, example3].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'plantilla_relojes_mrrelojes.csv'; a.click();
  };

  const parseCsv = (text: string) => {
    const lines = text.trim().split('\n');
    const headers = lines[0].split(',');
    return lines.slice(1).map((line, i) => {
      // Handle quoted fields
      const cols: string[] = [];
      let cur = ''; let inQuote = false;
      for (const ch of line) {
        if (ch === '"') { inQuote = !inQuote; }
        else if (ch === ',' && !inQuote) { cols.push(cur.trim()); cur = ''; }
        else { cur += ch; }
      }
      cols.push(cur.trim());
      return {
        id: 'watch-import-' + Date.now() + '-' + i,
        name: cols[0] || '',
        collection: cols[1] || 'Caballeros',
        price: Number(cols[2]?.replace(/[^0-9]/g, '')) || 0,
        originalPrice: Number(cols[3]?.replace(/[^0-9]/g, '')) || 0,
        image: cols[4] || '',
        stock: Number(cols[5]) || 1,
        description: cols[6] || '',
        rating: 5, reviews: 0,
        specs: { caseSize: '40mm', movement: 'Cuarzo', waterResistance: '50m' }
      };
    }).filter(w => w.name && w.image);
  };

  const handleCsvFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      // Detect JSON or CSV
      const trimmed = text.trim();
      if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
        // JSON from bookmarklet
        try {
          if (file.name.endsWith('.html')) {
            // Parser especial para archivos HTML de Facebook Guardados
            const parser = new DOMParser();
            const doc = parser.parseFromString(trimmed, 'text/html');
            const watches: any[] = [];
            
            // Buscamos los contenedores de los anuncios (listitems)
            const cards = Array.from(doc.querySelectorAll('div[role="listitem"]'));
            
            cards.forEach((card, i) => {
              const text = card.textContent || '';
              const img = card.querySelector('img')?.src || '';
              const priceMatch = text.match(/\$[0-9.]+/);
              
              // Intentamos sacar el nombre (suele ser el primer texto largo)
              const namePart = text.split('$')[0].trim().split('\n').pop()?.trim() || 'Reloj Importado';
              
              if (priceMatch && img && !img.includes('data:image')) {
                watches.push({
                  id: 'fb-html-' + Date.now() + '-' + i,
                  name: namePart,
                  price: parseInt(priceMatch[0].replace(/[^0-9]/g, '')),
                  image: img,
                  images: [img],
                  collection: mapCollection(namePart),
                  stock: 1,
                  description: 'Importado de Facebook Marketplace (HTML)',
                  rating: 5, reviews: 0,
                  specs: { caseSize: '40mm', movement: 'Cuarzo', waterResistance: '50m' }
                });
              }
            });
            
            if (watches.length === 0) {
              alert('¡Mano! No encontré relojes en ese archivo. Asegúrese de guardar la página de Facebook completa (Ctrl + S).');
            } else {
              setCsvPreview(watches);
            }
            return;
          }

          const raw = JSON.parse(trimmed);
          const arr = Array.isArray(raw) ? raw : [raw];
          const parsed = arr.map((item: any, i: number) => ({
            id: 'watch-import-' + Date.now() + '-' + i,
            name: item.name || item.title || item.nombre || '',
            collection: item.collection || item.coleccion || mapCollection(item.name || item.title || ''),
            price: Number(String(item.price || item.precio || 0).replace(/[^0-9]/g, '')) || 0,
            originalPrice: Number(String(item.originalPrice || item.precio_antes || item.price || 0).replace(/[^0-9]/g, '')) || 0,
            image: item.image || (item.images && item.images[0]) || item.imagen || '',
            images: item.images || [item.image || item.imagen || ''],
            stock: Number(item.stock) || 1,
            description: item.description || item.descripcion || '',
            rating: 5, reviews: 0,
            specs: { 
              caseSize: item.specs?.caseSize || '40mm', 
              movement: item.specs?.movement || 'Cuarzo', 
              waterResistance: item.specs?.waterResistance || '50m' 
            }
          })).filter((w: any) => w.name && w.image);
          setCsvPreview(parsed);
        } catch { alert('El archivo no tiene el formato correcto.'); }
      } else {
        const parsed = parseCsv(trimmed);
        setCsvPreview(parsed);
      }
    };
    reader.readAsText(file, 'utf-8');
  };

  // Auto-detectar colección por nombre del reloj
  const mapCollection = (name: string): string => {
    const n = name.toLowerCase();
    if (n.includes('dama') || n.includes('mujer') || n.includes('lady') || n.includes('femenin')) return 'Damas';
    if (n.includes('invicta') && n.includes('pro diver')) return 'Pro Diver';
    if (n.includes('venom')) return 'Venom';
    if (n.includes('reserve')) return 'Reserve';
    if (n.includes('automatico') || n.includes('automático') || n.includes('automatic')) return 'Automáticos';
    if (n.includes('cronografo') || n.includes('chrono')) return 'Cronógrafos';
    return 'Caballeros';
  };

  const runCsvImport = async () => {
    if (csvPreview.length === 0) return;
    setCsvImporting(true);
    setCsvProgress({ done: 0, total: csvPreview.length, current: '', errors: [] });
    const errors: string[] = [];
    for (let i = 0; i < csvPreview.length; i++) {
      const w = csvPreview[i];
      setCsvProgress(p => ({ ...p, done: i, current: w.name }));
      try {
        const res = await fetch('/api/watches', { method: 'POST', body: JSON.stringify(w) });
        if (!res.ok) errors.push(`Error en: ${w.name}`);
      } catch { errors.push(`Fallo: ${w.name}`); }
      await new Promise(r => setTimeout(r, 150));
    }
    setCsvProgress(p => ({ ...p, done: csvPreview.length, current: '✅ ¡Completado!', errors }));
    setCsvImporting(false);
    setCsvPreview([]);
    refreshData();
  };

  const removePreviewItem = (index: number) => {
    setCsvPreview(prev => prev.filter((_, i) => i !== index));
  };


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

          <button className="big-card-btn import-btn" onClick={() => { setCsvPreview([]); setCsvProgress({ done: 0, total: 0, current: '', errors: [] }); setActiveView("import"); }}>
            <span className="icon">📦</span>
            <h2>Importar Masivo CSV</h2>
            <p>Sube 100+ relojes de una vez desde Excel</p>
          </button>

          <button className="big-card-btn offer-btn" onClick={automateOffers} disabled={isSyncing}>
            <span className="icon">{isSyncing ? "⏳" : "🪄"}</span>
            <h2>Ofertas Inteligentes</h2>
            <p>{isSyncing ? "Sincronizando..." : "Auto-crear ofertas por mejores precios"}</p>
          </button>

          <div className="stats-strip">
            <div className="stat">Tenemos <strong>{watches.length}</strong> Relojes</div>
            <div className="stat">Hay <strong>{slides.length}</strong> Promociones activas</div>
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

      {activeView === "import" && (
        <div className="view-container animate-slide-up">
          <button className="btn-back" onClick={() => setActiveView("menu")}>⬅ Volver al Menú</button>

          <div className="import-header">
            <span className="version-badge">v2.1 - Control Total ✨</span>
            <h2>📦 Importación Masiva de Relojes</h2>
            <p>Use el Robot Scraper para sacar los datos de Facebook o use la plantilla de Excel.</p>
          </div>

          {/* PASO 0 - ROBOT SCRAPER */}
          <div className="import-step bookmarklet-step">
            <div className="step-num">0</div>
            <div className="step-body">
              <h3 className="gold-text">🤖 Robot Scraper (Súper Rápido)</h3>
              <p>Extraiga sus 100+ relojes de Facebook en 1 segundo con este botón mágico:</p>
              
              <div className="bookmarklet-box">
                <p><strong>Instrucciones:</strong></p>
                <ol>
                  <li>Arrastre este botón a su barra de favoritos: <a href={`javascript:(function(){const items=[];const isDetail=window.location.href.includes('marketplace/item');if(isDetail){const title=document.querySelector('span[dir="auto"]')?.innerText;const priceStr=Array.from(document.querySelectorAll('span')).find(s=>s.innerText.includes('$'))?.innerText;const images=[...new Set(Array.from(document.querySelectorAll('img')).filter(i=>i.src.includes('fbcdn')&&i.width>100).map(i=>i.src))];if(title&&priceStr){items.push({name:title,price:parseInt(priceStr.replace(/[^0-9]/g,"")),images:images,image:images[0],collection:"Marketplace",stock:1,description:document.querySelector('div[style*="white-space: pre-wrap"]')?.innerText||""});}}else{document.querySelectorAll('div[role="listitem"]').forEach(card=>{const title=card.innerText.split('\\n')[0];const priceStr=card.innerText.match(/\\$[0-9.]+/)?.[0];const images=[...new Set(Array.from(card.querySelectorAll('img')).filter(i=>i.src.includes('fbcdn')).map(i=>i.src))];if(title&&priceStr&&images.length>0){items.push({name:title,price:parseInt(priceStr.replace(/[^0-9]/g,"")),images:images,image:images[0],collection:"Marketplace",stock:1});}});}if(items.length===0){alert("No encontré nada, mano. Baje un poco más.");return;}const blob=new Blob([JSON.stringify(items,null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="relojes.json";a.click();alert("¡Listo! Saqué "+items.length+" anuncios.");})()`} className="bookmarklet-btn">EXTRAER RELOJES 🚀</a></li>
                  <li>Vaya a su Facebook Marketplace.</li>
                  <li><strong>Tip:</strong> Si quiere TODAS las fotos de un reloj, entre a ver ese reloj específico y hunda el botón.</li>
                  <li>Suba el archivo <code>relojes.json</code> aquí abajo.</li>
                </ol>
              </div>
            </div>
          </div>

          {/* PASO 1 - EXCEL */}
          <div className="import-step">
            <div className="step-num">1</div>
            <div className="step-body">
              <h3>Opción B: Usar Plantilla de Excel (CSV)</h3>
              <p>Si prefiere llenar los datos a mano en Excel, use esta plantilla:</p>
              <button className="btn-download" onClick={downloadTemplate}>⬇️ Descargar plantilla.csv</button>
            </div>
          </div>

          {/* PASO 2 - URL IMAGENES */}
          <div className="import-step">
            <div className="step-num">2</div>
            <div className="step-body">
              <h3>¿Cómo pongo las fotos? (Si usa Excel)</h3>
              <p>Tiene <strong>3 opciones</strong> para la columna <code>url_imagen</code>:</p>
              <div className="tip-cards">
                <div className="tip-card">
                  <span>📋</span>
                  <strong>A — URL de Facebook</strong>
                  <p>Marketplace → Clic derecho foto → "Copiar dirección imagen".</p>
                </div>
                <div className="tip-card best">
                  <span>⭐ MEJOR</span>
                  <strong>B — Google Drive</strong>
                  <p>Sube a Drive → Comparte link público → Úsalo.</p>
                </div>
                <div className="tip-card">
                  <span>🔗</span>
                  <strong>C — Imgur</strong>
                  <p>Sube a imgur.com → Copia link .jpg.</p>
                </div>
              </div>
            </div>
          </div>

          {/* PASO 3 - SUBIR ARCHIVO */}
          <div className="import-step">
            <div className="step-num">3</div>
            <div className="step-body">
              <h3>Sube tu archivo (JSON o CSV)</h3>
              <div
                className="csv-drop-zone"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleCsvFile(f); }}
              >
                <span>📂 Arrastre su archivo aquí o toque para seleccionar</span>
                <input type="file" accept=".csv,.json" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleCsvFile(f); }} />
              </div>
            </div>
          </div>

          {/* PREVIEW */}
          {csvPreview.length > 0 && (
            <div className="csv-preview">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h3>✅ Se detectaron <strong>{csvPreview.length}</strong> relojes listos:</h3>
                <button className="btn-row-del large" onClick={() => setCsvPreview([])}>🧹 BORRAR TODA LA LISTA</button>
              </div>
              <div className="preview-table-wrap">
                <table className="preview-table">
                  <thead>
                    <tr><th>#</th><th>Reloj</th><th>Precio</th><th>Fotos</th><th>Descripción</th><th>Acción</th></tr>
                  </thead>
                  <tbody>
                    {csvPreview.map((w, i) => (
                      <tr key={i}>
                        <td>{i + 1}</td>
                        <td>
                          <strong>{w.name}</strong><br/>
                          <small className="badge-col">{w.collection}</small>
                        </td>
                        <td>${w.price.toLocaleString()}</td>
                        <td>
                          <div className="img-preview-cell">
                            {w.image ? <img src={w.image} alt="prev" className="csv-thumb" /> : <span className="no-img">Sin foto</span>}
                            {w.images && w.images.length > 0 && (
                              <span className="gallery-count">
                                {w.images.length > 1 ? `🖼️ ${w.images.length} fotos` : '🖼️ 1 foto'}
                              </span>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="desc-preview">{w.description || 'Sin descripción'}</div>
                        </td>
                        <td>
                          <button className="btn-row-del large" onClick={() => removePreviewItem(i)}>🗑️ QUITAR</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {!csvImporting && csvProgress.done === 0 && (
                <button className="btn-import-now" onClick={runCsvImport}>
                  🚀 ¡IMPORTAR ESTOS {csvPreview.length} RELOJES AHORA!
                </button>
              )}
            </div>
          )}

          {/* PROGRESO */}
          {(csvImporting || csvProgress.done > 0) && (
            <div className="import-progress">
              <h3>{csvImporting ? `Importando... ${csvProgress.done}/${csvProgress.total}` : `✅ ¡Importación completa! ${csvProgress.done} relojes subidos`}</h3>
              <div className="progress-bar-bg">
                <div className="progress-bar-fill" style={{ width: `${csvProgress.total > 0 ? (csvProgress.done / csvProgress.total) * 100 : 0}%` }} />
              </div>
              {csvProgress.current && <p className="progress-current">{csvImporting ? `⏳ Subiendo: ${csvProgress.current}` : csvProgress.current}</p>}
              {csvProgress.errors.length > 0 && (
                <div className="import-errors">
                  <strong>⚠️ Algunos errores:</strong>
                  {csvProgress.errors.map((e, i) => <p key={i}>{e}</p>)}
                </div>
              )}
              {!csvImporting && csvProgress.done > 0 && (
                <button className="btn-back" style={{marginTop: '20px'}} onClick={() => setActiveView("menu")}>🏠 Ir al Panel Principal</button>
              )}
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        .admin-container { padding: 40px; font-family: var(--font-outfit), sans-serif; background: #f8f9fa; min-height: 100vh; color: #333; }
        .admin-header { text-align: center; margin-bottom: 50px; }
        .admin-header h1 { font-size: 42px; font-weight: 900; color: #000; margin-bottom: 5px; }
        .admin-header p { color: #666; font-size: 18px; }

        .main-menu { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; max-width: 900px; margin: 0 auto; }
        .big-card-btn.import-btn { background: linear-gradient(135deg, #e0f7fa, #b2ebf2); border: 2px dashed #00838f; }

        .import-header { text-align: center; margin-bottom: 30px; background: #fff; padding: 30px; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); }
        .import-header h2 { font-size: 28px; font-weight: 900; margin-bottom: 10px; }
        .import-header p { color: #666; font-size: 15px; }

        .import-step { display: flex; gap: 20px; background: #fff; padding: 25px; border-radius: 16px; margin-bottom: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); }
        .bookmarklet-step { border: 2px solid var(--accent-gold); background: #fffdf0; }
        .gold-text { color: #8a6d1e; }
        .bookmarklet-box { background: #fff; padding: 15px; border-radius: 10px; border: 1px solid #eee; margin-top: 10px; }
        .bookmarklet-box ol { padding-left: 20px; font-size: 13px; color: #444; }
        .bookmarklet-box li { margin-bottom: 8px; }
        .bookmarklet-btn { 
          display: inline-block; background: #000; color: #fff !important; padding: 5px 12px; 
          border-radius: 6px; text-decoration: none !important; font-weight: 900; font-size: 12px;
          border: 2px solid #000; transition: 0.2s;
        }
        .bookmarklet-btn:hover { background: var(--accent-gold); color: #000 !important; border-color: var(--accent-gold); }

        .step-num { background: #000; color: #fff; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 18px; flex-shrink: 0; }
        .step-body h3 { font-size: 17px; font-weight: 800; margin-bottom: 8px; }
        .step-body p { color: #555; font-size: 14px; line-height: 1.6; margin-bottom: 12px; }
        code { background: #f0f0f0; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-family: monospace; }

        .btn-download { background: #000; color: #fff; padding: 12px 25px; border-radius: 10px; border: none; font-weight: 900; cursor: pointer; font-size: 14px; }
        .btn-download:hover { background: #333; }

        .tip-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 10px; }
        .tip-card { background: #f9f9f9; border: 1px solid #eee; border-radius: 10px; padding: 15px; font-size: 13px; }
        .tip-card span { font-size: 20px; display: block; margin-bottom: 5px; }
        .tip-card strong { display: block; margin-bottom: 6px; font-size: 13px; }
        .tip-card p { color: #666; font-size: 12px; line-height: 1.5; margin: 0; }
        .tip-card.best { border: 2px solid var(--accent-gold); background: #fffdf0; }
        .tip-card.best span { color: var(--accent-gold); font-weight: 900; font-size: 13px; }

        .csv-drop-zone { border: 3px dashed #00838f; border-radius: 12px; padding: 40px; text-align: center; background: #e0f7fa; cursor: pointer; position: relative; font-weight: bold; color: #006064; transition: 0.3s; }
        .csv-drop-zone:hover { background: #b2ebf2; }
        .csv-drop-zone input { position: absolute; inset: 0; opacity: 0; cursor: pointer; width: 100%; height: 100%; }

        .csv-preview { background: #fff; padding: 25px; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); margin-top: 30px; border: 2px solid #eee; position: relative; }
        .preview-table-wrap { 
          max-height: 450px; 
          overflow-y: auto; 
          border: 1px solid #eee; 
          border-radius: 12px; 
          margin: 15px 0; 
          background: #fff;
          box-shadow: inset 0 2px 10px rgba(0,0,0,0.05);
        }
        .preview-table { width: 100%; border-collapse: separate; border-spacing: 0; font-size: 13px; }
        .preview-table th { 
          position: sticky; 
          top: -1px; 
          background: #000; 
          color: #fff; 
          z-index: 20; 
          padding: 12px 15px; 
          text-align: left;
          box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        .preview-table td { padding: 8px 15px; border-bottom: 1px solid #eee; background: #fff; vertical-align: middle; }
        .preview-table tr:hover td { background: #fcfcfc; }
        .csv-thumb { width: 50px; height: 35px; object-fit: cover; border-radius: 4px; }
        .no-img { color: #e31e24; font-size: 11px; }
        .badge-col { background: #000; color: #fff; padding: 2px 8px; border-radius: 10px; font-size: 11px; white-space: nowrap; }

        .btn-import-now { width: 100%; margin-top: 20px; padding: 20px; background: #000; color: #fff; border: none; border-radius: 12px; font-size: 20px; font-weight: 900; cursor: pointer; transition: 0.3s; }
        .btn-import-now:hover { background: var(--accent-gold); color: #000; }

        .import-progress { background: #fff; padding: 30px; border-radius: 16px; margin-top: 20px; text-align: center; box-shadow: 0 4px 20px rgba(0,0,0,0.05); }
        .import-progress h3 { font-size: 20px; font-weight: 900; margin-bottom: 15px; }
        .progress-bar-bg { background: #eee; border-radius: 10px; height: 20px; overflow: hidden; margin-bottom: 10px; }
        .progress-bar-fill { height: 100%; background: linear-gradient(90deg, #d4af37, #f9e1a1, #d4af37); transition: width 0.3s; border-radius: 10px; }
        .progress-current { color: #555; font-size: 14px; margin-top: 8px; }
        .import-errors { background: #fee2e2; border-radius: 8px; padding: 15px; margin-top: 15px; text-align: left; font-size: 13px; color: #b91c1c; }
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
        .img-preview-cell { position: relative; width: 60px; height: 40px; margin: 0 auto; }
        .btn-row-del { background: transparent; border: 1px solid #fee2e2; padding: 5px; border-radius: 5px; cursor: pointer; transition: 0.2s; }
        .btn-row-del:hover { background: #fee2e2; }

        .version-badge { background: #000; color: #fff; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 900; margin-bottom: 15px; display: inline-block; }
        .btn-row-del.large { background: #fee2e2; color: #b91c1c; padding: 10px 15px; font-weight: 900; border: none; font-size: 11px; }
        .btn-row-del.large:hover { background: #fecaca; transform: scale(1.05); }

        .desc-preview { 
          max-width: 250px; 
          font-size: 11px; 
          color: #666; 
          max-height: 50px; 
          overflow-y: auto; 
          line-height: 1.3; 
          white-space: pre-wrap;
          background: #f9f9f9;
          padding: 5px;
          border-radius: 5px;
        }

        .gallery-count { 
          position: absolute; bottom: -5px; right: -5px; background: #000; color: #fff; 
          font-size: 10px; padding: 2px 10px; border-radius: 10px; font-weight: 900; 
          border: 2px solid #fff; box-shadow: 0 2px 5px rgba(0,0,0,0.2); 
          white-space: nowrap;
        }

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
