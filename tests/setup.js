// Configuración global para tests
import { beforeAll, afterAll } from 'vitest'
import dotenv from 'dotenv'

// Cargar variables de entorno para testing
dotenv.config({ path: '.env.test' })

// Configurar timeout global para tests
beforeAll(() => {
  // Configuraciones que se ejecutan antes de todos los tests
  console.log('🚀 Configurando entorno de testing...')
})

afterAll(() => {
  // Limpieza después de todos los tests
  console.log('🧹 Limpiando entorno de testing...')
}) 