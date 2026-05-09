# PPP Tools — Interface Design System

## Direction & Feel

**User:** Estudiante rural colombiano, 10–17 años, contexto cafetero/agrícola. Accede desde celular. Aprende sobre Escuela y Café o Seguridad Alimentaria. No es gamer — es aprendiz que registra trabajo real de campo.

**Feel:** Cuaderno de campo vibrante. Cálido y orgánico. Energía de exploración al aire libre. No corporativo, no generic-gamified-app.

**Signature element:** Anillo SVG de progreso (como anillos de árbol / cereza de café en corte) — aparece en InsigniasEstudiante. Stats de perfil emergen del banner como tarjeta flotante con elevación.

---

## Color Palette

Todos los colores deben trazarse a estos primitivos — sin hex valores huérfanos.

```
-- Superficies (misma temperatura, sólo claridad varía) --
surface-canvas:    #f5efe6   (parchment — fondo de página)
surface-warm:      #faf7f3   (ligeramente más frío que canvas)
surface-card:      #ffffff   (blanco puro para tarjetas elevadas)

-- Bordes (rgba para fusionarse con la superficie) --
border-default:    rgba(107,76,58,0.15)  ≈ border-[#e8dcca]
border-soft:       rgba(107,76,58,0.08)  ≈ border-[#f0e8dc]
border-emphasis:   #d4c4a8

-- Texto --
text-primary:      #4a3222   (dark roast)
text-secondary:    #6b4c3a   (medium roast)
text-muted:        #a68a64   (tan)
text-on-dark:      #ffffff

-- Brand / Acción --
brand-dark:        #2c1810
brand:             #4a3222
brand-mid:         #6b4c3a
brand-light:       #8b6b54
brand-surface:     #f5efe6

-- Semánticos --
success:           emerald-500 / emerald-50 bg / emerald-100 border
warning/pending:   amber-500   / amber-50 bg  / amber-100 border
error/rejected:    red-500     / red-50 bg    / red-100 border
info:              sky-500     / sky-50 bg    / sky-100 border
```

---

## Depth Strategy

**Borders-only** para la mayoría de tarjetas.
**Sombra sutil** (`shadow-md`, `shadow-lg`) sólo en: tarjetas flotantes (stats sobre banner), modales, podio.
No mezclar enfoques. Un card no debe tener borde Y sombra dramática.

Elevación:
- L0: canvas `#f5efe6`
- L1: card con `border border-[#e8dcca]` sin sombra
- L2: card con `border` + `shadow-md`
- L3: modal con `shadow-2xl`

---

## Spacing

Base unit: `4px` (Tailwind default).
Scale: 1 (4px) · 2 (8px) · 3 (12px) · 4 (16px) · 5 (20px) · 6 (24px) · 8 (32px)

Card padding: `p-4` (16px) o `p-5` (20px).
Section gaps: `space-y-4` o `space-y-5`.
Inner component gaps: `gap-2` o `gap-3`.

---

## Typography

Labels de sección: `text-[10px] font-bold uppercase tracking-widest text-[#a68a64]`
Títulos de tarjeta: `text-sm font-bold text-[#4a3222]`
Cuerpo: `text-xs text-[#6b4c3a] leading-relaxed`
Datos grandes (stats): `text-xl font-bold text-[#4a3222]`

---

## Border Radius

- Inputs, botones pequeños: `rounded-xl` (12px)
- Cards, modales: `rounded-2xl` (16px)
- Pills/badges: `rounded-full`
- No mezclar sharp y round dentro de un mismo componente.

---

## Component Patterns

### Profile Banner
```
bg-gradient-to-br from-[#2c1810] via-[#4a3222] to-[#7a5c48]
Avatar: border-[3px] border-white/30, shadow-xl
Decorative circles: w-40 h-40 bg-white/5, positioned absolute
Stats card: mx-4 -mt-6 z-10, rounded-2xl, shadow-lg, grid-cols-3 divide-x
```

### Stats Cards (dentro del banner)
Cada stat: icono en cuadro coloreado + número grande + label pequeño
- Retos: bg-emerald-50 border-emerald-100
- Insignias: bg-amber-50 border-amber-100
- Promedio/otro: bg-sky-50 border-sky-100

