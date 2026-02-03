'use client'

import { useEffect, useRef } from 'react'

const STAR_COUNT = 2000
const FOV = 200

function getTrailColor(): string {
  if (typeof document === 'undefined') return 'rgba(0, 0, 0, 0.2)'
  const theme = document.documentElement.getAttribute('data-theme')
  return theme === 'light' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)'
}

function getStarColor(): string {
  if (typeof document === 'undefined') return 'rgb(255, 255, 255)'
  const color = getComputedStyle(document.documentElement).getPropertyValue('--color-neutral-strong').trim()
  if (color) return color
  const theme = document.documentElement.getAttribute('data-theme')
  return theme === 'light' ? 'rgb(24, 24, 27)' : 'rgb(250, 250, 250)'
}

export function UniverseBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const frameRef = useRef<number>(0)
  const stateRef = useRef({
    width: 0,
    height: 0,
    centerX: 0,
    centerY: 0,
    mouseX: 0,
    mouseY: 0,
    scrollDepth: 1,
    stars: [] as { x: number; y: number; z: number }[],
  })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    function setSize() {
      const w = canvas!.parentElement?.clientWidth ?? window.innerWidth
      const h = canvas!.parentElement?.clientHeight ?? window.innerHeight
      canvas!.width = w
      canvas!.height = h
      stateRef.current.width = w
      stateRef.current.height = h
      stateRef.current.centerX = w / 2
      stateRef.current.centerY = h / 2
    }

    setSize()
    const state = stateRef.current

    if (state.stars.length === 0) {
      for (let i = 0; i < STAR_COUNT; i++) {
        state.stars.push({
          x: (Math.random() - 0.5) * 2000,
          y: (Math.random() - 0.5) * 2000,
          z: Math.random() * 2000,
        })
      }
    }

    function animate() {
      if (!ctx) return
      const trailColor = getTrailColor()
      const starColorBase = getStarColor()
      const isRgb = starColorBase.startsWith('rgb')
      const starRgb = isRgb
        ? starColorBase.replace('rgb(', '').replace(')', '').split(',').map((n) => parseInt(n.trim(), 10))
        : [255, 255, 255]

      ctx.fillStyle = trailColor
      ctx.fillRect(0, 0, state.width, state.height)

      for (let i = 0; i < state.stars.length; i++) {
        const star = state.stars[i]
        star.z -= 0.5 + state.scrollDepth * 0.025

        if (star.z <= 1) {
          star.z = 2000
        }

        const scale = FOV / (FOV + star.z)
        const x2d = (star.x + state.mouseX * 5) * scale + state.centerX
        const y2d = (star.y + state.mouseY * 5) * scale + state.centerY

        const brightness = 1 - star.z / 2000
        ctx.beginPath()
        ctx.arc(x2d, y2d, scale * 2, 0, Math.PI * 2)
        ctx.fillStyle = isRgb
          ? `rgba(${starRgb[0]}, ${starRgb[1]}, ${starRgb[2]}, ${brightness})`
          : `rgba(255, 255, 255, ${brightness})`
        ctx.fill()
      }

      frameRef.current = requestAnimationFrame(animate)
    }

    const handleResize = () => {
      setSize()
    }

    const handleMouseMove = (e: MouseEvent) => {
      state.mouseX = (e.clientX - state.centerX) / state.centerX
      state.mouseY = (e.clientY - state.centerY) / state.centerY
    }

    const handleWheel = (e: WheelEvent) => {
      state.scrollDepth += e.deltaY * 0.05
      if (state.scrollDepth < -200) state.scrollDepth = -50
      if (state.scrollDepth > 500) state.scrollDepth = 500
    }

    const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!prefersReducedMotion) {
      animate()
    }

    window.addEventListener('resize', handleResize)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('wheel', handleWheel, { passive: true })

    return () => {
      cancelAnimationFrame(frameRef.current)
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('wheel', handleWheel)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 block w-full h-full"
      style={{ width: '100%', height: '100%' }}
      aria-hidden
    />
  )
}
