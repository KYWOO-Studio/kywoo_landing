import json,gzip,math,hashlib
from pathlib import Path
from pmtiles.reader import Reader
import mercantile,mapbox_vector_tile
from shapely.geometry import shape,box
from shapely.ops import transform
import numpy as np
ROOT=Path('assets/tiles/wulin-intime/2026-09-23.1');report={}
t=mercantile.tile(120.15947951,30.27131877,17);b=mercantile.xy_bounds(t);w=b.right-b.left
for theme in ['buildings','transportation','base']:
 blob=(ROOT/f'{theme}.pmtiles').read_bytes();r=Reader(lambda off,n:blob[off:off+n]);data=r.get(t.z,t.x,t.y);assert data
 layers=mapbox_vector_tile.decode(gzip.decompress(data),default_options={'transformer':lambda x,y:(b.left+x/4096*w,b.bottom+y/4096*w)})
 report[theme]={'header':{k:v for k,v in r.header().items() if k in ['min_zoom','max_zoom','min_lon_e7','min_lat_e7','max_lon_e7','max_lat_e7']},'layers':{k:len(v['features']) for k,v in layers.items()},'sha256':hashlib.sha256(blob).hexdigest()}
 if theme=='buildings':
  originals={f['properties']['id']:f for f in json.loads((ROOT/'source/building.geojson').read_text())['features']}
  distances=[]
  def merc(x,y,z=None):return(6378137*np.radians(x),6378137*np.log(np.tan(np.pi/4+np.radians(y)/2)))
  for f in layers['building']['features']:
   source=transform(merc,shape(originals[f['properties']['id']]['geometry'])).intersection(box(b.left,b.bottom,b.right,b.top))
   decoded=shape(f['geometry']);d=decoded.hausdorff_distance(source)
   if source.area>5:distances.append(d)
  assert distances and max(distances)<1,distances
  report[theme]['max_sample_geometry_error_metres']=max(distances);report[theme]['matched_source_features']=len(distances)
Path('evidence/local-tile-validation.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report,indent=2))
