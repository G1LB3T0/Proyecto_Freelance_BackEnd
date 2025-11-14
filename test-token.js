// Script de prueba para verificar el token JWT y user_type
// Ejecutar con: node test-token.js

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'tu_clave_secreta_super_segura';

// Pega tu token aquí (del localStorage del navegador)
const token = 'TU_TOKEN_AQUI';

try {
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('✅ Token decodificado correctamente:');
    console.log(JSON.stringify(decoded, null, 2));
    console.log('\n📝 User Type:', decoded.user_type || 'NO DEFINIDO');
    console.log('📝 User Type (lowercase):', (decoded.user_type || '').toLowerCase());
} catch (error) {
    console.error('❌ Error al decodificar token:', error.message);
    console.log('\n💡 Tip: Asegúrate de copiar el token completo del localStorage');
}

// Prueba de normalización
const testUserTypes = ['client', 'project_manager', 'emprendedor', 'freelancer', 'admin'];
console.log('\n🧪 User types permitidos para clientOnly:');
console.log(testUserTypes.map(t => t.toLowerCase()));
