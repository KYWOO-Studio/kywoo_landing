#!/usr/bin/env python3
"""Build the WeChat mini program's content from the website.

  python3 scripts/build-mp.py

index.html (Chinese) is the one source of the text. This script reads it, plus
the diagram wording in living-loop.js, and writes:

  miniprogram/data/content.js   every text, link and photo the mini program shows
  miniprogram/images/*.jpg      the site's photos, resized for phones

So after any change to the site's wording, run this script and the mini program
follows. A few lines are worded for the mini program instead of the website
(no mouse, no e-mail program, no 3D): those are in MP_TEXT below. If the page
structure changes so that something can no longer be found, the script stops
and says what is missing instead of writing a half-empty file.

Photos that the site loads from other websites (Pexels, JOA, the 朱家角 report)
are used from miniprogram/images/remote/<name>.jpg when that file exists;
otherwise the remote address is kept and the script lists it.
"""
import ast
import json
import os
import re
import sys

from bs4 import BeautifulSoup
from PIL import Image

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
MP = os.path.join(ROOT, 'miniprogram')
OUT_IMG = os.path.join(MP, 'images')

problems = []


def need(value, what):
    if value is None or value == '' or value == []:
        problems.append(what)
    return value


def text(el):
    """Visible text of an element, whitespace collapsed."""
    if el is None:
        return ''
    return re.sub(r'\s+', ' ', el.get_text(' ' if el.name in ('ul', 'ol') else '')).strip()


def lines(el):
    """Text split at <br> into lines (titles)."""
    if el is None:
        return []
    for br in el.find_all('br'):
        br.replace_with('\n')
    return [re.sub(r'\s+', ' ', t).strip() for t in el.get_text().split('\n') if t.strip()]


# ---------- photos ----------

# remote photo -> file name under miniprogram/images/remote/
REMOTE = {
    'https://images.pexels.com/photos/38003117/pexels-photo-38003117.jpeg': 'hero-zhujiajiao',
    'https://images.pexels.com/videos/40138161/pictures/preview-0.jpg': 'hero-westlake',
    'https://kywoo-zhujiajiao.vercel.app/media/canal.jpg': 'zhujiajiao-canal',
    'https://kywoo-zhujiajiao.vercel.app/media/bridge.jpg': 'zhujiajiao-bridge',
    'https://www.justopenarch.com/wp-content/uploads/2022/12/foshan-hongwang-hq-12.jpg': 'joa-foshan',
    'https://www.justopenarch.com/wp-content/uploads/2024/09/plan-museum7-s.jpg': 'joa-turku',
    'https://www.justopenarch.com/wp-content/uploads/2022/12/head-2-scaled.jpg': 'joa-nanjing',
    'https://www.justopenarch.com/wp-content/uploads/2023/11/tartu.jpg': 'joa-tartu',
}
remote_missing = []
made = set()


def resize(src_path, out_name, width, quality):
    out = os.path.join(OUT_IMG, out_name + '.jpg')
    if out_name not in made:
        im = Image.open(src_path).convert('RGB')
        if im.width > width:
            im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
        im.save(out, 'JPEG', quality=quality, optimize=True, progressive=True)
        made.add(out_name)
    return '/images/' + out_name + '.jpg'


def photo(img, width=720, quality=68):
    """Mini program path for a site <img>, resized; remote photos from images/remote/ when present."""
    src = img.get('src', '')
    # the largest local candidate in srcset, so resizing starts from the best copy
    cands = [src] + [c.strip().split(' ')[0] for c in img.get('srcset', '').split(',') if c.strip()]
    local = [c for c in cands if c.startswith('assets/')]
    if local:
        best = max(local, key=lambda c: Image.open(os.path.join(ROOT, c)).width)
        name = os.path.splitext(os.path.basename(best))[0]
        name = re.sub(r'-(480|960|1080|1280)$', '', name)
        return resize(os.path.join(ROOT, best), name, width, quality)
    base = src.split('?')[0]
    if base not in REMOTE:
        problems.append('no name for remote photo ' + src)
        return src
    name = REMOTE[base]
    have = os.path.join(OUT_IMG, 'remote', name + '.jpg')
    if os.path.exists(have):
        return resize(have, name, width, quality)
    remote_missing.append((name, src))
    return src


