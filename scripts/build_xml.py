#!/usr/bin/env python3
"""Proyecto editable para Premiere (FCP7 xmeml v4). uso: $PY build_xml.py <work>   (después de render.js --premiere)
Pistas: V1 escenas (una por clip, la transición de entrada viene compuesta) · V2 subtítulos (alfa) · V3 logo/progreso (alfa)
        A1 voz (una frase por clip) · A2 música con keyframes de volumen · A3+ SFX.  Rutas absolutas (file://localhost/...).
Copia voz, música y SFX a <out_dir>/Assets para que el proyecto sea autónomo. Marcadores = una por escena.
"""
import os as _o,sys as _s,subprocess as _sp
if _o.name=='nt' and __name__=='__main__' and not _s.flags.utf8_mode: _s.exit(_sp.run([_s.executable,'-X','utf8','-I',_o.path.abspath(__file__),*_s.argv[1:]]).returncode)
import json,os,re,shutil,subprocess,sys,time,urllib.parse,xml.dom.minidom
from xml.sax.saxutils import escape
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)));import timing;T0=time.time()
W=sys.argv[1];cfg=json.load(open(os.path.join(W,'config.json')));pm=json.load(open(os.path.join(W,'premiere.json')))
vo=json.load(open(os.path.join(W,'words.json')));sfx=json.load(open(os.path.join(W,'sfx.json')))
NAME=cfg['name'];OUT=cfg['out_dir'];A=os.path.join(OUT,'Assets');FPS=pm['fps'];VW,VH=pm['W'],pm['H'];TOT=pm['frames']
RATE=f'<rate><timebase>{FPS}</timebase><ntsc>FALSE</ntsc></rate>'
def url(p):   # macOS: file://localhost/Users/... · Windows: file://localhost/C%3a/Users/...
    p=os.path.abspath(p).replace('\\','/')
    if re.match(r'^[A-Za-z]:/',p): p='/'+p
    return 'file://localhost'+urllib.parse.quote(p,safe='/')
