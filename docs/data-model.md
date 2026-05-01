# Data Model

## Project document

Project JSON exports now include:

- `schemaVersion`
- `appVersion`
- `exportedAt`
- `activeProfile`
- `projects`

## Room record

Important room fields in the current runtime:

- `id`
- `projectId`
- `projectName`
- `name`
- `polygon`
- `walls`
- `openings`
- `structures`
- `furniture`
- `dimensionAnnotations`
- `textAnnotations`
- `materials`
- `floorId`
- `floorLabel`
- `floorOrder`
- `roomOrder`
- `baseRoomId`
- `optionName`
- `optionNotes`
- `createdAt`
- `updatedAt`

Imported room records must include a polygon with at least three finite `{ x, y }` points. Optional collection fields such as `furniture`, `openings`, and annotation arrays must be arrays when present. User-facing room and furniture text fields must be strings, stay within length caps, and cannot contain control characters.

## Current caveat

The runtime still carries room-centric project state, so project and room boundaries are improving but not fully normalized yet.
