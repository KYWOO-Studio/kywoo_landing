"""Static local review server with PMTiles HTTP Range support."""
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
import os,re
class Handler(SimpleHTTPRequestHandler):
 def send_head(self):
  path=self.translate_path(self.path)
  if os.path.isfile(path) and self.headers.get('Range'):
   f=open(path,'rb');size=os.fstat(f.fileno()).st_size;m=re.fullmatch(r'bytes=(\d+)-(\d*)',self.headers['Range'])
   if not m:f.close();self.send_error(416);return None
   start=int(m[1]);end=min(int(m[2]) if m[2] else size-1,size-1)
   if start> end:f.close();self.send_error(416);return None
   self.send_response(206);self.send_header('Content-Type',self.guess_type(path));self.send_header('Accept-Ranges','bytes');self.send_header('Content-Range',f'bytes {start}-{end}/{size}');self.send_header('Content-Length',str(end-start+1));self.send_header('ETag',f'"{size}-{os.stat(path).st_mtime_ns}"');self.end_headers();f.seek(start);self.remaining=end-start+1;return f
  self.remaining=None
  return super().send_head()
 def copyfile(self,source,outputfile):
  if self.remaining is None:return super().copyfile(source,outputfile)
  while self.remaining:
   data=source.read(min(self.remaining,65536))
   if not data:break
   outputfile.write(data);self.remaining-=len(data)
ThreadingHTTPServer(('127.0.0.1',5189),Handler).serve_forever()
