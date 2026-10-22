# Reading-page illustrations

Each of the 30 classic adaptations has eight separately illustrated reading pages, stored as `<tale-id>/01.webp` through `08.webp`. Scene order follows the English and Korean prose in `lib/forest/adventures.ts` and `lib/forest/classic-expansion.ts`.

These are original AI-generated watercolor and engraving style illustrations created during development on 2026-10-22. Each story was generated as one four-column, two-row sequence to keep characters and visual style consistent, then extracted into eight optimized local WebP assets. They are not reproductions of a publisher's edition, and the vocabulary photographs' CC0 credits do not apply to this artwork.

The reader displays the complete illustration using `object-fit: contain`, without cropping faces or important story action. Images change with the current reading page; existing titles, narration, translations, bookmarks and rewards continue to use the same story data and IDs. The home story preview uses this artwork too.

The website serves static files and makes no runtime image-generation API calls.
