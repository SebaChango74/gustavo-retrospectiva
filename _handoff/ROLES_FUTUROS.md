# Roles — estructura futura (pendiente de implementar)

> Anotado durante la etapa de prueba. Reemplaza al esquema de roles actual
> cuando se decida avanzar. Por ahora, los invitados son **watchers** (solo miran).

## Roles definidos por el usuario

1. **Admin builder** (el usuario / conducción técnica)
   - Acceso a todo: diseño, estructura, concepto, contenido, miembros, configuración.
   - Es el único que decide sobre el sistema.

2. **Admin manager** (control editorial)
   - NO puede decidir sobre diseño, estructura ni concepto.
   - Solo **aprueba** contenido y **controla a los editores**.
   - No toca la configuración ni la arquitectura.

3. **Editores**
   - Cargan y editan contenido (noticias, causas, agenda, Perón 365, etc.).
   - Su contenido queda pendiente y **debe aprobarlo un admin** antes de publicarse
     (flujo de aprobación: borrador → en revisión → aprobado/publicado).

## Estado actual (prueba)

- Todos los invitados son **watchers**: recorren y miran, sin cuentas reales.
- El esquema técnico vigente hoy es: admin / editor / moderador / referente / member.
- Falta implementar: el flujo de aprobación de contenido (editor propone → admin
  aprueba) y la distinción "admin builder" vs "admin manager".
