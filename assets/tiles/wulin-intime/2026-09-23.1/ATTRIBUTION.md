# Wulin Intime bounded Overture tiles

© OpenStreetMap contributors, Overture Maps Foundation.
Data: Open Database License (ODbL)1.0: https://opendatacommons.org/licenses/odbl/1-0/ . Source and derivative data are offered under ODbL1.0. Attribution guidance: https://docs.overturemaps.org/attribution/ . OSM copyright: https://www.openstreetmap.org/copyright .

Source: official Overture GeoParquet, release2026-09-23.1, accessed2026-11-03. `s3://overturemaps-us-west-2/release/2026-09-23.1/theme={buildings,transportation,base}/type={building,segment,water,land_use}/`. The official overturemaps0.18.0 Python client performed bounding-box filtered reads directly from this source. No Explorer PMTiles were downloaded, extracted, copied or repackaged to generate these archives.

WGS84 bbox:120.139,30.251,120.180,30.292. See manifest.json for exact source counts, bounds, versions and SHA256. Original bounded source GeoJSON files are provided in source/ alongside the generated archives. Our generation clips geometry to the bbox, projects to Web Mercator, clips to each tile and quantizes to4096 units at zoom12–17. IDs and selected source properties retained. No missing heights inferred: only2 source buildings in this extent have positive heights. Remaining footprints are flat.

The source data may contain geometry and identification errors. Public mall marker is separately derived from Amap public POI and is approximate, not a surveyed boundary. The source and tile generation do not establish client credentials, operating scope, footfall or any KYWOO business outcome.

Build and verification scripts are in scripts/extract-overture.py, scripts/build-local-tiles.py and scripts/validate-local-tiles.py. These data files can be independently served with HTTP byte Range support; no Overture Explorer service is required.
