"""Bounded official GeoParquet extraction; no Explorer tile input."""
import json,sys
from pathlib import Path
from overturemaps import record_batch_reader
from overturemaps.cli import GeoJSONWriter,copy
kind=sys.argv[1]
out=Path('assets/tiles/wulin-intime/2026-09-23.1/source')
out.mkdir(parents=True,exist_ok=True)
reader=record_batch_reader(kind,bbox=(120.139,30.251,120.180,30.292),release='2026-09-23.1',connect_timeout=20,request_timeout=60,stac=True)
if reader is None: raise RuntimeError('Official GeoParquet extraction failed')
with GeoJSONWriter(str(out/(kind+'.geojson'))) as writer:copy(reader,writer)
p=out/(kind+'.geojson'); data=json.loads(p.read_text());print(kind,len(data['features']),p.stat().st_size,flush=True)
