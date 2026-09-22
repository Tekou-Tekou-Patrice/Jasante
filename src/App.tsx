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
  ,UserSearch, Check, X, CircleCheck, Eye, Trash2, Copy
} from 'lucide-react'
import { supabase } from './lib/supabase'
import './App.css'

type View = 'dashboard' | 'categories' | 'articles' | 'videos' | 'quizzes' | 'faqs' | 'resources' | 'missing-cases' | 'missing-tips'
type Row = Record<string, any> & { id: string; created_at?: string; published?: boolean }

const views: Array<{ id: View; label: string; icon: any; table?: string }> = [
  { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { id: 'categories', label: 'Catégories', icon: Tags, table: 'categories' },
  { id: 'articles', label: 'Articles', icon: FileText, table: 'articles' },
  { id: 'videos', label: 'Vidéos', icon: PlayCircle, table: 'videos' },
  { id: 'quizzes', label: 'Quiz', icon: HelpCircle, table: 'quiz_questions' },
  { id: 'faqs', label: 'FAQs', icon: MessageSquare, table: 'faqs' },
  { id: 'resources', label: 'Ressources', icon: BookOpen, table: 'resources' },
  { id: 'missing-cases', label: 'Cas de disparition', icon: UserSearch, table: 'missing_person_cases' },
  { id: 'missing-tips', label: 'Indices reçus', icon: Eye, table: 'missing_case_tips' },
]

const labels: Record<View, string> = {
  dashboard: 'Vue d’ensemble',
  categories: 'Catégories',
  articles: 'Articles',
  videos: 'Vidéos',
  quizzes: 'Questions de quiz',
  faqs: 'Questions fréquentes (FAQ)',
  resources: 'Ressources d’aide'
  , 'missing-cases': 'Cas de disparition'
  , 'missing-tips': 'Indices reçus'
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
  'missing-cases': [],
  'missing-tips': [],
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
  const [caseFilter, setCaseFilter] = useState('pending_review')
  const [selectedCase, setSelectedCase] = useState<Row | null>(null)
  const [caseFormDraft, setCaseFormDraft] = useState<Row | null>(null)
  const [openCaseForm, setOpenCaseForm] = useState(false)
  const current = useMemo(() => views.find((item) => item.id === view), [view])

  async function load() {
    if (!supabase || !current?.table) return
    let query = supabase.from(current.table).select('*, categories(name_fr)')
    if (current.table === 'categories' || current.table === 'faqs' || current.table === 'resources') {
      query = supabase.from(current.table).select('*')
    }
    if (current.id === 'missing-cases') {
      query = supabase.from(current.table).select('*').order('created_at', { ascending: false })
      if (caseFilter !== 'all') query = query.eq('status', caseFilter)
    }
    if (current.id === 'missing-tips') {
      query = supabase.from(current.table).select('*, missing_person_cases(full_name)').order('created_at', { ascending: false })
    }
    const { data, error } = await query
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
  }, [view, authenticated, caseFilter])

  async function updateCaseStatus(row: Row, status: 'verified' | 'rejected' | 'resolved') {
    if (!supabase) return
    const updates: Record<string, unknown> = { status }
    if (status === 'verified') updates.published_at = new Date().toISOString()
    if (status === 'resolved') {
      updates.resolved_at = new Date().toISOString()
      updates.resolution_note = window.prompt('Commentaire de clôture') || null
    }

    if (status === 'rejected') {
      updates.moderation_note = window.prompt('Motif du rejet') || 'Déclaration rejetée après vérification.'
    }
    const { error } = await supabase.from('missing_person_cases').update(updates).eq('id', row.id)
    if (error) setMessage(error.message)
    else {
      setMessage(status === 'verified' ? 'Cas validé et publié.' : status === 'resolved' ? 'Cas clôturé.' : 'Cas rejeté.')
      setSelectedCase(null)
      await load()
      await loadMetadata()
    }
  }

  async function updateCaseDetails(row: Row, updates: Record<string, unknown>) {
    if (!supabase) return
    const { error } = await supabase
      .from('missing_person_cases')
      .update(updates)
      .eq('id', row.id)
    if (error) {
      setMessage(error.message)
      return
    }
    setMessage('Informations du cas mises à jour.')
    setSelectedCase(null)
    await load()
  }

  async function updateTipStatus(row: Row, status: string) {
    if (!supabase) return
    const { error } = await supabase.from('missing_case_tips').update({
      status,
      reviewed_at: new Date().toISOString(),
    }).eq('id', row.id)
    if (error) setMessage(error.message)
    else { setMessage('Indice mis à jour.'); await load(); await loadMetadata() }
  }

  function openCaseCreator(row?: Row) {
    setCaseFormDraft(row ? {
      ...row,
      status: 'pending_review',
      published_at: null,
      resolved_at: null,
      moderation_note: null,
    } : null)
    setOpenCaseForm(true)
  }

  async function saveCase(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!supabase) return
    const formData = new FormData(event.currentTarget)
    const data = Object.fromEntries(formData) as Record<string, unknown>
    const photos = formData.getAll('case_photos').filter((value): value is File => value instanceof File && value.size > 0)
    if (photos.length > 4) {
      setMessage('Vous pouvez ajouter au maximum 4 images.')
      return
    }
    const payload = {
      full_name: String(data.full_name ?? '').trim(),
      age: String(data.age ?? '').trim() === '' ? null : Number(data.age),
      description: String(data.description ?? '').trim(),
      circumstances: String(data.circumstances ?? '').trim() || null,
      last_seen_location: String(data.last_seen_location ?? '').trim(),
      reporter_name: String(data.reporter_name ?? '').trim(),
      reporter_contact: String(data.reporter_contact ?? '').trim(),
      status: 'pending_review',
    }
    const { data: createdCase, error } = await supabase
      .from('missing_person_cases')
      .insert(payload)
      .select('id')
      .single()
    if (error) {
      setMessage(error.message)
      return
    }
    const uploadedPaths: string[] = []
    try {
      for (const [index, file] of photos.entries()) {
        const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
        const path = `${createdCase.id}/admin-${Date.now()}-${index}.${extension}`
        const { error: uploadError } = await supabase.storage
          .from('missing-person-photos')
          .upload(path, file, { contentType: file.type || 'image/jpeg', upsert: false })
        if (uploadError) throw uploadError
        uploadedPaths.push(path)

        const { error: photoRowError } = await supabase.from('missing_case_photos').insert({
          case_id: createdCase.id,
          storage_path: path,
          sort_order: index,
          is_primary: index === 0,
        })
        if (photoRowError) throw photoRowError
      }
    } catch (uploadError) {
      if (uploadedPaths.length > 0) {
        await supabase.storage.from('missing-person-photos').remove(uploadedPaths)
      }
      await supabase.from('missing_person_cases').delete().eq('id', createdCase.id)
      setMessage(`Le cas n’a pas été créé avec ses images : ${uploadError instanceof Error ? uploadError.message : 'Erreur d’upload.'}`)
      return
    }
    setMessage(`Cas créé avec ${photos.length} image${photos.length > 1 ? 's' : ''}, en attente de vérification.`)
    setOpenCaseForm(false)
    setCaseFormDraft(null)
    await load()
    await loadMetadata()
  }

  async function removeMissingCase(row: Row) {
    if (!supabase || !window.confirm(`Supprimer définitivement le cas de ${row.full_name} et tous ses indices et fichiers ?`)) return
    setMessage('Suppression du cas en cours...')

    const [{ data: casePhotos, error: casePhotosError }, { data: tips, error: tipsError }] = await Promise.all([
      supabase.from('missing_case_photos').select('storage_path').eq('case_id', row.id),
      supabase.from('missing_case_tips').select('photo_storage_path').eq('case_id', row.id),
    ])
    if (casePhotosError || tipsError) {
      setMessage(casePhotosError?.message || tipsError?.message || 'Impossible de récupérer les fichiers du cas.')
      return
    }

    const paths = [
      ...(casePhotos ?? []).map((photo) => photo.storage_path),
      ...(tips ?? []).map((tip) => tip.photo_storage_path).filter(Boolean),
    ]
    if (paths.length > 0) {
      const { error: storageError } = await supabase.storage.from('missing-person-photos').remove(paths)
      if (storageError) {
        setMessage(`Les fichiers n’ont pas pu être supprimés : ${storageError.message}`)
        return
      }
    }

    const { error } = await supabase.from('missing_person_cases').delete().eq('id', row.id)
    if (error) {
      setMessage(error.message)
      return
    }
    setMessage('Cas, indices et photos supprimés.')
    setSelectedCase(null)
    await load()
    await loadMetadata()
  }

  async function removeTip(row: Row) {
    if (!supabase || !window.confirm('Supprimer définitivement cet indice et sa photo éventuelle ?')) return
    setMessage('Suppression de l’indice en cours...')

    if (row.photo_storage_path) {
      const { error: storageError } = await supabase.storage
        .from('missing-person-photos')
        .remove([row.photo_storage_path])
      if (storageError) {
        setMessage(`La photo n’a pas pu être supprimée : ${storageError.message}`)
        return
      }
    }

    const { error } = await supabase.from('missing_case_tips').delete().eq('id', row.id)
    if (error) {
      setMessage(error.message)
      return
    }
    setMessage('Indice supprimé.')
    await load()
    await loadMetadata()
  }

  async function signIn(event: FormEvent) {
    event.preventDefault()
    if (!supabase) { setAuthenticated(true); return }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setMessage(error.message); else setAuthenticated(true)
  }

