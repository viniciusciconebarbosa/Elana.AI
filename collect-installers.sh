#!/bin/bash
# Script automatizado para coletar e organizar os instaladores da Elana AI

set -e

PROJECT_ROOT="/home/vinicius/Desktop/ekko"
TARGET_DIR="$PROJECT_ROOT/instaladores"

cd "$PROJECT_ROOT"

# Extrai a versão dinamicamente do package.json (linha 4)
VERSION=$(grep -m1 '"version":' package.json | sed -E 's/.*"version":\s*"(.*)".*/\1/')

if [ -z "$VERSION" ]; then
  echo "❌ Erro: Não foi possível determinar a versão no package.json"
  exit 1
fi

echo "🚀 Elana AI - Coletor de Instaladores v$VERSION"
echo "----------------------------------------"

# Cria a pasta de instaladores se não existir
mkdir -p "$TARGET_DIR"

# Caminhos de origem dos arquivos
DEB_SRC="$PROJECT_ROOT/src-tauri/target/release/bundle/deb/elana_${VERSION}_amd64.deb"
RPM_SRC="$PROJECT_ROOT/src-tauri/target/release/bundle/rpm/elana-${VERSION}-1.x86_64.rpm"
APPIMAGE_SRC="$PROJECT_ROOT/src-tauri/target/release/bundle/appimage/elana_${VERSION}_amd64.AppImage"
APK_SRC="$PROJECT_ROOT/src-tauri/gen/android/app/build/outputs/apk/universal/release/app-universal-release.apk"

# 1. Copiar Linux DEB
if [ -f "$DEB_SRC" ]; then
  cp "$DEB_SRC" "$TARGET_DIR/"
  echo "✓ Copiado Linux DEB: elana_${VERSION}_amd64.deb"
else
  echo "⚠️ Aviso: Instalador DEB não encontrado em $DEB_SRC"
fi

# 2. Copiar Linux RPM
if [ -f "$RPM_SRC" ]; then
  cp "$RPM_SRC" "$TARGET_DIR/"
  echo "✓ Copiado Linux RPM: elana-${VERSION}-1.x86_64.rpm"
else
  echo "⚠️ Aviso: Instalador RPM não encontrado em $RPM_SRC"
fi

# 3. Copiar Linux AppImage
if [ -f "$APPIMAGE_SRC" ]; then
  cp "$APPIMAGE_SRC" "$TARGET_DIR/"
  echo "✓ Copiado Linux AppImage: elana_${VERSION}_amd64.AppImage"
else
  echo "⚠️ Aviso: Instalador AppImage não encontrado em $APPIMAGE_SRC"
fi

# 4. Copiar e Renomear Android APK
if [ -f "$APK_SRC" ]; then
  cp "$APK_SRC" "$TARGET_DIR/elana-${VERSION}.apk"
  echo "✓ Copiado e Renomeado Android APK: elana-${VERSION}.apk"
else
  echo "⚠️ Aviso: APK do Android não encontrado em $APK_SRC"
fi

echo "----------------------------------------"
echo "🎉 Coleta concluída com sucesso absoluto!"
echo "Todos os instaladores estão prontos em: $TARGET_DIR/"
echo ""
ls -lh "$TARGET_DIR"
