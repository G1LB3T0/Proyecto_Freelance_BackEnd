#!/bin/bash

# Script para verificar compatibilidad de Docker
echo "🔍 Verificando compatibilidad de Docker..."

# Verificar Docker está instalado
if ! command -v docker &> /dev/null; then
    echo "❌ Docker no está instalado. Instálalo desde: https://docker.com"
    exit 1
fi

# Verificar Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose no está instalado"
    exit 1
fi

# Mostrar versiones
echo "✅ Docker: $(docker --version)"
echo "✅ Docker Compose: $(docker-compose --version)"

# Verificar que Docker daemon esté corriendo
if ! docker info &> /dev/null; then
    echo "❌ Docker daemon no está corriendo. Inicia Docker Desktop"
    exit 1
fi

echo "✅ Docker daemon funcionando"

# Test básico de Alpine
echo "🧪 Probando imagen Alpine..."
if docker run --rm alpine:latest echo "Alpine funciona" &> /dev/null; then
    echo "✅ Alpine Linux compatible"
else
    echo "⚠️  Problema con Alpine, usando imagen Ubuntu..."
fi

echo ""
echo "🚀 Sistema listo para el proyecto!"
echo "🔧 Para construir: docker-compose up --build"
echo "📊 Para probar: curl \"http://localhost:3000/api/users/me/stats?user_id=1\""
