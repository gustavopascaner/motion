#!/usr/bin/env python3
"""Marcas guardadas (colores, tipografías, logo) para los videos de motion graphics.
uso: $PY brand.py list                       → marcas guardadas
     $PY brand.py show <marca>               → su brand.json
     $PY brand.py setup <marca>              → completa brands/<marca>/brand.json: baja de Google Fonts las tipografías que
                                               falten, copia el logo a la carpeta de la marca y chequea el contraste
     $PY brand.py colors <imagen>            → colores dominantes de un logo o imagen (hex), para proponer paleta
     $PY brand.py fonts                      → combinaciones de tipografías sugeridas
Para crear una marca: escribir brands/<marca>/brand.json (copiar brands/editorial/brand.json) con solo "family" en cada
tipografía (sin "files") y correr setup. Después: node scripts/render.js --brand-preview=<marca> --out=<png>
"""
import os as _o,sys as _s,subprocess as _sp
if _o.name=='nt' and __name__=='__main__' and not _s.flags.utf8_mode: _s.exit(_sp.run([_s.executable,'-X','utf8','-I',_o.path.abspath(__file__),*_s.argv[1:]]).returncode)
import json,os,re,shutil,subprocess,sys,urllib.request,urllib.parse
SK=os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..'));BR=os.path.join(SK,'brands')
PAIRS=[('Editorial condensada','Bricolage Grotesque (800, condensada 76%)','Inter Tight','JetBrains Mono','Instrument Serif itálica'),
       ('Moderna geométrica','Montserrat (800)','Montserrat','Space Mono','Playfair Display itálica'),
       ('Impacto','Anton','Inter','JetBrains Mono','DM Serif Display itálica'),
       ('Elegante','Playfair Display (700)','Inter','IBM Plex Mono','Playfair Display itálica'),
       ('Amigable','Poppins (800)','Poppins','Space Mono','Caveat'),
       ('Técnica','Space Grotesk (700)','Space Grotesk','Space Mono','Fraunces itálica')]

def gfont(family,weights,italic,dst):
    """Baja TTF estáticos de Google Fonts (sin user agent devuelve truetype)."""
    os.makedirs(dst,exist_ok=True);fam=family.replace(' ','+');qs=[]
    ws=sorted(set(int(w) for w in weights))
    if italic: qs+=[f'{fam}:ital,wght@'+';'.join(f'1,{w}' for w in ws),f'{fam}:ital@1']
    qs+=[f'{fam}:wght@'+';'.join(map(str,ws)),fam]
    for q in qs:
        try: css=urllib.request.urlopen('https://fonts.googleapis.com/css2?family='+q,timeout=30).read().decode()
        except urllib.error.HTTPError: continue
        out=[]
        for st,wt,url in re.findall(r"font-style:\s*(\w+);\s*font-weight:\s*([\d ]+);[\s\S]*?src:\s*url\((\S+?)\)",css):
            fn=f"{re.sub(r'[^A-Za-z0-9]','',family)}-{wt.strip().replace(' ','_')}{'i' if st=='italic' else ''}.ttf"
            p=os.path.join(dst,fn)
            if not os.path.exists(p): open(p,'wb').write(urllib.request.urlopen(url,timeout=60).read())
            out.append({'file':'fonts/'+fn,'weight':wt.strip(),**({'style':'italic'} if st=='italic' else {})})
        if out: return out
    raise SystemExit(f'No encontré "{family}" en Google Fonts (revisar el nombre exacto en fonts.google.com)')

def lum(h):
    h=h.lstrip('#');r,g,b=[int(h[i:i+2],16)/255 for i in(0,2,4)]
    f=lambda v:v/12.92 if v<=.03928 else((v+.055)/1.055)**2.4
    return .2126*f(r)+.7152*f(g)+.0722*f(b)
def con(a,b): x,y=lum(a),lum(b);return(max(x,y)+.05)/(min(x,y)+.05)

