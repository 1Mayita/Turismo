// Evita que una llamada a Firestore se quede colgada para siempre: si no
// responde dentro del límite, la rechazamos para que el componente que la
// llamó caiga a su contenido de ejemplo en vez de esperar sin fin.
export function conLimiteDeTiempo(promesa, milisegundos = 10000) {
  return Promise.race([
    promesa,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Firestore no respondió a tiempo')), milisegundos)
    }),
  ])
}
