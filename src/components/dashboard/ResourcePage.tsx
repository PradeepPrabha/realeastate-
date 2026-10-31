import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Button, ConfirmDialog, DataTable, FileUploader, Input, Modal, Select, Textarea } from '@/components/common'
import type { Column } from '@/components/common'
import { useDebounce } from '@/hooks/useDebounce'
import { useSeo } from '@/hooks/useSeo'
import { adminApi } from '@/services/api'
import { parseApiError } from '@/services/http'
import PageHeader from './PageHeader'

export interface FieldDef {
  name: string; label: string; type?: 'text' | 'number' | 'email' | 'tel' | 'textarea' | 'select' | 'checkbox' | 'image' | 'date' | 'tags' | 'password'
  options?: (string | { value: string | number; label: string })[]; numeric?: boolean; required?: boolean; full?: boolean; hint?: string; createOnly?: boolean; min?: number
}
type Row = { id: number }
interface Props<T extends Row> {
  resource: string; title: string; subtitle?: string; columns: Column<T>[]; fields?: FieldDef[]; defaults?: Record<string, unknown>
  canCreate?: boolean; canEdit?: boolean; canDelete?: boolean; createLabel?: string; searchPlaceholder?: string
  filters?: { name: string; label: string; options: (string | { value: string; label: string })[] }[]
  rowActions?: (row: T, refresh: () => void) => ReactNode; createFn?: (b: Record<string, unknown>) => Promise<unknown>; extraActions?: ReactNode; modalSize?: 'md' | 'lg'; fixedQuery?: Record<string, string>
}

