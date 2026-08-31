import { type FormEvent, useEffect, useMemo, useState, useRef } from 'react'
import {
  BookOpen,
  FileText,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  PlayCircle,
  Tags,
  Settings,
  ChevronDown,
  Search,
  Bell,
  MessageSquare,
  Plus,
  Upload
} from 'lucide-react'
import { supabase } from './lib/supabase'
import './App.css'

type View = 'dashboard' | 'categories' | 'articles' | 'videos' | 'quizzes' | 'faqs' | 'resources'
type Row = Record<string, any> & { id: string; created_at?: string; published?: boolean }

const views: Array<{ id: View; label: string; icon: any; table?: string }> = [
  { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { id: 'categories', label: 'Catégories', icon: Tags, table: 'categories' },
  { id: 'articles', label: 'Articles', icon: FileText, table: 'articles' },
  { id: 'videos', label: 'Vidéos', icon: PlayCircle, table: 'videos' },
  { id: 'quizzes', label: 'Quiz', icon: HelpCircle, table: 'quiz_questions' },
  { id: 'faqs', label: 'FAQs', icon: MessageSquare, table: 'faqs' },
  { id: 'resources', label: 'Ressources', icon: BookOpen, table: 'resources' },
]

const labels: Record<View, string> = {
  dashboard: 'Vue d’ensemble',
  categories: 'Catégories',
  articles: 'Articles',
  videos: 'Vidéos',
  quizzes: 'Questions de quiz',
  faqs: 'Questions fréquentes (FAQ)',
  resources: 'Ressources d’aide'
}

const fieldSets: Record<Exclude<View, 'dashboard'>, Array<[string, string, string]>> = {
  categories: [
    ['name_fr', 'Nom (FR)', 'text'], ['name_en', 'Nom (EN)', 'text'],
    ['description_fr', 'Description (FR)', 'text'], ['description_en', 'Description (EN)', 'text'],
    ['display_order', 'Ordre d’affichage', 'number'], ['icon_url', 'URL de l’icône', 'text']
  ],
  articles: [
    ['title_fr', 'Titre (FR)', 'text'], ['title_en', 'Titre (EN)', 'text'],
    ['body_fr', 'Contenu (FR)', 'textarea'], ['body_en', 'Contenu (EN)', 'textarea'],
    ['excerpt_fr', 'Extrait (FR)', 'text'], ['excerpt_en', 'Extrait (EN)', 'text'],
    ['featured_image_url', 'Image de couverture', 'image_upload'], ['author', 'Auteur', 'text']
  ],
  videos: [
    ['title_fr', 'Titre (FR)', 'text'], ['title_en', 'Titre (EN)', 'text'],
    ['description_fr', 'Description (FR)', 'textarea'], ['description_en', 'Description (EN)', 'textarea'],
    ['youtube_url', 'Lien YouTube', 'url'], ['thumbnail_url', 'URL miniature', 'url'],
    ['duration_seconds', 'Durée (secondes)', 'number']
  ],
  quizzes: [
    ['question_fr', 'Question (FR)', 'textarea'], ['question_en', 'Question (EN)', 'textarea'],
    ['options_fr', 'Options FR (ex: ["A", "B", "C", "D"])', 'textarea'],
    ['options_en', 'Options EN (ex: ["A", "B", "C", "D"])', 'textarea'],
    ['correct_option_index', 'Index réponse correcte (0-3)', 'number'],
    ['explanation_fr', 'Explication (FR)', 'textarea'], ['explanation_en', 'Explication (EN)', 'textarea'],
    ['display_order', 'Ordre d’affichage', 'number']
  ],
  faqs: [
    ['question_fr', 'Question (FR)', 'text'], ['question_en', 'Question (EN)', 'text'],
    ['answer_fr', 'Réponse (FR)', 'textarea'], ['answer_en', 'Réponse (EN)', 'textarea']
  ],
  resources: [
    ['name_fr', 'Nom (FR)', 'text'], ['name_en', 'Nom (EN)', 'text'],
    ['description_fr', 'Description (FR)', 'textarea'], ['description_en', 'Description (EN)', 'textarea'],
    ['type', 'Type (ex: health_center, association)', 'text'],
    ['phone', 'Téléphone', 'tel'], ['whatsapp', 'WhatsApp', 'tel'], ['address', 'Adresse', 'text']
  ],
}

function App() {
  const [view, setView] = useState<View>('dashboard')
  const [rows, setRows] = useState<Row[]>([])
  const [categories, setCategories] = useState<Row[]>([])
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authenticated, setAuthenticated] = useState(false)
  const [openForm, setOpenForm] = useState(false)
  const [editing, setEditing] = useState<Row | null>(null)
  const [message, setMessage] = useState('')
  const current = useMemo(() => views.find((item) => item.id === view), [view])

  async function load() {
    if (!supabase || !current?.table) return
    let query = supabase.from(current.table).select('*, categories(name_fr)')
    if (current.table === 'categories' || current.table === 'faqs' || current.table === 'resources') {
      query = supabase.from(current.table).select('*')
    }
    const { data, error } = await query.order('created_at', { ascending: false })
    setRows((data ?? []) as Row[])
    if (error) setMessage(error.message)
  }

  async function loadMetadata() {
    if (!supabase) return
    const client = supabase
    const { data } = await client.from('categories').select('id, name_fr').order('name_fr')
    setCategories((data ?? []) as Row[])
    const pairs = await Promise.all(views.filter(v => v.table).map(async (v) =>
      [v.id, (await client.from(v.table!).select('*', { count: 'exact', head: true })).count ?? 0] as const
    ))
    setCounts(Object.fromEntries(pairs))
  }

  useEffect(() => {
    if (authenticated) { void load(); void loadMetadata() }
  }, [view, authenticated])

  async function signIn(event: FormEvent) {
    event.preventDefault()
    if (!supabase) { setAuthenticated(true); return }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setMessage(error.message); else setAuthenticated(true)
  }

async function uploadImage(file: File): Promise<string | null> {
  if (!supabase) return null
  const fileExt = file.name.split('.').pop()
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
  const filePath = `articles/${fileName}`

  const { error: uploadError } = await supabase.storage
    .from('article-images')
    .upload(filePath, file)

  if (uploadError) {
    console.error('Error uploading image:', uploadError.message)
    setMessage(`Erreur upload : ${uploadError.message}`)
    return null
  }

  const { data } = supabase.storage.from('article-images').getPublicUrl(filePath)
  return data.publicUrl
}

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('Traitement en cours...')
    const formData = new FormData(event.currentTarget)
    const data = Object.fromEntries(formData) as any

    // Handle image upload
    const imageFile = formData.get('featured_image_url_file') as File
    if (imageFile && imageFile.size > 0) {
      const publicUrl = await uploadImage(imageFile)
      if (publicUrl) {
        data.featured_image_url = publicUrl
      } else {
        setMessage('Erreur lors de l’envoi de l’image.')
        return
      }
    }
    delete data.featured_image_url_file

    // Logic conversion
    if (data.display_order) data.display_order = parseInt(data.display_order)
    if (data.duration_seconds) data.duration_seconds = parseInt(data.duration_seconds)
    if (data.correct_option_index) data.correct_option_index = parseInt(data.correct_option_index)

    if (data.options_fr) {
      try { data.options_fr = JSON.parse(data.options_fr) } catch (e) { setMessage('JSON invalide (FR)'); return }
    }
    if (data.options_en) {
      try { data.options_en = JSON.parse(data.options_en) } catch (e) { setMessage('JSON invalide (EN)'); return }
    }

    data.published = formData.get('published') === 'true'

    if (!supabase || !current?.table) return
    const result = editing
      ? await supabase.from(current.table).update(data).eq('id', editing.id)
      : await supabase.from(current.table).insert(data)

    if (result.error) setMessage(result.error.message);
    else {
      setMessage('Enregistré avec succès !');
      setOpenForm(false);
      setEditing(null);
      load();
      loadMetadata()
    }
  }

  async function remove(row: Row) {
    if (!confirm('Supprimer cet élément ?')) return
    if (!supabase || !current?.table) return
    const { error } = await supabase.from(current.table).delete().eq('id', row.id)
    if (error) setMessage(error.message); else { load(); loadMetadata() }
  }

  if (!authenticated) return (
    <main className="login"><section>
      <div className="login-icon"><LayoutDashboard size={48}/></div>
      <h1>JaSanté Admin</h1>
      <p>Connectez-vous pour gérer les contenus mobiles.</p>
      <form onSubmit={signIn}>
        <label>Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
        <label>Mot de passe<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></label>
        <button>Se connecter</button>
      </form>
      {message && <p style={{marginTop: '20px', color: '#ef4444'}}>{message}</p>}
    </section></main>
  )

  return (
    <div className="shell">
      <aside className="sidebar">
        <span className="brand">JaSanté <b>Admin</b></span>
        <nav>{views.map(({id, label, icon: Icon}) => (
          <button key={id} className={view === id ? 'active' : ''} onClick={() => {setView(id); setOpenForm(false); setMessage('')}}>
            <Icon size={20}/>{label}
          </button>
        ))}</nav>
        <button className="logout" onClick={() => {supabase?.auth.signOut(); setAuthenticated(false)}}><LogOut size={20}/>Déconnexion</button>
      </aside>

      <main className="content">
        <header>
          <div><h1>{labels[view]}</h1><p className="eyebrow">{counts[view] ?? 0} éléments au total</p></div>
          <div style={{display: 'flex', gap: '20px', alignItems: 'center'}}>
             <div className="search-box"><Search size={16} color="#64748b"/><input type="text" placeholder="Rechercher..." /></div>
             <Bell size={20} color="#64748b" /><div className="avatar">J</div>
          </div>
        </header>

        {view === 'dashboard' ? (
          <div className="dashboard-grid">{views.filter(v => v.table).map(({id, label, icon: Icon}) => (
            <div key={id} onClick={() => setView(id)} className="card-link">
              <div className="card-icon"><Icon size={28}/></div>
              <div className="card-label">{label}</div>
              <div className="card-count">{counts[id] ?? 0}</div>
            </div>
          ))}</div>
        ) : (
          <><div className="tab-bar"><button className="tab active">Tous les contenus</button></div>
            <section className="table">
              <div className="table-head"><span>Id</span><span>Titre / Nom</span><span>Catégorie</span><span>Statut</span><span>Date</span><span style={{textAlign: 'right'}}>Actions</span></div>
              {rows.length === 0 ? <div className="empty">Aucune donnée trouvée.</div> : rows.map((row) => (
                <article key={row.id}>
                  <span className="id-tag">#{row.id.slice(0, 5)}</span>
                  <div>
                    <strong>{String(row.title_fr ?? row.name_fr ?? row.question_fr ?? row.name ?? 'Sans titre')}</strong>
                    <small>{row.title_en || row.name_en || ''}</small>
                  </div>
                  <span>{row.categories?.name_fr || '-'}</span>
                  <div><span className={`status ${row.published ? 'completed' : 'pending'}`}>{row.published ? 'Public' : 'Brouillon'}</span></div>
                  <span style={{fontSize: '13px'}}>{new Date(row.created_at || Date.now()).toLocaleDateString('fr-FR')}</span>
                  <div className="actions" style={{justifyContent: 'flex-end'}}>
                    <button onClick={() => {setEditing(row); setOpenForm(true)}} className="btn-icon"><Settings size={18}/></button>
                    <button onClick={() => remove(row)} className="btn-icon danger"><ChevronDown size={18}/></button>
                  </div>
                </article>
              ))}
            </section>
            <button onClick={() => {setEditing(null); setOpenForm(true)}} className="fab"><Plus size={24} /></button>
            {openForm && <Editor view={view as Exclude<View,'dashboard'>} row={editing} categories={categories} onClose={() => {setOpenForm(false); setEditing(null)}} onSave={save}/>}
          </>
        )}
        {message && <div className="toast">{message}</div>}
      </main>
    </div>
  )
}