def data_map_image(svg_src):
    """The 数据 background on the site is an SVG map (1.5 MB); the mini program uses a JPEG of it,
    assets/method/wulin-data-960.jpg, made from the SVG in a browser (Chromium screenshot at 960 × 754)."""
    jpg = os.path.join(ROOT, re.sub(r'\.svg$', '-960.jpg', svg_src))
    if not os.path.exists(jpg):
        problems.append('JPEG copy of ' + svg_src + ' (screenshot the SVG to ' + os.path.relpath(jpg, ROOT) + ')')
        return ''
    return resize(jpg, 'bg-data', 540, 55)


# ---------- wording that differs in the mini program ----------

MP_TEXT = {
    # FAQ 06: no mouse or Escape key on a phone
    'faq-06': '轻点三角的一个方向或外圈的一个方法，相连的方向或方法会一起亮起，下方显示说明；再点一次同一个圆回到全图。「暂停动效」可停止粒子流动。',
    # contact note: the mini program copies instead of opening a mail program
    'contact-note': '「复制邮箱」与「复制微信号」会把联系方式复制到剪贴板。小程序不收集或提交资料。',
    # links leave the mini program: they are copied
    'link-copied': '小程序内无法直接打开外部网页。链接已复制，可粘贴到浏览器中打开。',
    'diagram-hint': '轻点圆圈查看说明，再点一次回到总览。',
}
# disclosure sections reworded for the mini program (no 3D, no Three.js, no browser loading)
NOTES_REPLACE = {  # title: (new title, old words, new words)
    '3D 模型': ('三角图解', '「我们做什么」中的 3D 三角为方法图解', '「我们做什么」中的三角为方法图解'),
}
# when the JOA photos are bundled, the site's "loaded straight from the JOA website" no longer holds
JOA_LOADED = ['，图片由 JOA 网站直接加载', '，由该网站直接加载']
NOTES_DROP = {'技术素材'}


# ---------- read the site ----------

soup = BeautifulSoup(open(os.path.join(ROOT, 'index.html'), encoding='utf-8').read(), 'html.parser')
loop_js = open(os.path.join(ROOT, 'living-loop.js'), encoding='utf-8').read()


def js_zh(name):
    """First (Chinese) argument of `const name = L(..., ...)` in living-loop.js."""
    m = re.search(r'const ' + name + r' = L\(\s*\[', loop_js)
    if not m:
        problems.append('living-loop.js: ' + name)
        return []
    start = depth = m.end() - 1
    depth, quote = 0, None
    for i in range(start, len(loop_js)):  # the balanced [...] (strings may hold brackets)
        c = loop_js[i]
        if quote:
            quote = None if c == quote and loop_js[i - 1] != '\\' else quote
        elif c in '\'"':
            quote = c
        elif c == '[':
            depth += 1
        elif c == ']':
            depth -= 1
            if depth == 0:
                return ast.literal_eval(loop_js[start:i + 1])
    problems.append('living-loop.js: ' + name)
    return []


def br_lines(s):
    return [t.strip() for t in s.split('<br>') if t.strip()]


os.makedirs(OUT_IMG, exist_ok=True)
os.makedirs(os.path.join(OUT_IMG, 'remote'), exist_ok=True)

# hero
hero_el = soup.select_one('#top')
hero = {
    'eyebrow': need(text(hero_el.select_one('.hero-eyebrow')), 'hero eyebrow'),
    'titleLines': need(lines(hero_el.select_one('h1')), 'hero title'),
    'lead': need(text(hero_el.select_one('.hero-lead')), 'hero lead'),
    'slides': [{'src': photo(img, 960, 68), 'alt': img.get('alt', ''), 'caption': img.get('data-caption', '')}
               for img in hero_el.select('img.cp-slide')],
}
# the first screen only shows photos inside the package: a remote photo that does not load
# (often the case in mainland China) would leave the whole screen empty
hero_remote = [s for s in hero['slides'] if not s['src'].startswith('/images/')]
hero['slides'] = [s for s in hero['slides'] if s['src'].startswith('/images/')]
need(hero['slides'], 'hero photos inside the package')

