'use client'
import { useState } from 'react'

export type Notification = {
  id: number
  message: string
  type?: 'success' | 'error'
}

export function Notifications() {
  const [notifs, setNotifs] = useState<Notification[]>([])

  const remove = (id: number) => setNotifs(n => n.filter(nf => nf.id !== id))

  return (
    <div className="fixed top-4 right-4 space-y-2 z-50">
      {notifs.map(n => (
        <div
          key={n.id}
          className={`px-4 py-2 rounded text-white ${n.type === 'error' ? 'bg-red-500' : 'bg-green-500'}`}
          onClick={() => remove(n.id)}
        >
          {n.message}
        </div>
      ))}
    </div>
  )
}
