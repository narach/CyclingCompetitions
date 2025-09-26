import { useEffect, useMemo, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import L from 'leaflet'
import 'leaflet-gpx'

type ViewerState = { gpxUrl?: string, title?: string }

export default function RouteViewer() {
  const { state } = useLocation() as { state?: ViewerState }
  const navigate = useNavigate()
  const containerRef = useRef<HTMLDivElement | null>(null)
  const gpxUrl = state?.gpxUrl
  const title = state?.title || 'Route'

  const isValid = useMemo(() => typeof gpxUrl === 'string' && !!gpxUrl, [gpxUrl])

  useEffect(() => {
    if (!containerRef.current || !isValid) return
    const map = L.map(containerRef.current, {
      center: [42.4411, 19.2636],
      zoom: 10
    })

    const tiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    })
    tiles.addTo(map)

    // @ts-ignore types provided by leaflet-gpx at runtime
    const gpx = new L.GPX(gpxUrl, {
      async: true,
      marker_options: {
        startIconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        endIconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
      }
    })
      .on('addline', function (e: any) {
        // Ensure map is ready and container mounted before fitting bounds
        const run = () => {
          try {
            if (!containerRef.current) return
            map.invalidateSize()
            const bounds = e.target?.getBounds?.() || this.getBounds?.()
            if (bounds) {
              map.fitBounds(bounds)
            }
          } catch {}
        }
        // Defer to next frame to avoid timing issues when adding layers
        if (typeof window !== 'undefined' && window.requestAnimationFrame) {
          window.requestAnimationFrame(run)
        } else {
          setTimeout(run, 0)
        }
      })
      .addTo(map)

    return () => {
      map.remove()
    }
  }, [isValid, gpxUrl])

  if (!isValid) {
    return (
      <div>
        <h2>Route</h2>
        <div className="alert alert-warning">No GPX URL provided.</div>
        <button className="btn btn-outline-secondary" onClick={() => navigate(-1)}>Back</button>
      </div>
    )
  }

  return (
    <div>
      <h2>{title}</h2>
      <div ref={containerRef} style={{ height: '70vh', width: '100%' }} />
      <div className="mt-2">
        <a href={gpxUrl} target="_blank" rel="noreferrer">Download GPX</a>
      </div>
    </div>
  )
}


