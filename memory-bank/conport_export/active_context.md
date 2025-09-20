# Active Context

## PrimaryFocus
* Validate Step 7 map transitions between Slums and Downtown and ensure Phaser redraws enemy sprites correctly.
* Align ConPort data ingestion with the new markdown exports so agents can query current decisions and progress.

## InFlightTasks
* Document ConPort usage in `PORTAL.md` and retire references to the legacy Node-based portal build.
* Keep Step 8 (day/night cycle) scoped as the next major feature once context migration is stable.

## Risks
* ConPort imports rely on `sentence-transformers` downloads; ensure CI/dev boxes have network access or cached models.
* Redux state still mutates shared area templates in `worldMap.ts`; future refactor should deep-clone to avoid duplicate enemy spawns.

## OpenQuestions
* Determine whether to auto-sync memory-bank docs into ConPort as part of CI or leave as manual `uvx` invocation.
* Decide how much of the large design/backstory docs should be summarized into product context versus stored as custom data blobs.

