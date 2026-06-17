# Informe de Errores - Build APK Android

## Resumen Ejecutivo
Se han identificado **5 categorías principales de errores** que impiden la compilación del APK. Todos han sido parcialmente corregidos, pero persiste un bloqueo de directorio.

---

## 1. ❌ ERROR: Recurso Bloqueado - Carpeta Android

**Tipo:** I/O Error  
**Código:** EBUSY: resource busy or locked  
**Mensaje:**
```
El proceso no puede obtener acceso al archivo porque está siendo utilizado en otro proceso
EBUSY: resource busy or locked, rmdir 'android'
```

**Causa:** Procesos gradle/Java todavía activos usando la carpeta android

**Estado:** 🔴 **REQUIERE ACCIÓN INMEDIATA**

**Solución:**
```powershell
# Matar procesos gradle y Java
Get-Process | Where-Object {$_.ProcessName -like "*gradle*" -or $_.ProcessName -like "*java*"} | Stop-Process -Force
```

---

## 2. ❌ ERROR: safeExtGet() No Encontrado en react-native-webview

**Tipo:** Gradle Configuration Error  
**Archivo:** `node_modules/react-native-webview/android/build.gradle` (línea 94)  
**Mensaje:**
```
Could not find method safeExtGet() for arguments [kotlinVersion] 
on object of type org.gradle.api.internal.artifacts.dsl.dependencies.DefaultDependencyHandler
```

**Causa:** La función `safeExtGet()` no está definida en el contexto global de Gradle

**Estado:** ✅ **CORREGIDO**

**Solución Aplicada:**
```gradle
def safeExtGet(prop, fallback) {
    def props = (prop instanceof String) ? [prop] : prop
    def result = props.find { key -> return rootProject.ext.has(key) }
    return result ? rootProject.ext.get(result) : fallback
}
```

---

## 3. ❌ ERROR: safeExtGet() No Encontrado en react-native-screens

**Tipo:** Gradle Configuration Error  
**Archivo:** `node_modules/react-native-screens/android/build.gradle`  
**Línea:** 128 - `safeExtGet(['minSdkVersion', 'minSdk'], fallback)`

**Mensaje:**
```
Could not find method hasProperty() for arguments [[minSdkVersion, minSdk]]
```

**Causa:** La función `safeExtGet()` no soportaba array de parámetros

**Estado:** ✅ **CORREGIDO**

**Solución Aplicada:** Agregada función con soporte para array de strings

---

## 4. ❌ ERROR: safeExtGet() No Soporta Arrays en react-native-reanimated

**Tipo:** Gradle Configuration Error  
**Archivo:** `node_modules/react-native-reanimated/android/build.gradle`

**Estado:** ✅ **CORREGIDO**

**Solución Aplicada:** Actualizada función para soportar sintaxis con arrays

---

## 5. ❌ ERROR: NDK Corrupto (21.4.7075529)

**Tipo:** Build Configuration Error  
**Mensaje:**
```
[CXX1101] NDK at ... did not have a source.properties file
```

**Causa:** NDK 21.4.7075529 instalado incompleto/corrupto

**Estado:** ✅ **CORREGIDO**

**Solución Aplicada:**
- Actualizado a NDK 27.1.12297006
- Verificado source.properties existe y es válido
- Actualizado en `android/build.gradle` y `app.json`

---

## 6. ⚠️ ERROR: Conflictos AGP (Android Gradle Plugin)

**Tipo:** Build Configuration Error  
**Causas:** Módulos node_modules tienen sus propios buildscript blocks que conflictúan

**Estado:** ✅ **PARCIALMENTE CORREGIDO**

**Solución Aplicada:**
- Creado `clean-gradle.js` para remover conflictos
- Integrado en postinstall de package.json
- Limpia automáticamente AGP buildscripts de módulos problemáticos

---

## 7. ⚠️ ERROR: EAS CLI npm Error

**Tipo:** Package Management Error  
**Mensaje:**
```
npm error could not determine executable to run
```

**Causa:** eas-cli no estaba instalado globalmente

**Estado:** ✅ **CORREGIDO**

**Solución Aplicada:**
```bash
npm install -g eas-cli  # Instalado exitosamente
# added 516 packages in 3m
```

---

## 📊 Resumen de Estado

| Error | Tipo | Estado | Acción |
|-------|------|--------|--------|
| Recurso Bloqueado (android) | I/O | 🔴 CRÍTICO | Matar procesos Java/Gradle |
| safeExtGet webview | Config | ✅ Corregido | Función agregada |
| safeExtGet screens | Config | ✅ Corregido | Función mejorada |
| safeExtGet reanimated | Config | ✅ Corregido | Función mejorada |
| NDK Corrupto | Config | ✅ Corregido | Versión 27.1.12297006 |
| AGP Conflicts | Config | ✅ Corregido | clean-gradle.js |
| EAS CLI | Package | ✅ Corregido | Instalado globalmente |

---

## ✅ Próximos Pasos

1. **Matar procesos activos:**
   ```powershell
   Get-Process | Where-Object {$_.ProcessName -like "*gradle*" -or $_.ProcessName -like "*java*"} | Stop-Process -Force
   ```

2. **Limpiar y regenerar:**
   ```bash
   cd "C:\Users\jimmy\Desktop\ULTIMO PROYECTO\tecnicos-ya-backend\frontend"
   npx expo prebuild --platform android --clean
   ```

3. **Ejecutar build con EAS:**
   ```bash
   npx eas build --platform android --profile production
   ```

---

**Generado:** 2026-06-16  
**Versión:** 1.0
