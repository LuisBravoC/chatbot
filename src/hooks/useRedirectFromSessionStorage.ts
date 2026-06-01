import { useEffect } from 'react'

export default function useRedirectFromSessionStorage() {
  useEffect(() => {
    // Limpiar sessionStorage en caso de que GitHub Pages haya almacenado algo
    // (El 404.html maneja la redirección automáticamente)
    if (sessionStorage.redirect) {
      delete sessionStorage.redirect
    }
  }, [])
}
