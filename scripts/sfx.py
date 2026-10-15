#!/usr/bin/env python3
"""Efectos de sonido: biblioteca (genéricos) + sonidos generados con ElevenLabs (literales, se generan una sola vez).
uso: $PY sfx.py list [texto|generados|biblioteca] → sonidos disponibles, filtrando por texto o por origen
     $PY sfx.py gen "<descripción en inglés>" --id <id> --cat <categoría> [--dur 1.5] [--anchor peak|onset]
                    [--influence 0.5] [--desc "cuándo usarlo"]
       → si el id ya existe lo reusa (no gasta créditos); si no, lo genera con ElevenLabs, recorta silencios, normaliza
         (−16 LUFS, pico ≤ −1 dBTP, WAV 48 kHz) y lo guarda en la biblioteca local ~/.config/motion/sfx (fuera del repo).
Los generados no son automáticos: ponerlos en story.js con X('<id>', w('palabra')) o en la escena con sfx:[['<id>', w('palabra')]].
"""
import os as _o,sys as _s,subprocess as _sp
if _o.name=='nt' and __name__=='__main__' and not _s.flags.utf8_mode: _s.exit(_sp.run([_s.executable,'-X','utf8','-I',_o.path.abspath(__file__),*_s.argv[1:]]).returncode)
import array,json,math,os,re,subprocess,sys,tempfile,time
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
SK=os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..'))
BASE=os.path.join(SK,'assets','sfx','catalog.json')
LOCAL=os.path.expanduser('~/.config/motion/sfx');LCAT=os.path.join(LOCAL,'catalog.json')
TARGET=-16.0;CEIL=-1.0;SR=48000

def envelope(f):
    raw=subprocess.run(['ffmpeg','-v','error','-i',f,'-ac','1','-ar',str(SR),'-f','s16le','-'],capture_output=True,check=True).stdout
    a=array.array('h',raw);hop=SR//1000
    return [max((abs(x) for x in a[i:i+hop]),default=0)/32768 for i in range(0,len(a),hop)]
def shape(f):
    e=envelope(f);pk=max(e) or 1e-9;db=lambda v:20*math.log10(max(v,1e-9)/pk)
    on=next(i for i,v in enumerate(e) if db(v)>-40);end=len(e)-next(i for i,v in enumerate(reversed(e)) if db(v)>-45)
    return dict(dur=len(e)/1000,onset=on/1000,peak=e.index(pk)/1000,end=end/1000)
def loudness(f):
    r=subprocess.run(['ffmpeg','-hide_banner','-nostats','-i',f,'-af','ebur128=peak=true','-f','null','-'],capture_output=True).stderr.decode('utf-8','replace')
    return float(re.findall(r'I:\s+(-?[\d.]+) LUFS',r)[-1]),float(re.findall(r'Peak:\s+(-?[\d.]+) dBFS',r)[-1])
def load(p): return json.load(open(p)) if os.path.exists(p) else {'target_lufs':TARGET,'categories':{},'sounds':{}}

def normalize(src,cat,id,anchor):
    s=shape(src);a=round(max(0,s['onset']-.005),3);b=min(s['dur'],s['end']+.08)
    tmp=os.path.join(tempfile.mkdtemp(),'t.wav')
    subprocess.run(['ffmpeg','-v','error','-y','-i',src,'-af',f'atrim=start={a}:end={b},asetpts=PTS-STARTPTS,afade=t=in:d=0.003,afade=t=out:st={max(0,b-a-.04):.3f}:d=0.04',
                    '-ar',str(SR),'-ac','2','-c:a','pcm_s16le',tmp],check=True)
    I,P=loudness(tmp);g=CEIL-P if I<-60 else min(TARGET-I,CEIL-P)   # muy cortos: LUFS no mide, normalizar por pico
    rel=os.path.join(cat,id+'.wav');out=os.path.join(LOCAL,rel);os.makedirs(os.path.dirname(out),exist_ok=True)
    subprocess.run(['ffmpeg','-v','error','-y','-i',tmp,'-af',f'volume={g:.2f}dB','-ar',str(SR),'-ac','2','-c:a','pcm_s16le',out],check=True)
    s2=shape(out);I2,P2=loudness(out)
    # sonidos graves/con picos (latidos, golpes) quedan bajos al limitar el pico: compensar al mezclar (máx. ×3)
    adj=round(min(3.0,10**((TARGET-I2)/20)),2) if I2<TARGET-1 else 1.0
    return dict(cat=cat,file=rel,dur=round(s2['dur'],3),anchor=round(s2['peak'] if anchor=='peak' else 0.0,3),anchor_mode=anchor,lufs=I2,tp=P2,gain_adj=adj)

def gen(prompt,o):
    id=o['id'];cat=o['cat']
    assert re.fullmatch(r'[a-z0-9-]+',id) and re.fullmatch(r'[a-z0-9-]+',cat),'id y categoría: minúsculas, números y guiones'
    base,c=load(BASE),load(LCAT)
    if id in base['sounds'] or id in c['sounds']: print(f'✓ "{id}" ya existe: se reusa (sin gastar créditos)');return
    if id in base['categories'] or id in c['categories']: raise SystemExit(f'el id "{id}" choca con una categoría: usar {id}-1')
    import tts
    body={'text':prompt,'prompt_influence':float(o.get('influence',.5))}
    if o.get('dur'): body['duration_seconds']=float(o['dur'])
    print(f'Generando "{id}" con ElevenLabs: {prompt}')
    raw=tts.eleven_req('https://api.elevenlabs.io/v1/sound-generation?output_format=mp3_44100_128',body)
    mp3=os.path.join(tempfile.mkdtemp(),'g.mp3');open(mp3,'wb').write(raw)
    m=normalize(mp3,cat,id,o.get('anchor','onset'));m.update(desc=o.get('desc',prompt),source='elevenlabs',prompt=prompt,created=int(time.time()))
    c['sounds'][id]=m;c['categories'].setdefault(cat,{'gain':float(o.get('gain',.25)),'auto':False,'desc':'Generados con ElevenLabs'})
    os.makedirs(LOCAL,exist_ok=True);json.dump(c,open(LCAT,'w'),indent=1,ensure_ascii=False)
    print(f"✓ {id:20s} {cat:10s} {m['dur']:5.2f}s  anchor {m['anchor']:5.2f}  {m['lufs']:6.1f} LUFS → {os.path.join(LOCAL,m['file'])}")

def lst(q=None):
    q=(q or '').lower()
    libs=(('biblioteca',load(BASE),os.path.dirname(BASE)),('generados',load(LCAT),LOCAL))
    if q in('generados','biblioteca'): libs=[x for x in libs if x[0]==q];q=''
    for name,c,root in libs:
        rows=[(i,s) for i,s in c['sounds'].items() if not q or q in (i+' '+s['cat']+' '+s.get('desc','')+' '+s.get('prompt','')).lower()]
        if not rows: continue
        print(f'\n── {name} ({root})')
        for i,s in sorted(rows,key=lambda x:(x[1]['cat'],x[0])):
            auto=c['categories'].get(s['cat'],{}).get('auto')
            print(f"  {i:20s} {s['cat']:9s} {s['dur']:5.2f}s {'auto ' if auto else 'manual'}  {s.get('desc','')[:60]}")

if __name__=='__main__':
    a=sys.argv[1:]
    if not a or a[0] in('-h','--help'): print(__doc__)
    elif a[0]=='list': lst(a[1] if len(a)>1 else None)
    elif a[0]=='gen':
        o={};k=2
        while k<len(a): o[a[k][2:]]=a[k+1];k+=2
        gen(a[1],o)