function Editor({view, row, categories, onClose, onSave}: {view: Exclude<View,'dashboard'>; row: Row|null; categories: Row[]; onClose: () => void; onSave: (e: FormEvent<HTMLFormElement>) => void}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(row?.featured_image_url || null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="modal"><form onSubmit={onSave}>
      <header><h2>{row ? 'Modifier' : 'Nouveau'} : {labels[view]}</h2></header>
      <div className="form-grid">
        {['articles', 'videos', 'quizzes'].includes(view) && (
          <label className="full">Catégorie
            <select name="category_id" defaultValue={String(row?.category_id ?? '')} required>
              <option value="">Sélectionner une catégorie</option>
              {categories.map(c => <option key={c.id} value={c.id}>{String(c.name_fr)}</option>)}
            </select>
          </label>
        )}
        {fieldSets[view].map(([name, label, type]) => {
          if (type === 'image_upload') {
            return (
              <label key={name} className="full">
                {label}
                <div className="image-upload-container" onClick={() => fileInputRef.current?.click()}>
                  {imagePreview ? (
                    <div className="image-preview">
                      <img src={imagePreview} alt="Aperçu" />
                      <div className="image-overlay"><Upload size={20} /><span>Changer d'image</span></div>
                    </div>
                  ) : (
                    <div className="upload-placeholder">
                      <Upload size={32} />
                      <span>Cliquez pour importer depuis votre machine</span>
                    </div>
                  )}
                  <input
                    type="file"
                    name={`${name}_file`}
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    style={{ display: 'none' }}
                  />
                  <input type="hidden" name={name} defaultValue={String(row?.[name] ?? '')} />
                </div>
              </label>
            );
          }
          return (
            <label key={name} className={type === 'textarea' || name.includes('url') || name.startsWith('options') ? 'full' : ''}>
              {label}{type === 'textarea' ? <textarea name={name} defaultValue={name.startsWith('options') ? JSON.stringify(row?.[name] || []) : String(row?.[name] ?? '')} required={!name.includes('excerpt')} /> : <input name={name} type={type} defaultValue={String(row?.[name] ?? '')} required={!name.includes('url') && !name.includes('author') && !name.includes('icon') && !name.includes('address')} />}
            </label>
          )
        })}
        <label className="full">Statut de publication
          <select name="published" defaultValue={String(row?.published ?? 'false')}>
            <option value="false">Brouillon (Masqué)</option><option value="true">Publié (Visible sur mobile)</option>
          </select>
        </label>
      </div>
      <footer><button type="button" className="secondary" onClick={onClose}>Annuler</button><button className="primary">Enregistrer</button></footer>
    </form></div>
  )
}

export default App