# about
about_el = soup.select_one('#about')
kick = about_el.select_one('.section-kicker')
about = {
    'kicker': need(kick.contents[0].strip() if kick else '', 'about kicker'),
    'kickerSub': text(kick.select_one('span')) if kick else '',
    'summary': need(text(about_el.select_one('.about-summary')), 'about summary'),
}

# what we do: the triangle and the six services
ap = soup.select_one('#approach')
ap_kick = ap.select_one('.section-kicker')
DIRS = ['data', 'space', 'activity']
ov = js_zh('overview')
content = js_zh('content')
ov_detail = js_zh('overviewDetail')
detail = js_zh('detail')
dir_buttons = ap.select('[data-loop-step]')
need(len(dir_buttons) == 3 or None, 'three direction buttons')
backgrounds = {}
for img in ap.select('[data-network-image]'):
    key = img['data-network-image']
    backgrounds[key] = data_map_image(img['src']) if img['src'].endswith('.svg') else photo(img, 540, 55)

dirs = []
for i, b in enumerate(dir_buttons):
    dirs.append({
        'key': DIRS[i],
        'label': text(b.select_one('span')),
        'name': text(b.select_one('strong')),
        'short': text(b.select_one('small')),
        'index': content[i][0] if i < len(content) else '',
        'titleLines': br_lines(content[i][1]) if i < len(content) else [],
        'detail': content[i][2] if i < len(content) else '',
        'question': detail[i][0] if i < len(detail) else '',
        'tags': detail[i][1] if i < len(detail) else '',
        'image': backgrounds.get(str(i), ''),
    })

BREAKS = {'城市商业与文旅空间整体规划': 7}  # same as living-loop.js


def two_lines(t):
    k = BREAKS.get(t, t.find('与'))
    return [t[:k], t[k:]] if k > 0 else [t]


ANGLE = [150, 30, 210, 270, 330, 90]  # same as living-loop.js
nodes = ap.select('[data-strategy]')
strategies = []
for si, li in enumerate(ap.select('[data-strategy-text]')):
    title = text(li.select_one('h3'))
    node = nodes[si] if si < len(nodes) else None
    d = li['data-dirs'].split()
    # the small triangle icon, copied from the site's SVG (forest green, margin so the dots are not cut off)
    svg = li.select_one('svg.strategy-tri')
    icon = 'tri-' + '-'.join(d)
    if svg is not None:
        svg = str(svg).replace('currentColor', '#203e34').replace(' class="strategy-tri"', '').replace(' aria-hidden="true"', '')
        svg = re.sub(r'^<svg[^>]*>', '<svg xmlns="http://www.w3.org/2000/svg" width="68" height="62" viewBox="-4 -4 68 62">', svg)
        os.makedirs(os.path.join(OUT_IMG, 'tri'), exist_ok=True)
        open(os.path.join(OUT_IMG, 'tri', icon + '.svg'), 'w').write(svg)
    else:
        problems.append('service icon %d' % (si + 1))
    strategies.append({
        'icon': '/images/tri/' + icon + '.svg',
        'num': text(li.select_one('.strategy-num')),
        'title': need(title, 'service title %d' % (si + 1)),
        'titleLines': two_lines(title),
        'short': need(text(node.select_one('small')) if node else '', 'service short label %d' % (si + 1)),
        'en': text(li.select_one('.strategy-en')),
        'desc': need(text(li.select_one('.strategy-desc')), 'service text %d' % (si + 1)),
        'out': need(text(li.select_one('.strategy-out span')), 'service outputs %d' % (si + 1)),
        'outLabel': text(li.select_one('.strategy-out strong')),
        'dirs': [DIRS.index(x) for x in d],
        'angle': ANGLE[si] if si < len(ANGLE) else 0,
    })
need(len(strategies) == 6 or None, 'six services')

approach = {
    'kicker': ap_kick.contents[0].strip() if ap_kick else '',
    'kickerSub': text(ap_kick.select_one('span')) if ap_kick else '',
    'overview': {
        'index': ov[0] if ov else '', 'titleLines': br_lines(ov[1]) if len(ov) > 1 else [],
        'detail': ov[2] if len(ov) > 2 else '',
        'question': ov_detail[0] if ov_detail else '', 'tags': ov_detail[1] if len(ov_detail) > 1 else '',
        'image': backgrounds.get('overview', ''),
    },
    'dirs': dirs,
    'strategies': strategies,
    'listTitle': text(ap.select_one('.strategy-all summary')).replace('＋', '').strip(),
    'hint': MP_TEXT['diagram-hint'],
}
need(approach['overview']['titleLines'], 'diagram overview')