def fr(x): return int(round(x*FPS))
def dur(p): return float(subprocess.run(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',p],capture_output=True,text=True,errors='replace').stdout)
uid=[0]
def nid(p): uid[0]+=1; return f'{p}-{uid[0]}'
done=set()
def file_el(fid,path,frames,video=True,audio=False,ch=2):
    if fid in done: return f'<file id="{fid}"/>'
    done.add(fid);m='<media>'
    if video: m+=f'<video><samplecharacteristics>{RATE}<width>{VW}</width><height>{VH}</height><anamorphic>FALSE</anamorphic><pixelaspectratio>square</pixelaspectratio><fielddominance>none</fielddominance></samplecharacteristics></video>'
    if audio: m+=f'<audio><samplecharacteristics><depth>16</depth><samplerate>48000</samplerate></samplecharacteristics><channelcount>{ch}</channelcount></audio>'
    m+='</media>'
    return (f'<file id="{fid}"><name>{escape(os.path.basename(path))}</name><pathurl>{url(path)}</pathurl>{RATE}<duration>{frames}</duration>'
            f'<timecode>{RATE}<string>00:00:00:00</string><frame>0</frame><displayformat>NDF</displayformat></timecode>{m}</file>')
def level(g,kf=None):
    k=''.join(f'<keyframe><when>{w}</when><value>{v:.5f}</value></keyframe>' for w,v in kf) if kf else ''
    return ('<filter><effect><name>Audio Levels</name><effectid>audiolevels</effectid><effectcategory>audiolevels</effectcategory><effecttype>audiolevels</effecttype><mediatype>audio</mediatype>'
            f'<parameter><parameterid>level</parameterid><name>Level</name><valuemin>0.00001</valuemin><valuemax>31.6228</valuemax><value>{g:.5f}</value>{k}</parameter></effect></filter>')
def clip(cid,name,fx,start,end,cin,cout,d,extra='',srctrack=None):
    st=f'<sourcetrack><mediatype>audio</mediatype><trackindex>{srctrack}</trackindex></sourcetrack>' if srctrack else ''
    return (f'<clipitem id="{cid}"><name>{escape(name)}</name><enabled>TRUE</enabled><duration>{d}</duration>{RATE}'
            f'<start>{start}</start><end>{end}</end><in>{cin}</in><out>{cout}</out>{fx}{st}{extra}</clipitem>')
def track(items): return '<track>'+''.join(items)+'<enabled>TRUE</enabled><locked>FALSE</locked></track>'
db=lambda x:10**(x/20)

# ── video ──
vt={'scene':[],'caps':[],'overlay':[]};missing=[]
for c in pm['clips']:
    if not os.path.exists(c['file']): missing.append(c['file']);continue
    s,n=c['f0'],c['n'];vt[c['track']].append(clip(nid(c['kind']),c['label'],file_el('f-'+os.path.basename(c['file']),c['file'],n),s,s+n,0,n,n))
if missing: raise SystemExit('Faltan clips (correr render.js --premiere):\n  '+'\n  '.join(missing))
# ── voz: una frase por clip, cortada del voice.wav ya normalizado ──
os.makedirs(os.path.join(A,'Voz'),exist_ok=True);a1=[]
for b in vo['beats']:
    p=os.path.join(A,'Voz',b['id']+'.wav');s0=max(0,b['s']-.02);e0=b['e']+.02
    subprocess.run(['ffmpeg','-v','error','-y','-i',os.path.join(W,'voice.wav'),'-af',f'atrim={s0:.3f}:{e0:.3f},asetpts=PTS-STARTPTS','-ac','2',p],check=True)
    n=max(1,fr(e0-s0));s=fr(s0);a1.append(clip(nid('voz'),f"{b['id']} · {b['text'][:40]}",file_el('f-'+b['id'],p,n,False,True),s,s+n,0,n,n,level(1.0),srctrack=1))
# ── música: mismos niveles que mix.py (intro / bajo la voz / cierre), compensando su sonoridad a −16 LUFS ──
a2=[];M=cfg.get('music') or {}
if M.get('path'):
    os.makedirs(os.path.join(A,'Musica'),exist_ok=True);mp=os.path.join(A,'Musica',os.path.basename(M['path']))
    if os.path.abspath(mp)!=os.path.abspath(M['path']): shutil.copyfile(M['path'],mp)
    r=subprocess.run(['ffmpeg','-nostats','-i',mp,'-af','ebur128','-f','null','-'],capture_output=True,text=True,errors='replace').stderr
    I=float(re.findall(r'I:\s+(-?[\d.]+) LUFS',r)[-1]);comp=-16-I
    md=fr(dur(mp));off=fr(M.get('offset',0));vs,ve,T=vo['beats'][0]['s'],vo['voice_end'],pm['total']
    from mix import music_points;pts=music_points(vo,M,T,end=-60)   # misma curva que el MP4
    nm=('PREVIEW_' if (M.get('envato') or {}).get('status')=='preview' else '')+os.path.basename(mp)
    pos,cin=0,off
    while pos<TOT:   # si la música es más corta que el video, se repite
        n=min(TOT-pos,md-cin)
        if n<=0: break
        kf=[]
        for t,g in pts:   # keyframes en el tiempo del archivo (in del clip + desplazamiento)
            f=fr(t)-pos
            if 0<=f<=n: kf.append((cin+f,db(g+comp)))
        if not kf or kf[0][0]>cin: kf.insert(0,(cin,db(next(g for t,g in reversed(pts) if fr(t)<=pos)+comp)))
        a2.append(clip(nid('music'),nm,file_el('f-music',mp,md,False,True),pos,pos+n,cin,cin+n,md,level(kf[0][1],kf),srctrack=1));pos+=n;cin=0
# ── SFX ──
os.makedirs(os.path.join(A,'SFX'),exist_ok=True);st=[]
def put(item,s,e):
    for t in st:
        if t['end']<=s: break
    else: t={'end':0,'items':[]};st.append(t)
    t['items'].append(item);t['end']=e
for x in sfx:
    p=os.path.join(A,'SFX',x['id']+'.wav');shutil.copyfile(x['file'],p);fd=fr(dur(p));s=fr(x['start']);cin=fr(x['sin']);n=max(1,min(fr(x['dur']),fd-cin))
    put(clip(nid('sfx'),x['id'],file_el('f-sfx-'+x['id'],p,fd,False,True),s,s+n,cin,cin+n,fd,level(x['gain']),srctrack=1),s,s+n)
# ── secuencia ──
mk=''.join(f'<marker><comment></comment><name>{escape(c["label"])}</name><in>{c["f0"]}</in><out>-1</out></marker>' for c in pm['clips'] if c['kind']=='scene')
vfmt=f'<format><samplecharacteristics>{RATE}<width>{VW}</width><height>{VH}</height><anamorphic>FALSE</anamorphic><pixelaspectratio>square</pixelaspectratio><fielddominance>none</fielddominance><colordepth>24</colordepth></samplecharacteristics></format>'
afmt='<format><samplecharacteristics><depth>16</depth><samplerate>48000</samplerate></samplecharacteristics></format>'
seq=(f'<sequence id="seq-1"><name>{escape(NAME)}_MOTION</name><duration>{TOT}</duration>{RATE}'
     f'<timecode>{RATE}<string>00:00:00:00</string><frame>0</frame><displayformat>NDF</displayformat></timecode>'
     f'<media><video>{vfmt}'+''.join(track(vt[k]) for k in('scene','caps','overlay') if vt[k])+'</video>'
     f'<audio><numOutputChannels>2</numOutputChannels>{afmt}'+track(a1)+(track(a2) if a2 else '')+''.join(track(t['items']) for t in st)+f'</audio></media>{mk}</sequence>')
out=os.path.join(OUT,f'{NAME}_premiere.xml')
open(out,'w',encoding='utf-8').write('<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE xmeml>\n<xmeml version="4">'+seq+'</xmeml>\n')
xml.dom.minidom.parse(out)   # valida que esté bien formado
print(f"✓ {out}\n  V1 {len(vt['scene'])} escenas · V2 {len(vt['caps'])} subtítulos · V3 {len(vt['overlay'])} logo · A1 {len(a1)} frases · A2 música {'sí' if a2 else 'no'} · {len(sfx)} SFX en {len(st)} pista(s) · {TOT/FPS:.1f} s")
timing.log(W,'XML para Premiere',time.time()-T0)
