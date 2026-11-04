"""Build original bounded MVT/PMTiles from official GeoParquet-derived GeoJSON."""
import json,math,gzip,hashlib
from pathlib import Path
import numpy as np
import mercantile,mapbox_vector_tile
from shapely.geometry import shape,box,mapping
from shapely.ops import transform
from shapely.strtree import STRtree
from pmtiles.writer import Writer
from pmtiles.tile import Compression,TileType,zxy_to_tileid
ROOT=Path('assets/tiles/wulin-intime/2026-09-23.1')
BBOX=(120.139,30.251,120.180,30.292)
R=6378137
clipbox=box(*BBOX)
def project(x,y,z=None): return (R*np.radians(x),R*np.log(np.tan(np.pi/4+np.radians(y)/2)))
manifest={'release':'2026-09-23.1','bbox':BBOX,'source':'Official Overture GeoParquet via overturemaps Python client; not Explorer PMTiles','license':'ODbL-1.0','attribution':'© OpenStreetMap contributors, Overture Maps Foundation','sourceRoot':'s3://overturemaps-us-west-2/release/2026-09-23.1/','minzoom':12,'maxzoom':17,'themes':{}}
for archive,types in [('buildings',['building']),('transportation',['segment']),('base',['water','land_use'])]:
 layers={};counts={}
 for typ in types:
  raw=json.loads((ROOT/'source'/f'{typ}.geojson').read_text())['features'];items=[]
  for f in raw:
   g=shape(f['geometry'])
   if not g.is_valid:g=g.buffer(0)
   g=g.intersection(clipbox)
   if g.is_empty:continue
   p=f['properties']; props={k:p[k] for k in ['id','height','class','subtype','is_underground'] if isinstance(p.get(k),(str,float,int,bool))}
   if p.get('names') and p['names'].get('primary'): props['name']=p['names']['primary']
   items.append((transform(project,g),props))
  geoms=[x[0] for x in items];layers[typ]=(items,STRtree(geoms));counts[typ]=len(items)
 tileentries=[]
 for tile in mercantile.tiles(*BBOX,zooms=range(12,18)):
  bounds=mercantile.xy_bounds(tile);envelope=box(bounds.left,bounds.bottom,bounds.right,bounds.top);mvtlayers=[]
  for typ,(items,index) in layers.items():
   feats=[]
   for idx in index.query(envelope):
    g,props=items[int(idx)];g=g.intersection(envelope)
    if not g.is_empty and g.geom_type!='GeometryCollection':feats.append({'geometry':mapping(g),'properties':props})
   if feats:mvtlayers.append({'name':typ,'features':feats})
  if not mvtlayers:continue
  encoded=mapbox_vector_tile.encode(mvtlayers,default_options={'quantize_bounds':(bounds.left,bounds.bottom,bounds.right,bounds.top),'extents':4096})
  tileentries.append((zxy_to_tileid(tile.z,tile.x,tile.y),gzip.compress(encoded,mtime=0)))
 path=ROOT/f'{archive}.pmtiles'
 with path.open('wb') as out:
  writer=Writer(out)
  for tid,data in sorted(tileentries):writer.write_tile(tid,data)
  header={'tile_compression':Compression.GZIP,'tile_type':TileType.MVT,'min_lon_e7':int(BBOX[0]*1e7),'min_lat_e7':int(BBOX[1]*1e7),'max_lon_e7':int(BBOX[2]*1e7),'max_lat_e7':int(BBOX[3]*1e7),'center_zoom':15,'center_lon_e7':1201594795,'center_lat_e7':302713188}
  metadata={'name':f'KYWOO Wulin Intime {archive}','description':'Bounded original tiles from official Overture GeoParquet; geometry and source heights are estimates, not surveyed','version':'1','attribution':manifest['attribution'],'license':'ODbL-1.0','vector_layers':[{'id':typ,'fields':{'id':'String','height':'Number','class':'String','subtype':'String','name':'String'},'minzoom':12,'maxzoom':17} for typ in types]}
  writer.finalize(header,metadata)
 manifest['themes'][archive]={'features':counts,'tiles':len(tileentries),'bytes':path.stat().st_size,'sha256':hashlib.sha256(path.read_bytes()).hexdigest()}
 print(archive,manifest['themes'][archive],flush=True)
(ROOT/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
