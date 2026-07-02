// Helper de cliente para persistir cambios vía el endpoint /api/mutate
type Op = 'insert' | 'update' | 'delete' | 'insertMany'

export async function mutate(
  table: string,
  op: Op,
  payload: { data?: any; id?: string }
): Promise<any> {
  const res = await fetch('/api/mutate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ table, op, ...payload }),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Error al guardar')
  return json
}