def setup(slug):
    d=os.path.join(BR,slug);p=os.path.join(d,'brand.json');b=json.load(open(p))
    for k,f in b.get('fonts',{}).items():
        files=f.get('files') or []
        if files and all(os.path.exists(os.path.join(d,x['file'])) or os.path.exists(x['file']) for x in files): continue
        w=f.get('weight',800 if k=='display' else 700 if k=='body' else 400);ws={400,int(w)} if k!='accent' else {400}
        if k=='mono': ws={400,700}
        f['files']=gfont(f['family'],ws,f.get('italic',False) and k=='accent',os.path.join(d,'fonts'));print(f"✓ {k}: {f['family']} ({len(f['files'])} archivo/s)")
    lg=b.get('logo')
    if lg and os.path.isabs(lg) and os.path.exists(lg):
        ext=os.path.splitext(lg)[1].lower()
        if ext=='.svg': out=os.path.join(d,'logo.png');subprocess.run(['ffmpeg','-v','error','-y','-i',lg,'-vf','scale=1200:-1',out]);b['logo']='logo.png'
        else: shutil.copyfile(lg,os.path.join(d,'logo'+ext));b['logo']='logo'+ext
        print('✓ logo copiado a la marca')
    elif lg and not os.path.exists(os.path.join(d,lg)): print('⚠️  no encuentro el logo',lg)
    c=b['colors'];json.dump(b,open(p,'w'),indent=1,ensure_ascii=False)
    for bg in('dark','light','accent'):
        best=max(con(c[bg],c['dark']),con(c[bg],c['light']))
        if best<4.5: print(f'⚠️  el texto sobre "{bg}" ({c[bg]}) queda con poco contraste ({best:.1f}:1)')
    if con(c['dark'],c['accent'])<2.2 and con(c['dark'],c.get('accent2',c['light']))<2.2: print('⚠️  el acento casi no se ve sobre el fondo oscuro')
    if con(c['dark'],c['light'])<7: print(f"⚠️  oscuro y claro contrastan poco ({con(c['dark'],c['light']):.1f}:1): conviene un oscuro más oscuro o un claro más claro")
    print(f'✓ marca "{slug}" lista → node scripts/render.js --brand-preview={slug} --out=<png>')

def colors(img):
    raw=subprocess.run(['ffmpeg','-v','error','-i',img,'-vf','scale=96:96:force_original_aspect_ratio=decrease','-f','rawvideo','-pix_fmt','rgba','-'],capture_output=True).stdout
    cnt={}
    for i in range(0,len(raw),4):
        r,g,b,a=raw[i:i+4]
        if a<128: continue
        k=(r//24,g//24,b//24);s=cnt.setdefault(k,[0,0,0,0]);s[0]+=1;s[1]+=r;s[2]+=g;s[3]+=b
    tot=sum(v[0] for v in cnt.values()) or 1;out=[]
    for k,(n,r,g,b) in sorted(cnt.items(),key=lambda x:-x[1][0]):
        h='#%02X%02X%02X'%(r//n,g//n,b//n)
        if any(con(h,o)<1.35 for o,_ in out): continue
        out.append((h,n/tot))
        if len(out)>=6: break
    for h,f in out: print(f'{h}  {f*100:4.1f} %  luminancia {lum(h):.2f}')

if __name__=='__main__':
    a=sys.argv[1:]
    if not a or a[0] in('-h','--help'): print(__doc__)
    elif a[0]=='list':
        for s in sorted(os.listdir(BR)):
            p=os.path.join(BR,s,'brand.json')
            if os.path.exists(p): b=json.load(open(p));c=b['colors'];print(f"{s:20s} {b.get('name',s)[:30]:30s} {c['dark']} {c['light']} {c['accent']} {c.get('accent2','')}  · {b['fonts']['display']['family']}")
    elif a[0]=='show': print(open(os.path.join(BR,a[1],'brand.json')).read())
    elif a[0]=='setup': setup(a[1])
    elif a[0]=='colors': colors(a[1])
    elif a[0]=='fonts':
        for n,*f in PAIRS: print(f'{n:22s} títulos {f[0]} · texto {f[1]} · etiquetas {f[2]} · acento {f[3]}')
