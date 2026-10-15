#!/usr/bin/env python3
"""Locución del guion: genera la voz de cada beat, la une y guarda los tiempos de cada palabra.
uso: $PY tts.py <work>                 lee <work>/script.json → <work>/voice.wav + <work>/words.json
     $PY tts.py voices [es-AR]         lista las voces de edge-tts de ese idioma
     $PY tts.py voices eleven [acento] lista voces de ElevenLabs (necesita ELEVENLABS_API_KEY), ej. acento "argentine"
     $PY tts.py sample <voz> "<texto>" <salida.mp3>   muestra corta para escuchar una voz

script.json:
{ "voice": {"engine":"edge", "id":"es-AR-ElenaNeural", "rate":"+5%", "pitch":"+0Hz"},
  "lead": 0.35,                      ← segundos de imagen antes de que arranque la voz
  "beats": [ {"id":"b01", "text":"¿Sabés por qué…?", "say":"(opcional: texto para pronunciar)", "pause":0.25}, … ] }
engine "eleven": {"engine":"eleven","id":"<voice_id>","model":"eleven_multilingual_v2","stability":0.45,"similarity":0.8,"style":0.25,"speed":1.05}
Cada beat se cachea (solo se regenera lo que cambió). Voces argentinas de edge: es-AR-ElenaNeural (mujer) · es-AR-TomasNeural (hombre).
"""
import os as _o,sys as _s,subprocess as _sp
if _o.name=='nt' and __name__=='__main__' and not _s.flags.utf8_mode: _s.exit(_sp.run([_s.executable,'-X','utf8','-I',_o.path.abspath(__file__),*_s.argv[1:]]).returncode)
import asyncio,base64,hashlib,json,os,re,subprocess,sys,time,urllib.request
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)));import timing
SR=48000

def edge_tts(text,v,mp3):
    import edge_tts
    async def go():
        c=edge_tts.Communicate(text,v['id'],rate=v.get('rate','+0%'),pitch=v.get('pitch','+0Hz'),volume=v.get('volume','+0%'),boundary='WordBoundary')
        ws=[]
        with open(mp3,'wb') as f:
            async for ch in c.stream():
                if ch['type']=='audio': f.write(ch['data'])
                elif ch['type']=='WordBoundary': ws.append({'w':ch['text'],'s':ch['offset']/1e7,'e':(ch['offset']+ch['duration'])/1e7})
        return ws
    for k in range(3):
        try: return asyncio.run(go())
        except Exception as e:
            if k==2: raise SystemExit(f'edge-tts falló ({e}). ¿Hay internet?')
            time.sleep(2)

def eleven(text,v,mp3):
    key=os.environ.get('ELEVENLABS_API_KEY') or raise_('Falta ELEVENLABS_API_KEY')
    body={'text':text,'model_id':v.get('model','eleven_multilingual_v2'),
          'voice_settings':{'stability':v.get('stability',.45),'similarity_boost':v.get('similarity',.8),'style':v.get('style',.25),'use_speaker_boost':True,'speed':v.get('speed',1.0)}}
    req=urllib.request.Request(f"https://api.elevenlabs.io/v1/text-to-speech/{v['id']}/with-timestamps?output_format=mp3_44100_128",
        json.dumps(body).encode(),{'xi-api-key':key,'Content-Type':'application/json'})
    d=json.loads(urllib.request.urlopen(req,timeout=120).read());open(mp3,'wb').write(base64.b64decode(d['audio_base64']))
    al=d.get('normalized_alignment') or d['alignment'];ch,st,en=al['characters'],al['character_start_times_seconds'],al['character_end_times_seconds']
    ws=[];cur=None
    for c,a,b in zip(ch,st,en):
        if c.isspace():
            if cur: ws.append(cur);cur=None
            continue
        if cur is None: cur={'w':'','s':a,'e':b}
        cur['w']+=c;cur['e']=b
    if cur: ws.append(cur)
    for w in ws: w['w']=re.sub(r'^[^\w¿¡]+|[^\w%]+$','',w['w']) or w['w']
    return [w for w in ws if re.search(r'\w',w['w'])]
def raise_(m): raise SystemExit(m)

