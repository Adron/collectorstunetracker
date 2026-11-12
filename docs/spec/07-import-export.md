# 07 — Import & Export

> Status: **Draft v0.2** · 2026-11-12 · Principle: **your collection is yours.** Getting a collection into CTT should
> take minutes, and getting it out should be one click, in formats other tools can read.

## 1. Is there a standard format?

**No official standard exists** for music-collection data. What exists in practice:

| Format | What it is | Role in CTT |
|---|---|---|
| **Discogs collection CSV** | The de facto interchange format. Most serious collectors have a Discogs account, and many other tools import it. Columns, in order: `Catalog#`, `Artist`, `Title`, `Label`, `Format`, `Rating`, `Released`, `release_id`, `CollectionFolder`, `Date Added`, `Collection Media Condition`, `Collection Sleeve Condition`, `Collection Notes`. Grades use Goldmine-style values. | **Import and export.** CTT writes this exact column set so a CTT export can be re-imported into Discogs or any tool that reads it. |
| **schema.org `MusicRelease` / `MusicAlbum` (JSON-LD)** | The open web vocabulary for music: `catalogNumber`, `recordLabel`, `musicReleaseFormat` (`VinylFormat`, `CDFormat`, `CassetteFormat`, `DigitalFormat`, `DVDFormat`, `LaserDiscFormat`, `DigitalAudioTapeFormat`), `releaseOf`, `byArtist`, `datePublished`, `gtin` (barcode). | **Export**, and embedded in public pages, so search engines and other tools understand them. |
| **MusicBrainz IDs (MBIDs)** | Stable open identifiers for releases, release groups, artists, and labels. MusicBrainz collections are lists of release MBIDs. | **Import** a MusicBrainz collection by ID. Every export includes MBIDs wherever CTT knows them, which makes exports far more portable than titles alone. |
| **CLZ Music** (Collectorz) CSV/XML, **MusicBuddy** CSV, spreadsheets | Popular collector apps with their own exports | **Import** via saved column-mapping templates |
| **CTT JSON** (`ctt-export/1`) | CTT's own lossless format | **Import and export**: full round trip, including groups, visibility, conditions history, and images |

## 2. Exports

From **Settings → Export**, from any collection or group ("Export this…"), or from the public API later.