### Progress Ring SVG
```jsx
const CIRCUMFERENCE = 2 * Math.PI * 40
const dashOffset = CIRCUMFERENCE - (porcentaje / 100) * CIRCUMFERENCE

<svg viewBox="0 0 100 100" className="-rotate-90 w-20 h-20">
  <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="10" />
  <circle cx="50" cy="50" r="40" fill="none" stroke="#fbbf24" strokeWidth="10"
    strokeDasharray={CIRCUMFERENCE}
    strokeDashoffset={dashOffset}
    strokeLinecap="round"
    style={{ transition: 'stroke-dashoffset 0.8s ease' }}
  />
</svg>
// Texto posicionado absolute sobre el SVG (no dentro — no hereda rotate)
```

### Podio Ranking (mobile-first)
```jsx
// Mobile: 1ro full-width arriba, 2do y 3ro side-by-side abajo
// Desktop: flex row con orden 2do-1ro-3ro
<div className="grid grid-cols-2 sm:flex sm:justify-center gap-3">
  <div className="order-2 sm:order-1 sm:w-52"> {/* 2do */ } </div>
  <div className="col-span-2 order-1 sm:order-2 sm:w-64"> {/* 1ro */ } </div>
  <div className="order-3 sm:w-52"> {/* 3ro */ } </div>
</div>
```

### Progress Bar (ranking)
Calcular porcentaje real: `(misPoints / rivalPoints) * 100`, clamped a 99%.
Nunca hardcodear `width: 0%`.

### Tabs (AyudaEstudiante)
Pills con scroll horizontal, no tabs de bloque:
```jsx
<div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
  {/* Active: bg-[#6b4c3a] text-white shadow-md */}
  {/* Inactive: bg-white border border-[#e8dcca] text-[#6b4c3a] */}
</div>
```

### Accordion FAQ (details/summary)
```jsx
<details className="bg-white rounded-xl border border-[#e8dcca] group overflow-hidden">
  <summary className="px-4 py-3 ... flex items-center justify-between select-none">
    <span>{pregunta}</span>
    <span className="group-open:rotate-180 transition-transform duration-200">▼</span>
  </summary>
  <div className="px-4 pb-3 text-xs border-t border-[#f5efe6] pt-2.5">
    {respuesta}
  </div>
</details>
```

### Insignia Badge Card
```
bg-gradient-to-b from-amber-50 to-[#faf7f3]
border border-amber-100
hover: border-amber-300 + shadow-md
Imagen: w-16 h-16, drop-shadow, group-hover:scale-110
Check badge: w-5 h-5 bg-emerald-500, absolute -top-1 -right-1
Fecha: text-[9px] bg-emerald-50 rounded-full px-2 inline-block
```

### Info Field (perfil)
```jsx
<div className="bg-[#faf7f3] rounded-xl p-3 border border-[#e8dcca]">
  <p className="text-[10px] font-bold text-[#a68a64] uppercase tracking-widest mb-0.5">🏫 Label</p>
  <p className="text-sm font-medium text-[#4a3222]">{value}</p>
</div>
```

---

## Dark / Gradient Headers

Para headers de sección (header de tarjeta, banner hero):
```
bg-gradient-to-r from-[#f5efe6] to-white   (sutil, para sub-headers)
bg-gradient-to-br from-[#2c1810] via-[#4a3222] to-[#7a5c48]  (hero banners)
```

Decoración en banners: `absolute` circles `bg-white/5`, ícono ☕ en `opacity-[0.06]`.

---

## What NOT to Do

- No `min-h-screen` en componentes que van dentro de un layout (causa doble scroll)
- No hardcodear `width: 0%` en progress bars — calcular siempre el porcentaje real
- No mezclar estrategias de profundidad (sombra dramática + borde fuerte = ruido)
- No tabs de bloque rectangulares — usar pills
- No tres stats idénticas sin diferenciación visual
- No `id="file-input"` en componentes reutilizables — usar `useRef`
