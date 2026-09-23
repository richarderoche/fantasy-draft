# Generating a season cast JSON

Use this when a new Survivor cast is announced and you want a file like `survivor-51-cast.json`.

## Prompt template

Copy, fill in the season number and URL, and send:

```
Use this page to create a JSON file with a "cast" array of player objects.
Each player should have: name, age, place, occupation, words, bio.

- place: hometown and current residence as one string; if they differ, use
  "Hometown / Current Residence" (slash separated). If same, use one location.
- words: their three "words to describe you" from the article, as a single
  comma-separated string (lowercase is fine).
- bio: about 3 sentences summarizing key points from the remaining interview
  answers. Focus on facts useful for fantasy drafting (background, comp style
  comparisons they cite, alliance preferences, family/motivation, hobbies,
  notable stories). Do not include analysis or predictions (no "strong jury
  threat", "could flame out", etc.).

In name fields and bio text, use curly quotes for nicknames and quoted phrases
(e.g. Angelica "Jelly" Loblack, "Survivor Clause") — not straight " quotes
inside content.

Do not save images; text only.

Source: [PASTE EW OR CBS CAST REVEAL URL HERE]

Save as survivor-XX-cast.json in this project (replace XX with season number).
```

## Example source

Entertainment Weekly cast-reveal articles usually include full pregame questionnaires (age, hometown, occupation, three words, and Q&A). That is the preferred source when available.

If the page is paywalled, ask the agent to use the browser to read the article or an official CBS/Paramount press release for basics—but bios should still come from the full EW-style interviews when possible.

## Expected JSON shape

```json
{
  "cast": [
    {
      "name": "First Last",
      "age": 30,
      "place": "Hometown, State / Current City, State",
      "occupation": "Job title from article",
      "words": "word one, word two, word three",
      "bio": "Three factual sentences from the interviews..."
    }
  ]
}
```

## Review checklist

After generation, spot-check:

- [ ] 18–24 players (or whatever count the season announces)
- [ ] No straight double quotes inside `name` or `bio` strings (use “ ”)
- [ ] Bios end with details, not analyst hot takes
- [ ] `place` only uses `/` when hometown ≠ current residence
- [ ] Valid JSON (no trailing commas)

## Follow-up prompts

- **Tone pass:** “Replace analysis in bios with more interview details, like we did for season 51.”
- **Quotes pass:** “Use curly quotes for nicknames and quoted content throughout the JSON.”
- **Single field:** “Expand Jenna Doore’s bio with more from her EW answers.”

## Cast images (optional)

After the JSON exists, ask the agent to fetch images and add `headshot` and `photo`
filename fields to each player:

```
For survivor-XX-cast.json, download images for every player:

- public/headshots/: 90×90 PNG from the season page on survivor.fandom.com/wiki/Survivor_XX
  (each S51_*_t.png URL with &format=original appended; slug filenames like first-last.png)
- public/photos/: largest EW cast photos from the EW reveal article (2000px lazy-load URLs;
  save as .webp; slug filenames like first-last.webp)

Add "headshot" and "photo" properties to each player (filename only). Use parallel
downloads for Fandom (CDN can be slow). Re-run scripts/fetch-s51-images.py as a template
for season 51.
```

Folder layout:

```text
public/headshots/aaliyah-puglia.png
public/photos/aaliyah-puglia.webp
survivor-51-cast.json   →  "headshot": "aaliyah-puglia.png", "photo": "aaliyah-puglia.webp"
```