| Export | Contents | Use it for |
|---|---|---|
| **Full archive** (`.zip`) | `collection.json` (CTT JSON), `discogs.csv`, `items.csv`, `collection.jsonld`, and an `images/` folder with the originals named `{item-id}/{type}-{n}.jpg`, plus `README.txt` | Backups, leaving CTT, or moving everything |
| **CTT JSON** | Everything: profile, collections, nested groups, items, all attributes, condition history, provenance (private fields included; it's your own data), valuations, loans, plays, crates, wants, listings, and an image manifest with download URLs | Lossless backup and re-import |
| **Discogs CSV** | The exact 13 Discogs columns. `CollectionFolder` = group path. Items without a Discogs `release_id` still export (Discogs ignores what it can't match). | Moving to or syncing with Discogs and tools that read Discogs CSV |
| **Full CSV** | One row per item with every field flattened (format attributes as `attr.rpm`, `attr.color`, …) | Spreadsheets and insurance inventories |
| **JSON-LD** | schema.org `ItemList` of `MusicRelease` objects | Interop and the open web |
| **Insurance PDF** (later) | Itemized list with photos, grades, and values | Insurance claims |

Rules:
- Exports run as background jobs. Small exports (under ~2,000 items, no images) download right away. Larger ones
  build in the background, are stored in **private** Blob storage, and are sent as a signed link that expires
  after 7 days; the file is then deleted.
- Exporting a **public** shelf (someone else's) gives only public fields, in JSON-LD or CSV, and only if the owner allows it.
- `ctt-export/1` is versioned. A JSON Schema is published at `/schemas/ctt-export-1.json`, and CTT can always
  import any older version it has ever exported.

### 2.1 CTT JSON shape (abridged)

```json
{
  "format": "ctt-export/1",
  "exported_at": "2026-11-12T18:00:00Z",
  "collector": { "handle": "crate-digger", "display_name": "…", "profile_visibility": "private" },
  "collections": [{
    "id": "col_…", "name": "Main Shelf", "visibility": "public",
    "groups": [{ "id": "grp_…", "name": "Blue Note 1500s", "visibility": "inherit", "groups": [] }],
    "items": [{
      "id": "itm_…", "group_id": "grp_…", "visibility": "inherit",
      "kind": "media", "format": "vinyl_lp", "title": "Kind of Blue", "artist": "Miles Davis",
      "ids": { "mbid": "…", "discogs_release_id": 123, "barcode": null },
      "pressing": { "label": "Columbia", "catalog_number": "CL 1355", "country": "US", "year": 1959,
                    "matrix": { "A": "XLP 47324-1A", "B": "XLP 47325-1A" } },
      "attributes": { "rpm": 33, "weight_g": 150, "color": "black" },
      "condition": [{ "part": "media", "grade": "VG+", "graded_at": "2026-01-02" },
                    { "part": "sleeve", "grade": "VG" }],
      "acquired": { "on": "2019-05-04", "from": "Amoeba", "price": 40.00, "currency": "USD" },
      "notes": { "public": "Plays great.", "private": "Ask Sam about the inner sleeve." },
      "images": [{ "type": "front_cover", "file": "images/itm_…/front_cover-1.jpg" }]
    }]
  }],
  "crates": [], "wants": [], "listings": []
}
```

## 3. Imports

**Import wizard:** choose a source → upload or connect → map columns (for CSVs) → choose the destination
collection and group → **dry run** preview → import → review the results.

| Source | How | Notes |
|---|---|---|
| **Discogs CSV** | Upload the file from Discogs' *Export collection* | `CollectionFolder` → group (created if missing); conditions → Goldmine grades; `release_id` → Discogs ID, then matched to MusicBrainz when possible |
| **Discogs account** | Connect with Discogs OAuth, then pull the collection and folders over the API | Rate-limited by Discogs, so it runs in the background; can re-sync. Follow Discogs API terms: attribute data, don't bulk-copy images. |
| **CLZ Music / MusicBuddy** | Upload their CSV export; a built-in mapping template is preselected | Templates are versioned, since those apps change their columns |
| **Any CSV / spreadsheet** | Upload, then map columns in the wizard; mappings can be saved as personal templates | Unknown columns go to `attributes` or notes |
| **MusicBrainz collection** | Paste a collection URL or ID | Release MBIDs → catalog releases |
| **CTT JSON / full archive** | Upload `collection.json` or the `.zip` | Lossless; images are re-uploaded from the archive |
| **Barcode list** | Paste or scan a list of barcodes | Quick start for CD collections |

### 3.1 Matching & de-duplication

1. **Exact IDs first:** MBID → Discogs `release_id` → barcode (GTIN) → catalog number + label.
2. **Fuzzy fallback:** artist + title + format + year (trigram similarity), marked *needs review*.
3. Each row ends up `matched`, `ambiguous` (the user picks from candidates), `unmatched` (kept as a free-form item, which is
   never lost), or `error` (with a reason).
4. **Duplicates:** if an item with the same identifiers already exists in the destination, the user chooses per import
   whether to skip it, add a second copy (collectors do own duplicates), or update the existing one.
5. Imported items get `visibility: inherit`, so nothing becomes public by importing.

### 3.2 Mechanics (Vercel build)

- The file is uploaded straight from the browser to **private Blob storage** (Vercel Blob client upload; no size limit
  from the function).
- An `import_job` row and its `import_row` rows track progress. A background worker processes rows in batches of about
  200, kicked off right away after upload and continued by a Vercel Cron job every minute until done. It's resumable,
  and the progress bar reads from the job row.
- External lookups go through `lookup_cache` and respect rate limits: about 1 request per second for MusicBrainz, and
  Discogs' limits for authenticated calls.
- Re-running the same import file is idempotent: rows are keyed on `(job source hash, row number)`.

## 4. Acceptance checks

- Round trip: export to CTT JSON → import into an empty account → byte-identical data (except new IDs) and the same images.
- Discogs round trip: export Discogs CSV → re-import → no duplicates, conditions preserved.
- A 10,000-row Discogs CSV imports without timeouts and can be resumed after a failure.
- No import ever makes an item public.