# principles
pr = soup.select_one('#principles')
pr_img = pr.select_one('.about-photo img')
LINK_TARGET = {'#strategies': {'tab': 'services'}, '#approach': {'tab': 'services'}, '#faq': {'tab': 'contact'}}
principles = {
    'image': {'src': photo(pr_img), 'alt': pr_img.get('alt', ''),
              'caption': text(pr.select_one('.about-photo figcaption'))},
    'label': text(pr.select_one('.about-label')),
    'items': [],
}
for art in pr.select('.principle'):
    item = {
        'num': text(art.select_one('.principle-num')),
        'titleLines': lines(art.select_one('h3')),
        'body': text(art.select_one('.principle-copy > p')),
    }
    types = art.select('.space-types li')
    if types:
        item['types'] = [{'name': text(t.select_one('strong')), 'desc': text(t.select_one('span'))} for t in types]
    a = art.select_one('.principle-copy a')
    if a:
        href = a['href']
        target = LINK_TARGET.get(href)
        m = re.match(r'#strategy-0(\d)$', href)
        if m:
            target = {'tab': 'services', 'strategy': int(m.group(1)) - 1}
        if not target:
            problems.append('principle link target ' + href)
        item['link'] = {'label': text(a).replace('↓', '').strip(), **(target or {})}
    principles['items'].append(item)
need(len(principles['items']) == 5 or None, 'five principles')

# the statement, split at the commas the website uses for its phrases
st_text = text(soup.select_one('[data-scroll-statement]'))
statement = {'phrases': need(re.findall(r'[^，、。]+[，、。]?', st_text), 'statement')}

# cases
cs = soup.select_one('#cases')
cs_kick = cs.select_one('.section-kicker')
groups = {'current': '当前项目', 'past': '过往经验'}
nav_sub = soup.select('.nav-sub a')
for a in nav_sub:
    if a['href'] == '#cases-current':
        groups['current'] = a.contents[0].strip()
    if a['href'] == '#cases-past':
        groups['past'] = a.contents[0].strip()
cases = {
    'kicker': cs_kick.contents[0].strip() if cs_kick else '',
    'kickerSub': text(cs_kick.select_one('span')) if cs_kick else '',
    'titleLines': need(lines(cs.select_one('#cases-title')), 'cases title'),
    'groups': groups,
    'items': [],
}
for art in cs.select('.project-card'):
    cid = art['id'].replace('project-', '')
    card = art.select_one('.project-open')
    det = art.select_one('.project-detail')
    body = det.select_one('.project-detail-body')
    thumbs = card.select('.project-thumb img')
    photos = [{'src': photo(img), 'alt': img.get('alt', '')} for img in thumbs]
    links = []
    for a in body.select('a'):
        links.append({'label': text(a).replace('↗', '').strip(), 'url': a['href'],
                      'primary': 'report-link' in (a.get('class') or [])})
    paras = [text(p) for p in body.find_all('p', recursive=False) if not p.get('class')]
    pos = (thumbs[0].get('style') or '') if thumbs else ''
    item = {
        'id': cid,
        'group': art['data-group'],
        'kind': text(card.select_one('.project-kind')),
        'dirs': art['data-dirs'].split(),
        'name': need(text(card.select_one('.project-name')), 'case name ' + cid),
        'sub': text(card.select_one('.project-sub')),
        'more': text(card.select_one('.project-more')),
        'photos': need(photos, 'case photos ' + cid),
        'position': 'top' if '50% 65%' in pos else 'center',
        'caption': text(det.select_one('figcaption')),
        'body': paras,
        'by': text(body.select_one('.project-by')),
        'links': links,
        'note': text(body.select_one('.project-note')),
    }
    cases['items'].append(item)
need(cases['items'], 'cases')

