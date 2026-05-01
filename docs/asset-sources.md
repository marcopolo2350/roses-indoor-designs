# Asset Sources

`data/asset-sources.json` is the source registry for catalog provenance. Every item in `data/asset-manifest.json` must carry both:

- `sourceId`: machine-readable key that matches the registry
- `source`: human-readable source label for audits and future UI/debug output

The validator is intentionally honest:

- `cleared` means the source has a documented license posture.
- `needs-review` means the asset is allowed to stay in the repo for now, but its provenance is not considered public-release clean.

Run:

```bash
npm run validate:asset-sources
```

Current source posture:

- `poly_haven`: cleared, CC0
- `kenney_furniture_kit`: cleared, CC0
- `rose_legacy_catalog`: needs review
- `temp_house_interior`: needs review
- `temp_furniture_pack`: needs review

Do not add new assets without adding a `sourceId` and updating the registry when needed.
