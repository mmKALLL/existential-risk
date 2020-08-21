const ctx = (document.getElementById(
  'gameCanvas'
) as HTMLCanvasElement).getContext('2d') as CanvasRenderingContext2D

ctx.beginPath()
ctx.rect(20, 20, 150, 100)
ctx.stroke()

let i = 0
const interval = setInterval(() => {
  for (let x = i; x < 1400; x += 5) {
    for (let y = i; y < 900; y += 5) {
      ctx.beginPath()
      ctx.strokeStyle = `rgb(
        0,
        ${Math.floor(255 - x / 5)},
        ${Math.floor(255 - x / 4)})`
      ctx.arc(x, y, 3, 0, 2 * Math.PI)
      ctx.stroke()
    }
  }
  i++
  i === 8 && clearInterval(interval)
}, 200)