export default function ResourcePage<T extends Row>({ resource, title, subtitle, columns, fields = [], defaults = {}, canCreate = true, canEdit = true, canDelete = true, createLabel, searchPlaceholder = 'Search…', filters = [], rowActions, createFn, extraActions, modalSize = 'md', fixedQuery }: Props<T>) {
  useSeo({ title: `Admin – ${title}` })
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [term, setTerm] = useState('')
  const [fv, setFv] = useState<Record<string, string>>({})
  const [editing, setEditing] = useState<T | 'new' | null>(null)
  const [del, setDel] = useState<T | null>(null)
  const dq = useDebounce(term)
  const key = ['admin', resource, page, dq, fv, fixedQuery]
  const q = useQuery({ queryKey: key, queryFn: () => adminApi.list<T>(resource, { page, q: dq, ...fv, ...fixedQuery }), placeholderData: (p) => p })
  const refresh = () => void qc.invalidateQueries({ queryKey: ['admin', resource] })
  const rm = useMutation({ mutationFn: (id: number) => adminApi.remove(resource, id), onSuccess: () => { toast.success('Deleted'); setDel(null); refresh() }, onError: (e) => toast.error(parseApiError(e).message) })

  const cols: Column<T>[] = [...columns]
  if (rowActions || canEdit || canDelete) cols.push({ key: '_actions', header: 'Actions', render: (r) => (
    <div className="flex items-center gap-1">{rowActions?.(r, refresh)}
      {canEdit && fields.length > 0 && <button onClick={() => setEditing(r)} aria-label="Edit" className="rounded-lg p-2 text-navy-500 hover:bg-navy-50"><Pencil className="h-4 w-4" /></button>}
      {canDelete && <button onClick={() => setDel(r)} aria-label="Delete" className="rounded-lg p-2 text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>}</div>) })
  return (
    <>
      <PageHeader title={title} subtitle={subtitle} actions={<>
        <input value={term} onChange={(e) => { setTerm(e.target.value); setPage(1) }} placeholder={searchPlaceholder} aria-label="Search" className="input !w-52" />
        {filters.map((f) => <select key={f.name} aria-label={f.label} value={fv[f.name] ?? ''} onChange={(e) => { setFv({ ...fv, [f.name]: e.target.value }); setPage(1) }} className="input !w-40"><option value="">{f.label}</option>{f.options.map((o) => { const op = typeof o === 'string' ? { value: o, label: o } : o; return <option key={op.value} value={op.value}>{op.label}</option> })}</select>)}
        {extraActions}{canCreate && fields.length > 0 && <Button onClick={() => setEditing('new')} icon={<Plus className="h-4 w-4" />}>{createLabel ?? 'Add new'}</Button>}</>} />
      <DataTable columns={cols} rows={q.data?.data ?? []} rowKey={(r) => r.id} loading={q.isLoading} meta={q.data?.meta} onPage={setPage} />
      {editing && <FormModal<T> size={modalSize} resource={resource} title={title} fields={fields} defaults={defaults} row={editing === 'new' ? null : editing} createFn={createFn} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); refresh() }} />}
      <ConfirmDialog open={!!del} message="This record will be permanently deleted. This action cannot be undone." confirmLabel="Delete" loading={rm.isPending} onConfirm={() => del && rm.mutate(del.id)} onCancel={() => setDel(null)} />
    </>
  )
}

function FormModal<T extends Row>({ resource, title, fields, defaults, row, createFn, onClose, onSaved, size }: { resource: string; title: string; fields: FieldDef[]; defaults: Record<string, unknown>; row: T | null; createFn?: (b: Record<string, unknown>) => Promise<unknown>; onClose: () => void; onSaved: () => void; size: 'md' | 'lg' }) {
  const init = () => Object.fromEntries(fields.map((f) => { const v = row ? (row as unknown as Record<string, unknown>)[f.name] : defaults[f.name]; return [f.name, f.type === 'tags' ? (Array.isArray(v) ? v.join(', ') : '') : f.type === 'checkbox' ? !!v : f.type === 'image' ? (v ? [String(v)] : []) : v ?? ''] }))
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<Record<string, unknown>>({ defaultValues: init() })
  useEffect(() => { reset(init()) }, [row]) // eslint-disable-line react-hooks/exhaustive-deps
  const m = useMutation({
    mutationFn: (v: Record<string, unknown>) => {
      const body: Record<string, unknown> = {}
      for (const f of fields) { const x = v[f.name]; body[f.name] = f.type === 'number' ? (x === '' ? undefined : Number(x)) : f.type === 'tags' ? String(x).split(',').map((s) => s.trim()).filter(Boolean) : f.type === 'image' ? ((x as string[])[0] ?? '') : f.type === 'select' && f.numeric ? (x === '' ? undefined : Number(x)) : x }
      return row ? adminApi.update(resource, row.id, body) : createFn ? createFn(body) : adminApi.create(resource, body)
    },
    onSuccess: () => { toast.success(row ? 'Saved' : 'Created'); onSaved() }, onError: (e) => { const er = parseApiError(e); toast.error(Object.values(er.fields)[0] ?? er.message) },
  })
  return (
    <Modal open onClose={onClose} title={`${row ? 'Edit' : 'Add'} – ${title}`} size={size} footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button loading={m.isPending} onClick={handleSubmit((v) => m.mutate(v))}>{row ? 'Save changes' : 'Create'}</Button></>}>
      <form onSubmit={handleSubmit((v) => m.mutate(v))} className="grid gap-4 sm:grid-cols-2" noValidate>
        {fields.filter((f) => !(row && f.createOnly)).map((f) => {
          const err = errors[f.name]?.message as string | undefined
          const wrap = f.full || f.type === 'textarea' || f.type === 'image' ? 'sm:col-span-2' : ''
          const rules = { required: f.required ? `${f.label} is required` : false, ...(f.type === 'email' ? { pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email' } } : {}) }
          if (f.type === 'textarea') return <Textarea key={f.name} wrapperClassName={wrap} label={f.label} rows={4} error={err} hint={f.hint} {...register(f.name, rules)} />
          if (f.type === 'select') return <Select key={f.name} wrapperClassName={wrap} label={f.label} placeholder="Select…" options={f.options ?? []} error={err} {...register(f.name, rules)} />
          if (f.type === 'checkbox') return <label key={f.name} className={`flex items-center gap-2 text-sm font-semibold ${wrap}`}><input type="checkbox" className="h-4 w-4 accent-gold" {...register(f.name)} />{f.label}</label>
          if (f.type === 'image') return <div key={f.name} className={wrap}><FileUploader label={f.label} max={1} value={(watch(f.name) as string[]) ?? []} onChange={(v) => setValue(f.name, v)} /></div>
          return <Input key={f.name} wrapperClassName={wrap} label={f.label} type={f.type === 'tags' ? 'text' : f.type ?? 'text'} min={f.min} step={f.type === 'number' ? 'any' : undefined} hint={f.hint} error={err} {...register(f.name, rules)} />
        })}
      </form>
    </Modal>
  )
}