# contact and FAQ
fq = soup.select_one('#faq')
fq_kick = fq.select_one('.section-kicker')
mail = fq.select_one('a.contact-pill')['href'].replace('mailto:', '')
wechat = fq.select_one('[data-copy-wechat]')['data-copy-wechat']
faq = []
for d in fq.select('.faq-list details'):
    num = text(d.select_one('summary span'))
    faq.append({'num': num, 'q': text(d.select_one('summary strong')),
                'a': MP_TEXT.get('faq-' + num) or text(d.select_one('.faq-answer'))})
brief = fq.select_one('[data-brief-text]').get_text()
contact = {
    'kicker': fq_kick.contents[0].strip() if fq_kick else '',
    'kickerSub': text(fq_kick.select_one('span')) if fq_kick else '',
    'titleLines': need(lines(fq.select_one('#faq-title')), 'contact title'),
    'intro': text(fq.select_one('.faq-heading > p')),
    'email': need(mail, 'e-mail'),
    'wechat': need(wechat, 'WeChat ID'),
    'brief': {'title': text(fq.select_one('[data-brief-fallback] summary')).replace('查看', ''),
              'lines': [l for l in brief.split('\n') if l.strip()]},
    'note': MP_TEXT['contact-note'],
    'faq': faq,
}
need(len(faq) >= 5 or None, 'FAQ')

# footer and disclosure
ft = soup.select_one('.site-footer')
footer = {
    'slogan': text(ft.select_one('.footer-top > p')),
    'copyright': text(ft.select_one('.footer-bottom p:last-of-type')),
}
dl = soup.select_one('[data-disclosure]')
notes = {'title': text(dl.select_one('#disclosure-title')), 'sections': []}
for sec in dl.select('.disclosure-body section'):
    title = text(sec.select_one('h3'))
    if title in NOTES_DROP:
        continue
    body = text(sec.select_one('p'))
    if title in NOTES_REPLACE:
        new_title, a, b = NOTES_REPLACE[title]
        if a not in body:
            problems.append('disclosure wording changed: ' + title)
        body, title = body.replace(a, b), new_title
    notes['sections'].append({'title': title, 'body': body})
need(notes['sections'], 'disclosure')

if not any(n.startswith('joa-') for n, _ in remote_missing):
    for it in cases['items']:
        for w in JOA_LOADED:
            it['note'] = it['note'].replace(w, '')
    for sec in notes['sections']:
        for w in JOA_LOADED:
            sec['body'] = sec['body'].replace(w, '')

data = {
    'brand': {'name': 'KYWOO', 'studio': 'STUDIO', 'shareTitle': 'KYWOO Studio — ' + ''.join(hero['titleLines'])},
    'hero': hero, 'about': about, 'approach': approach, 'principles': principles,
    'statement': statement, 'cases': cases, 'contact': contact, 'footer': footer, 'notes': notes,
    'text': {'linkCopied': MP_TEXT['link-copied']},
}

if problems:
    print('Not written. Could not find in the site:')
    for p in problems:
        print('  -', p)
    sys.exit(1)

# remove photos that are no longer used (keeps the package small)
for f in os.listdir(OUT_IMG):
    if f.endswith('.jpg') and os.path.splitext(f)[0] not in made:
        os.remove(os.path.join(OUT_IMG, f))

os.makedirs(os.path.join(MP, 'data'), exist_ok=True)
with open(os.path.join(MP, 'data', 'content.js'), 'w', encoding='utf-8') as f:
    f.write('// Generated by scripts/build-mp.py from index.html and living-loop.js. Do not edit by hand.\n')
    f.write('module.exports = ' + json.dumps(data, ensure_ascii=False, indent=1) + ';\n')

size = sum(os.path.getsize(os.path.join(OUT_IMG, f)) for f in os.listdir(OUT_IMG) if f.endswith('.jpg'))
print('Wrote miniprogram/data/content.js and %d photos (%d KB).' % (len(made), size // 1024))
if remote_missing:
    print('Still loaded from other websites (put a copy in miniprogram/images/remote/ to bundle it):')
    for name, src in remote_missing:
        print('  %s.jpg  <-  %s' % (name, src))
if hero_remote:
    print('Left out of the first screen until bundled: %d photo(s).' % len(hero_remote))
