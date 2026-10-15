import { useMemo, type ReactNode } from 'react'
import { AgStudio, AgStudioProvider } from 'ag-studio-react'
import type { Negotiation } from '../types/marketplace'

// Loaded on demand by OfferHistory, so AG Studio is only downloaded when someone opens a negotiation.
const LICENSE = (import.meta.env.VITE_AG_STUDIO_LICENSE ?? '').trim()

const SOURCE = 'offers'

// One grid widget over one data source, the same shape as the AG Studio "State" docs.
function gridState(columns: string[]) {
  return {
    pages: [
      {
        id: 'history',
        widgets: {
          '1': { type: 'grid', dataMapping: { cols: columns.map((c) => ({ id: `${SOURCE}.${c}` })) } },
        },
        widgetLayout: { '1': { xTrack: 0, yTrack: 0, xSpan: 24, ySpan: 16 } },
      },
    ],
    selectedPageId: 'history',
  }
}

/**
 * Every offer of the negotiation as an AG Studio grid: sortable, filterable, resizable columns.
 * It only ever uses what this person may see: their own limit, never the other side's.
 */
export default function OfferHistoryGrid({ negotiation }: { negotiation: Negotiation }) {
  const { offers, viewerRole, buyerLimits, sellerLimits } = negotiation

  // A buyer compares each offer with their maximum, a seller with their price floor.
  const limitField = viewerRole === 'buyer' ? 'vsYourMax' : 'vsYourFloor'
  const limit = viewerRole === 'buyer' ? buyerLimits?.max : sellerLimits?.floor

  const rowsJson = JSON.stringify(
    [...offers]
      .sort((a, b) => a.round - b.round || (a.role === 'buyer' ? -1 : 1))
      .map((o) => ({
        round: o.round,
        agent: o.role === viewerRole ? 'Your agent' : o.role === 'buyer' ? 'Buyer agent' : 'Seller agent',
        offer: o.amount,
        engineCheck: o.blocked ? `Adjusted from $${o.blocked.proposed}` : 'Passed',
        ...(limit != null && { [limitField]: o.amount - limit }),
        note: o.note,
      })),
  )

  // Stable objects: Studio reads them again only when the offers really change.
  const data = useMemo(() => ({ sources: [{ id: SOURCE, data: JSON.parse(rowsJson) }] }), [rowsJson])
  const initialState = useMemo(
    () => gridState(['round', 'agent', 'offer', 'engineCheck', ...(limit != null ? [limitField] : []), 'note']),
    [limit, limitField],
  )

  // The state object follows the AG Studio docs; it is typed loosely here so the compiler does not
  // reject a valid shape. If Studio reports it as invalid, re-create it in edit mode and copy it with getState().
  const studio: ReactNode = <AgStudio data={data} initialState={initialState as never} mode="view" />
  return (
    <div className="offer-history-grid">
      {LICENSE ? <AgStudioProvider licenseKey={LICENSE}>{studio}</AgStudioProvider> : studio}
    </div>
  )
}
