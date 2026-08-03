# Método: habilitar un año nuevo en la línea de tiempo

Guía para sumar un capítulo (ej.: **2018**) a la línea de tiempo de
`gustavobarrera.com`. Escrita después de hacer 2016 y 2017. Seguí los pasos en
orden; al final está el checklist rápido.

---

## 0. Estado actual (a agosto 2026)

- **Activos:** 2014, 2015, 2016 (10 hitos), 2017 (9 hitos).
- El resto de los años existen como *placeholders* bloqueados en `yearsData`.
- La web es el `index.html` de la raíz del repo (estático), servido por
  `peronismogeselino/server` y desplegado por Railway al hacer **push a `main`**
  (auto-deploy).

## 1. Cosechar los actos de gobierno del año

Las herramientas están en esta carpeta (`_handoff/linea-de-tiempo/`).

```bash
cd _handoff/linea-de-tiempo
python3 harvest.py 2018            # o: python3 harvest.py 2018 1550 1850
```

Genera `actos_2018.tsv` con: `año, fecha, id, titulo, url`.

> **El bug que costó caro:** en el listado, el `<h2>` de una tarjeta queda pegado
> al link de la tarjeta vecina. Emparejar por cercanía da IDs equivocados (pedir
> "cloacas" devolvía una maratón). La fuente de verdad es el **slug de la URL**
> `/novedad/{id}/{slug}.html`: el slug **es** el título real de esa nota. El
> `harvest.py` ya itera sobre los links (no sobre los `<h2>`), así que el `id` y
> el `titulo` del TSV son correctos.

## 2. Curar de 8 a 12 hitos

Del TSV, elegí **lo que hace crecer a Gesell**: obras públicas, salud, seguridad,
ambiente, educación, vivienda, decisiones políticas y de gestión. Descartá ruido
(vencimientos, cortes de luz/agua, agenda de eventos, talleres, efemérides).

Regla acordada con Gustavo:
- **8 a 12 por año.**
- **Incluir siempre lo que ya estuviera** en el placeholder de ese año.
- Que cada hito **destaque algo relevante** de la gestión.

Anotá los IDs elegidos **en el orden** en que querés que aparezcan.

## 3. Redactar los textos

Para cada hito, en **primera persona (voz de Gustavo)**, como 2014-2017:
- `eje`: etiqueta corta del tema (ej.: "Salud", "Obras públicas", "Seguridad").
- `title`: título del hito.
- `card`: una bajada de una línea (se ve en la tarjeta).
- `desc`: 2-3 párrafos separados por `\n\n` (se ve en el modal "Ver más").

Guardá todo en un JSON de trabajo tipo `hitos_2018.json` con la misma forma que
usamos antes: `{ "2018": { tagline, eje, intro, hitos:[{eje,title,card,desc}] } }`.

**Gustavo revisa ANTES de subir.** El flujo pactado es:
1. Se arma una hoja de revisión (HTML) con textos + fotos.
2. Gustavo mira y confirma o marca cambios.
3. Recién ahí se sube y se habilita.
4. Gustavo arma el mensaje para redes.

## 4. Bajar las fotos

```bash
python3 fetch_fotos.py 2018 <id1> <id2> <id3> ...   # en el orden del paso 2
```

Baja a `fotos_2018/2018-01.jpg`, `2018-02.jpg`, ... Notas:
- Filtra los banners de la barra lateral automáticamente.
- Encodea espacios en los nombres de archivo.
- Si el original es **PNG**, avisa `PNG(convertir a jpg)`: transcodificalo a JPG
  (con el Chromium/Playwright del entorno, canvas → `toBlob("image/jpeg", 0.85)`).
- Verificá que el título de la nota sea el esperado:
  `curl -s "https://www.gesell.gob.ar/novedad/<ID>/x.html" | grep -i "<title>"`

Cuando estén revisadas, copialas a la carpeta pública:

```bash
cp fotos_2018/2018-*.jpg ../../fotos/timeline/
```

## 5. Editar `index.html`

Todo vive en el array `const yearsData = [...]` (una sola línea larga). Editalo
con un script Python (parsear → modificar → serializar), no a mano:

