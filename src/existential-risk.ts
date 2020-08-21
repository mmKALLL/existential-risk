const ctx = (document.getElementById(
  'gameCanvas'
) as HTMLCanvasElement).getContext('2d') as CanvasRenderingContext2D

ctx.beginPath()
ctx.rect(20, 20, 150, 100)
ctx.stroke()
