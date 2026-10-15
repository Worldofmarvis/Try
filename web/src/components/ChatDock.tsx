import { useEffect, useId, useRef, useState } from 'react'
import { useChat } from '../hooks/useChat'
import type { Role } from '../types/marketplace'
import ChatPanel from './ChatPanel'
import { ChatIcon, CloseIcon } from './icons'

type Props = { negotiationId: string; counterpartName: string; viewerRole: Role }

/**
 * The chat lives in the bottom-right corner, like a messenger: a round button that opens the panel.
 * It stays mounted while closed, so new messages keep arriving and are counted on the button.
 */
export default function ChatDock({ negotiationId, counterpartName, viewerRole }: Props) {
  const chat = useChat(negotiationId)
  const [open, setOpen] = useState(false)
  // How many messages were already there when the person last looked. null until the first load finishes.
  const [seen, setSeen] = useState<number | null>(null)
  const launcher = useRef<HTMLButtonElement>(null)
  const panelId = useId()
  const { messages, loading } = chat

  useEffect(() => {
    if (seen === null && !loading) setSeen(messages.length)
    if (open && seen !== null && seen !== messages.length) setSeen(messages.length)
  }, [seen, loading, open, messages.length])

  const unread =
    open || seen === null
      ? 0
      : messages.slice(seen).filter((m) => m.from !== 'system' && m.from !== viewerRole).length

  function close() {
    setOpen(false)
    launcher.current?.focus()
  }

  const firstName = counterpartName.split(' ')[0]

  return (
    <div className="chat-dock">
      <ChatPanel
        id={panelId}
        chat={chat}
        counterpartName={counterpartName}
        viewerRole={viewerRole}
        open={open}
        onClose={close}
      />
      <button
        ref={launcher}
        type="button"
        className={`chat-launcher${open ? ' is-open' : ''}`}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={
          open ? 'Close chat' : unread > 0 ? `Open chat with ${firstName}, ${unread} new` : `Open chat with ${firstName}`
        }
        onClick={() => (open ? close() : setOpen(true))}
      >
        {open ? <CloseIcon size={20} /> : <ChatIcon size={22} />}
        <span className="chat-launcher-label">{open ? 'Close' : 'Chat'}</span>
        {unread > 0 && (
          <span className="chat-badge" aria-hidden="true">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
    </div>
  )
}