1. **Reemplazar el objeto del año** por el nuevo, con cada hito así:
   ```json
   { "eje":"Salud", "title":"...", "card":"...", "desc":"...",
     "images":["fotos/timeline/2018-01.jpg"] }
   ```
   (la tarjeta muestra `images[0]`; el modal muestra todas.)

2. **Desbloquear hasta el año nuevo.** Al final del `<script>`:
   `renderAll(N)` → subí `N` para incluir el año nuevo.
   `N` = cantidad de años activos contando desde 2014.
   (2014-2017 = 4. Sumar 2018 → `renderAll(5)`.)

3. **Capítulo activo por defecto** (arriba del mismo bloque):
   `let activeYear = 2018;` (el más nuevo desbloqueado).

4. **Textos de la barra de lanzamiento** (buscá `launch-text` y `locked-pill`):
   - "Ya están disponibles los capítulos ..." → agregá el año.
   - `2014 → 2018 activos · próximos capítulos bloqueados`.

Validá antes de commitear:
```bash
python3 -c "import re,json; h=open('index.html').read(); d=json.loads(re.search(r'const yearsData = (\[.*?\]);',h,re.S).group(1)); print([e['year'] for e in d]); print(len([x for e in d if e['year']==2018 for x in e['hitos']]),'hitos 2018')"
```

## 6. La CSP se arregla sola (no toques nada)

`index.html` usa 2 `<script>` en línea. La CSP estricta (`script-src 'self'`)
los bloquearía y la página quedaría **solo con el encabezado**. Para evitarlo,
`peronismogeselino/server/app.js` calcula el **hash SHA-256** de cada script al
arrancar y lo agrega a la CSP (función `hashesScriptsEnLinea`). Como cambiás el
contenido de un script al editar `yearsData`, **el hash se recalcula solo en el
próximo deploy**. No hace falta escribir hashes a mano ni habilitar
`'unsafe-inline'`.

## 7. Desplegar y verificar

```bash
git add index.html fotos/timeline/
git commit -m "Habilitar capítulo 2018 en la línea de tiempo"
git push origin main            # dispara el auto-deploy
```

Esperá el deploy (1-3 min) y verificá en vivo:

```bash
# el año nuevo ya aparece y desbloqueado
curl -s "https://gustavobarrera.com/?cb=$RANDOM" | grep -o "renderAll([0-9])"

# las fotos responden 200
for n in 01 02 03 04 05 06 07 08; do
  curl -s -o /dev/null -w "2018-$n=%{http_code}\n" "https://gustavobarrera.com/fotos/timeline/2018-$n.jpg"
done

# (opcional) los hashes de la CSP coinciden con los scripts del HTML vivo
```

### Gotchas de deploy

- **Cloudflare cachea el 404 de una foto nueva** si la pediste mientras aún
  desplegaba (cache 4 h). Solución: en `index.html`, agregá `?v=2` a la
  referencia de esa imagen (`fotos/timeline/2018-04.jpg?v=2`) y volvé a pushear;
  es una clave de caché nueva. (Pasó con la foto de móviles en 2017.)
- **No commitees** `peronismogeselino/data/backups/*.sqlite`: son respaldos que
  genera el servidor cuando lo arrancás para probar localmente. Borralos.
- El proxy del entorno resetea la conexión a `gustavobarrera.com` desde un
  navegador headless; para verificar en vivo usá `curl`, o probá el `index.html`
  contra un servidor local (`node peronismogeselino/server/index.js`).

---

## Checklist rápido

- [ ] `harvest.py <año>` → TSV de actos
- [ ] Curar 8-12 hitos (incluir los preexistentes), anotar IDs en orden
- [ ] Redactar textos en primera persona → `hitos_<año>.json`
- [ ] `fetch_fotos.py <año> <ids...>` → revisar → copiar a `fotos/timeline/`
- [ ] Hoja de revisión → **Gustavo confirma**
- [ ] Editar `yearsData`, `renderAll(N)`, `activeYear`, barra de lanzamiento
- [ ] Validar el JSON y que las fotos existan
- [ ] `git push origin main` → verificar en vivo (renderAll + fotos 200)
- [ ] Gustavo arma el mensaje para redes