def run(W):
    t0=time.time();S=json.load(open(os.path.join(W,'script.json')));v=S['voice'];lead=S.get('lead',.35)
    C=os.path.join(W,'voice','cache');os.makedirs(C,exist_ok=True)
    parts=[];words=[];beats=[];cur=lead;gen=0
    for i,b in enumerate(S['beats']):
        say=b.get('say') or b['text'];key=hashlib.sha1(json.dumps([v,say],sort_keys=True).encode()).hexdigest()[:16]
        mp3,wj=os.path.join(C,key+'.mp3'),os.path.join(C,key+'.json')
        if not(os.path.exists(mp3) and os.path.exists(wj)):
            ws=(eleven if v.get('engine')=='eleven' else edge_tts)(say,v,mp3);json.dump(ws,open(wj,'w'),ensure_ascii=False);gen+=1
        ws=json.load(open(wj))
        if not ws: raise SystemExit(f"{b['id']}: la voz no devolvió palabras")
        a=max(0,ws[0]['s']-.04);z=ws[-1]['e']+.12
        wav=os.path.join(W,'voice',f"{b['id']}.wav")
        subprocess.run(['ffmpeg','-v','error','-y','-i',mp3,'-af',f'atrim={a:.3f}:{z:.3f},asetpts=PTS-STARTPTS,afade=t=out:st={max(0,z-a-.06):.3f}:d=0.06','-ar',str(SR),'-ac','1',wav],check=True)
        dur=z-a;parts.append((wav,cur))
        for w in ws: words.append({'w':w['w'],'s':round(cur+w['s']-a,3),'e':round(cur+w['e']-a,3),'beat':b['id']})
        pause=b.get('pause',.38 if re.search(r'[.?!…]$',b['text'].strip()) else .18)
        beats.append({'id':b['id'],'text':b['text'],'s':round(cur,3),'e':round(cur+dur,3)});cur+=dur+(pause if i<len(S['beats'])-1 else 0)
    # mezcla de beats en sus tiempos + normalización de la voz (−16 LUFS)
    out=os.path.join(W,'voice.wav');args=['ffmpeg','-v','error','-y'];fc=[]
    for k,(p,at) in enumerate(parts): args+=['-i',p];fc.append(f'[{k}]adelay={int(at*1000)}|{int(at*1000)}[a{k}]')
    fc.append(''.join(f'[a{k}]' for k in range(len(parts)))+f'amix=inputs={len(parts)}:normalize=0,loudnorm=I=-16:TP=-1.5:LRA=7,aresample={SR}[o]')
    subprocess.run(args+['-filter_complex',';'.join(fc),'-map','[o]','-ac','1',out],check=True)
    total=round(cur,3);json.dump({'lead':lead,'voice_end':total,'beats':beats,'words':words},open(os.path.join(W,'words.json'),'w'),ensure_ascii=False,indent=1)
    nw=len(words);print(f'✓ voz: {total:.1f} s ({nw} palabras, {nw/max(.1,total-lead):.2f} pal/s) · {gen} beat(s) generados, {len(parts)-gen} de caché')
    for b in beats: print(f"  {b['id']}  {b['s']:6.2f}–{b['e']:6.2f}  {b['text'][:70]}")
    tgt=S.get('target',60)
    if total>tgt+6: print(f'⚠️  La voz dura {total:.0f} s (objetivo ≈{tgt} s). Subir "rate" (máx. +15%) o proponer recortes al usuario.')
    elif total<tgt-15: print(f'ℹ️  La voz dura {total:.0f} s: más corta que el objetivo ({tgt} s). Está bien si el guion es corto; no estirar.')
    timing.log(W,'Locución',time.time()-t0)

def voices(a):
    if a and a[0]=='eleven':
        key=os.environ.get('ELEVENLABS_API_KEY') or raise_('Falta ELEVENLABS_API_KEY');acc=a[1] if len(a)>1 else 'argentine'
        for u in ['https://api.elevenlabs.io/v1/voices',f'https://api.elevenlabs.io/v1/shared-voices?language=es&accent={acc}&page_size=30']:
            d=json.loads(urllib.request.urlopen(urllib.request.Request(u,headers={'xi-api-key':key}),timeout=40).read())
            for x in d.get('voices',[]):
                lab=x.get('labels') or {};print(f"{x['voice_id']}  {x['name'][:28]:28s} {x.get('gender') or lab.get('gender','')}  {x.get('accent') or lab.get('accent','')}  {'(biblioteca)' if 'shared' in u else '(tuyas)'}")
        return
    import edge_tts
    loc=(a[0] if a else 'es-AR').lower()
    for x in asyncio.run(edge_tts.list_voices()):
        if x['Locale'].lower().startswith(loc): print(f"{x['ShortName']:28s} {x['Gender']}")
def sample(vid,text,out):
    v={'engine':'eleven','id':vid} if not re.match(r'^[a-z]{2}-[A-Z]{2}-',vid) else {'engine':'edge','id':vid,'rate':'+5%'}
    (eleven if v['engine']=='eleven' else edge_tts)(text,v,out);print('✓',out)

if __name__=='__main__':
    a=sys.argv[1:]
    if not a or a[0] in('-h','--help'): print(__doc__)
    elif a[0]=='voices': voices(a[1:])
    elif a[0]=='sample': sample(a[1],a[2],a[3])
    else: run(a[0])