async function uploadImage(file: File): Promise<string | null> {
  if (!supabase) return null

  const candidateBuckets = ['content-images', 'article-images']
  const fileExt = file.name.split('.').pop() ?? 'jpg'
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
  const filePath = `articles/${fileName}`
  let lastError = 'Vérifiez le bucket Supabase et la règle d’accès.'

  for (const bucketName of candidateBuckets) {
    try {
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type || 'image/jpeg'
        })

      if (error) {
        lastError = error.message
        console.error(`Upload failed for bucket ${bucketName}:`, error.message)
        continue
      }

      const { data: publicData } = supabase.storage.from(bucketName).getPublicUrl(data.path)
      return publicData.publicUrl
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur inconnue'
      lastError = message
      console.error(`Unexpected upload error for bucket ${bucketName}:`, message)
    }
  }

  setMessage(`Erreur upload : ${lastError}. Vérifiez le bucket "content-images" (ou l’ancien "article-images"), votre accès Supabase, et que l’utilisateur est bien admin.`)
  return null
}

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('Traitement en cours...')
    const formData = new FormData(event.currentTarget)
    const data = Object.fromEntries(formData) as any

    // Handle image upload
    const imageFile = formData.get('featured_image_url_file') as File
    let imageUploadFailed = false

    if (imageFile && imageFile.size > 0) {
      const publicUrl = await uploadImage(imageFile)
      if (publicUrl) {
        data.featured_image_url = publicUrl
      } else {
        imageUploadFailed = true
        if (editing?.featured_image_url) {
          data.featured_image_url = editing.featured_image_url
        } else {
          delete data.featured_image_url
        }
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
      setMessage(imageUploadFailed ? 'Enregistré sans image. Vérifiez le bucket Supabase "content-images" (ou l’ancien "article-images").' : 'Enregistré avec succès !');
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
      <h1>VivaCare Admin</h1>
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
        <span className="brand">VivaCare <b>Admin</b></span>
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
             <Bell size={20} color="#64748b" /><div className="avatar">V</div>
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
        ) : view === 'missing-cases' ? (
          <MissingCases rows={rows} filter={caseFilter} onFilter={(value) => setCaseFilter(value)} onOpen={setSelectedCase} onStatus={updateCaseStatus} onDelete={removeMissingCase} onCreate={() => openCaseCreator()} />
        ) : view === 'missing-tips' ? (
          <MissingTips rows={rows} onStatus={updateTipStatus} onDelete={removeTip} />
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
                  <span style={{fontSize: '13px'}}>{row.created_at ? new Date(row.created_at).toLocaleDateString('fr-FR') : '-'}</span>
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
        {selectedCase && <CaseDetails row={selectedCase} onClose={() => setSelectedCase(null)} onStatus={updateCaseStatus} onSave={updateCaseDetails} onDelete={removeMissingCase} onCopy={(row) => { setSelectedCase(null); openCaseCreator(row) }} />}
        {openCaseForm && <MissingCaseForm row={caseFormDraft} onClose={() => { setOpenCaseForm(false); setCaseFormDraft(null) }} onSave={saveCase} />}
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

function MissingCases({rows, filter, onFilter, onOpen, onStatus, onDelete, onCreate}: {
  rows: Row[]
  filter: string
  onFilter: (value: string) => void
  onOpen: (row: Row) => void
  onStatus: (row: Row, status: 'verified' | 'rejected' | 'resolved') => void
  onDelete: (row: Row) => void
  onCreate: () => void
}) {
  return (
    <>
      <div className="case-filters">
        <button className="primary" onClick={onCreate}>+ Nouveau cas</button>
        {[
          ['pending_review', 'À vérifier'],
          ['verified', 'Publiés'],
          ['resolved', 'Résolus'],
          ['rejected', 'Rejetés'],
          ['all', 'Tous'],
        ].map(([value, label]) => (
          <button key={value} className={filter === value ? 'active' : ''} onClick={() => onFilter(value)}>{label}</button>
        ))}
      </div>
      <section className="moderation-list">
        {rows.length === 0 ? <div className="empty">Aucune déclaration dans ce filtre.</div> : rows.map((row) => (
          <article className="moderation-card" key={row.id}>
            <div>
              <strong>{row.full_name}</strong>
              <small>{row.age == null ? 'Âge non renseigné' : `${row.age} ans`} · {row.last_seen_location}</small>
              <p>{String(row.description).slice(0, 180)}{String(row.description).length > 180 ? '…' : ''}</p>
            </div>
            <span className={`status ${row.status === 'pending_review' ? 'pending' : 'completed'}`}>{caseStatusLabel(row.status)}</span>
            <div className="actions">
              <button className="btn-icon" title="Voir les détails" onClick={() => onOpen(row)}><Eye size={17}/></button>
              {row.status === 'pending_review' && <>
                <button className="btn-icon success" title="Valider" onClick={() => onStatus(row, 'verified')}><Check size={17}/></button>
                <button className="btn-icon danger" title="Rejeter" onClick={() => onStatus(row, 'rejected')}><X size={17}/></button>
              </>}
              {row.status === 'verified' && <button className="btn-icon success" title="Marquer résolu" onClick={() => onStatus(row, 'resolved')}><CircleCheck size={17}/></button>}
              <button className="btn-icon danger" title="Supprimer définitivement" onClick={() => onDelete(row)}><Trash2 size={17}/></button>
            </div>
          </article>
        ))}
      </section>
    </>
  )
}

function MissingTips({rows, onStatus, onDelete}: {rows: Row[]; onStatus: (row: Row, status: string) => void; onDelete: (row: Row) => void}) {
  return (
    <section className="moderation-list">
      {rows.length === 0 ? <div className="empty">Aucun indice reçu.</div> : rows.map((row) => (
        <TipCard key={row.id} row={row} onStatus={onStatus} onDelete={onDelete} />
      ))}
    </section>
  )
}

function TipCard({row, onStatus, onDelete}: {
  row: Row
  onStatus: (row: Row, status: string) => void
  onDelete: (row: Row) => void
}) {
  const [photoUrl, setPhotoUrl] = useState('')

  useEffect(() => {
    let cancelled = false
    async function loadPhoto() {
      if (!supabase || !row.photo_storage_path) return
      const { data, error } = await supabase.storage
        .from('missing-person-photos')
        .createSignedUrl(row.photo_storage_path, 1800)
      if (!cancelled && !error) setPhotoUrl(data?.signedUrl ?? '')
    }
    void loadPhoto()
    return () => { cancelled = true }
  }, [row.photo_storage_path])

  return (
    <article className="moderation-card tip-card">
      <div>
        <strong>{row.missing_person_cases?.full_name || 'Cas inconnu'}</strong>
        <small>{row.created_at ? new Date(row.created_at).toLocaleString('fr-FR') : '-'} · {row.is_anonymous ? 'Anonyme' : (row.contributor_name || 'Contributeur identifié')}</small>
        <p>{row.message}</p>
        {row.contributor_contact && <small>Contact : {row.contributor_contact}</small>}
        {photoUrl && <img className="tip-photo" src={photoUrl} alt="Photo envoyée avec l’indice" />}
      </div>
      <span className={`status ${row.status === 'new' ? 'pending' : 'completed'}`}>{tipStatusLabel(row.status)}</span>
      <div className="actions">
        {row.status === 'new' && <button className="btn-icon success" title="Marquer traité" onClick={() => onStatus(row, 'actioned')}><Check size={17}/></button>}
        {row.status !== 'dismissed' && <button className="btn-icon danger" title="Ignorer" onClick={() => onStatus(row, 'dismissed')}><X size={17}/></button>}
        <button className="btn-icon danger" title="Supprimer définitivement" onClick={() => onDelete(row)}><Trash2 size={17}/></button>
      </div>
    </article>
  )
}

function CaseDetails({row, onClose, onStatus, onSave, onDelete, onCopy}: {
  row: Row
  onClose: () => void
  onStatus: (row: Row, status: 'verified' | 'rejected' | 'resolved') => void
  onSave: (row: Row, updates: Record<string, unknown>) => void
  onDelete: (row: Row) => void
  onCopy: (row: Row) => void
}) {
  const [fullName, setFullName] = useState(String(row.full_name ?? ''))
  const [age, setAge] = useState(row.age == null ? '' : String(row.age))
  const [description, setDescription] = useState(String(row.description ?? ''))
  const [location, setLocation] = useState(String(row.last_seen_location ?? ''))
  const [circumstances, setCircumstances] = useState(String(row.circumstances ?? ''))
  const [photos, setPhotos] = useState<string[]>([])
  const [photoError, setPhotoError] = useState('')
  useEffect(() => {
    let cancelled = false
    async function loadPhotos() {
      if (!supabase) return
      const { data, error } = await supabase
        .from('missing_case_photos')
        .select('storage_path')
        .eq('case_id', row.id)
        .order('sort_order')
      if (error) {
        if (!cancelled) setPhotoError(`Photos indisponibles : ${error.message}`)
        return
      }
      const paths = (data ?? []).map((photo) => photo.storage_path).filter(Boolean)
      if (paths.length === 0) {
        if (!cancelled) setPhotos([])
        return
      }
      const result = await supabase.storage.from('missing-person-photos').createSignedUrls(paths, 1800)
      if (!cancelled) {
        const urls = (result.data ?? [])
          .map((photo) => photo.signedUrl)
          .filter((url): url is string => Boolean(url))
        setPhotos(urls)
        if (result.error || urls.length === 0) {
          setPhotoError(`Photos indisponibles : ${result.error?.message ?? 'URL sécurisée non générée.'}`)
        }
      }
    }
    void loadPhotos()
    return () => { cancelled = true }
  }, [row.id])

  return (
    <div className="modal"><section className="case-detail">
      <header><h2>{row.full_name}</h2><button className="btn-icon" onClick={onClose}><X size={20}/></button></header>
      <div className="detail-grid">
        <label><b>Nom complet <span className="required-mark">*</span></b><input required value={fullName} onChange={(event) => setFullName(event.target.value)} /></label>
        <label><b>Âge</b><input type="number" value={age} onChange={(event) => setAge(event.target.value)} /></label>
        <label><b>Dernière localisation <span className="required-mark">*</span></b><input required value={location} onChange={(event) => setLocation(event.target.value)} /></label>
        <div><b>Statut</b><p>{caseStatusLabel(row.status)}</p></div>
        <div><b>Dernière apparition</b><p>{row.last_seen_at ? new Date(row.last_seen_at).toLocaleString('fr-FR') : 'Non renseignée'}</p></div>
        <label className="full"><b>Description <span className="required-mark">*</span></b><textarea required value={description} onChange={(event) => setDescription(event.target.value)} /></label>
        <label className="full"><b>Circonstances</b><textarea value={circumstances} onChange={(event) => setCircumstances(event.target.value)} /></label>
        <div><b>Déclarant</b><p>{row.reporter_name}</p></div>
        <div><b>Contact privé</b><p>{row.reporter_contact}</p></div>
      </div>
      {photoError && <p className="photo-error">{photoError}</p>}
      {photos.length > 0 && <div className="detail-photos">{photos.map((url) => <img key={url} src={url} alt={`Photo de ${row.full_name}`} />)}</div>}
      <footer>
        <button className="secondary" onClick={onClose}>Fermer</button>
        <button className="secondary" onClick={() => onCopy(row)}><Copy size={16}/> Copier comme nouveau cas</button>
        <button className="secondary" onClick={() => onSave(row, {
          full_name: fullName.trim(),
          age: age.trim() === '' ? null : Number(age),
          description: description.trim(),
          last_seen_location: location.trim(),
          circumstances: circumstances.trim() || null,
        })}>Enregistrer les modifications</button>
        {row.status === 'pending_review' && <>
          <button className="secondary danger-button" onClick={() => onStatus(row, 'rejected')}>Rejeter</button>
          <button className="primary" onClick={() => onStatus(row, 'verified')}>Valider et publier</button>
        </>}
        {row.status === 'verified' && <button className="primary" onClick={() => onStatus(row, 'resolved')}>Marquer résolu</button>}
        <button className="secondary danger-button" onClick={() => onDelete(row)}>Supprimer définitivement</button>
      </footer>
    </section></div>
  )
}

function MissingCaseForm({row, onClose, onSave}: {
  row: Row | null
  onClose: () => void
  onSave: (event: FormEvent<HTMLFormElement>) => void
}) {
  const [previews, setPreviews] = useState<string[]>([])

  function handlePhotos(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []).slice(0, 4)
    setPreviews(files.map((file) => URL.createObjectURL(file)))
  }

  return (
    <div className="modal"><form onSubmit={onSave}>
      <header><h2>{row ? 'Copier le cas comme nouvelle publication' : 'Créer un cas de disparition'}</h2></header>
      <p className="form-hint">Les champs marqués d’un <span className="required-mark">*</span> sont obligatoires. Le cas sera créé en attente de vérification.</p>
      <div className="form-grid">
        <label>Nom complet <span className="required-mark">*</span>
          <input name="full_name" defaultValue={String(row?.full_name ?? '')} required />
        </label>
        <label>Âge
          <input name="age" type="number" min="0" max="130" defaultValue={row?.age == null ? '' : String(row.age)} />
        </label>
        <label className="full">Description <span className="required-mark">*</span>
          <textarea name="description" defaultValue={String(row?.description ?? '')} required />
        </label>
        <label className="full">Circonstances
          <textarea name="circumstances" defaultValue={String(row?.circumstances ?? '')} />
        </label>
        <label className="full">Dernière localisation <span className="required-mark">*</span>
          <input name="last_seen_location" defaultValue={String(row?.last_seen_location ?? '')} required />
        </label>
        <label>Nom du déclarant <span className="required-mark">*</span>
          <input name="reporter_name" defaultValue={String(row?.reporter_name ?? '')} required />
        </label>
        <label>Contact du déclarant <span className="required-mark">*</span>
          <input name="reporter_contact" defaultValue={String(row?.reporter_contact ?? '')} required />
        </label>
        <label className="full">Images du cas (facultatif, 4 maximum)
          <input name="case_photos" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={handlePhotos} />
          <span className="form-hint">Formats acceptés : JPG, PNG ou WebP.</span>
          {previews.length > 0 && (
            <div className="case-upload-previews">
              {previews.map((preview, index) => <img key={preview} src={preview} alt={`Aperçu ${index + 1}`} />)}
            </div>
          )}
        </label>
      </div>
      <footer><button type="button" className="secondary" onClick={onClose}>Annuler</button><button className="primary">Enregistrer le cas</button></footer>
    </form></div>
  )
}

function caseStatusLabel(status: string) {
  return ({pending_review: 'À vérifier', verified: 'Publié', rejected: 'Rejeté', resolved: 'Résolu'} as Record<string, string>)[status] || status
}

function tipStatusLabel(status: string) {
  return ({new: 'Nouveau', reviewed: 'Consulté', actioned: 'Traité', dismissed: 'Ignoré'} as Record<string, string>)[status] || status
}

export default App
