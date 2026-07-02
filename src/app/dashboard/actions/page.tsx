'use client'

import styles from './actions.module.css'

const mockActions = [
  { id: 1, title: 'Agendar 4 sesiones con el cliente — RD2', desc: 'Danane, Terrassa, ISMC, Procyon', owner: 'Andersson / Paul', status: 'pending', due: 'Esta semana' },
  { id: 2, title: 'Resolver observación FF — Perú', desc: 'Cálculo USD en guardado de tabla', owner: 'Christopher', status: 'pending', due: 'Hoy' },
  { id: 3, title: 'Emitir Go — Perú Embotelladora', desc: 'Enviar correo para pruebas integrales', owner: 'David', status: 'pending', due: 'Hoy' },
  { id: 4, title: 'BBP oficial + FF — Uruguay', desc: 'Doc oficial BG/DRE al cliente · levantar FF', owner: 'Paul / David', status: 'pending', due: 'Hoy 3pm' },
  { id: 5, title: 'Iniciar Guatemala (balance)', desc: 'Sociedad más compleja · liberar agenda', owner: 'Paul', status: 'pending', due: '2/jul' },
  { id: 6, title: 'Replanificación de cronograma', desc: 'Sincerar GT/UY/HT con la fecha límite', owner: 'Andersson+Paul+Christopher', status: 'pending', due: 'Semana' },
]

export default function ActionsPage() {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Próximos Pasos</h1>
        <p>6 acciones de coordinación</p>
      </div>

      <div className={styles.list}>
        {mockActions.map(action => (
          <div key={action.id} className={styles.item}>
            <div className={styles.head}>
              <span className={styles.num}>{action.id}</span>
              <div><h3>{action.title}</h3><p>{action.desc}</p></div>
            </div>
            <div className={styles.meta}>
              <span className={styles.owner}>{action.owner}</span>
              <span className={styles.due}>{action.due}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
