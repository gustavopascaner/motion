#!/usr/bin/env python3
"""Locución del guion: genera la voz de cada beat, la une y guarda los tiempos de cada palabra.
uso: $PY tts.py <work>                 lee <work>/script.json → <work>/voice.wav + <work>/words.json
     $PY tts.py voices [es-AR]         lista las voces de edge-tts de ese idioma
     $PY tts.py voices eleven [acento] lista voces de ElevenLabs (tuyas + biblioteca; la clave necesita el permiso "Voices: read")
     $PY tts.py samples <carpeta> "<frase>" <voz1> <voz2> …   una muestra por voz (edge o voice_id de ElevenLabs) para comparar

script.json:
{ "voice": {"id":"mujer"}          ← "mujer" = Agustina · "hombre" = Manuel (ElevenLabs si hay clave; si no, Elena / Tomás de edge-tts)
             o una voz puntual: {"engine":"edge", "id":"es-AR-ElenaNeural", "rate":"+5%", "pitch":"+0Hz"},
  "lead": 0.35,                      ← segundos de imagen antes de que arranque la voz
  "beats": [ {"id":"b01", "text":"¿Sabés por qué…?", "say":"(opcional: texto para pronunciar)", "pause":0.25}, … ] }
engine "eleven": {"engine":"eleven","id":"<voice_id>","model":"eleven_multilingual_v2","stability":0.45,"similarity":0.8,"style":0.2,"speed":1.05}
Clave de ElevenLabs: variable ELEVENLABS_API_KEY o el archivo ~/.config/motion/elevenlabs_key (fuera del repo).
Con ElevenLabs cada beat se genera con el texto anterior y el siguiente como contexto, para que la entonación sea continua.
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

KEYFILE=os.path.expanduser('~/.config/motion/elevenlabs_key')
def eleven_key(required=True):
    """Clave de ElevenLabs: variable ELEVENLABS_API_KEY o ~/.config/motion/elevenlabs_key (nunca dentro de la skill/repo)."""
    k=os.environ.get('ELEVENLABS_API_KEY') or (open(KEYFILE).read().strip() if os.path.exists(KEYFILE) else '')
    if not k and required: raise SystemExit(f'Falta la clave de ElevenLabs: pedírsela al usuario y guardarla en {KEYFILE} (chmod 600)')
    return k
def eleven_req(url,body=None,tries=4):
    req=urllib.request.Request(url,json.dumps(body).encode() if body is not None else None,{'xi-api-key':eleven_key(),'Content-Type':'application/json'})
    for k in range(tries):
        try: return urllib.request.urlopen(req,timeout=120).read()
        except urllib.error.HTTPError as e:
            msg=e.read().decode('utf-8','replace')[:300]
            if e.code==429 and k<tries-1: time.sleep(3*(k+1));continue
            hint={401:'clave inválida o sin permiso para esta operación (ver "missing_permissions")',402:'sin créditos en la cuenta',404:'voz o modelo inexistente (revisar voice_id)',
                  422:'parámetros inválidos'}.get(e.code,'')
            if 'quota' in msg: hint='se terminaron los créditos del mes'
            raise SystemExit(f'ElevenLabs {e.code}: {hint}\n{msg}')
def eleven(text,v,mp3,prev=None,nxt=None):
    model=v.get('model','eleven_multilingual_v2')
    body={'text':text,'model_id':model,'language_code':v.get('lang','es'),
          'voice_settings':{'stability':v.get('stability',.45),'similarity_boost':v.get('similarity',.8),'style':v.get('style',.2),'use_speaker_boost':True,'speed':v.get('speed',1.0)}}
    if model!='eleven_v3':   # continuidad de entonación entre beats (v3 no lo admite)
        if prev: body['previous_text']=prev
        if nxt: body['next_text']=nxt
    d=json.loads(eleven_req(f"https://api.elevenlabs.io/v1/text-to-speech/{v['id']}/with-timestamps?output_format=mp3_44100_128",body))
    open(mp3,'wb').write(base64.b64decode(d['audio_base64']))
    al=d.get('alignment') or d['normalized_alignment'];ch,st,en=al['characters'],al['character_start_times_seconds'],al['character_end_times_seconds']
    ws=[];cur=None
    for c,a,b in zip(ch,st,en):
        if c.isspace():
            if cur: ws.append(cur);cur=None
            continue
        if cur is None: cur={'w':'','s':a,'e':b}
        cur['w']+=c;cur['e']=b
    if cur: ws.append(cur)
    for w in ws: w['w']=re.sub(r'^[^\w]+|[^\w%]+$','',w['w']) or w['w']
    return [w for w in ws if re.search(r'\w',w['w'])]
def raise_(m): raise SystemExit(m)

# Voces por defecto (argentinas). Con clave de ElevenLabs: Agustina (mujer) y Manuel (hombre); sin clave: edge-tts.
DEFAULTS={'eleven':{'mujer':('TZvhlMgMw2P4gPSuD8v7','Agustina'),'hombre':('L7pBVwjueW3IPcQt4Ej9','Manuel')},
          'edge':{'mujer':('es-AR-ElenaNeural','Elena'),'hombre':('es-AR-TomasNeural','Tomás')}}
def resolve(v):
    """"id": "mujer" | "hombre" → la voz por defecto (ElevenLabs si hay clave o si engine es "eleven"; si no, edge-tts)."""
    g=str(v.get('id','')).lower()
    if g not in('mujer','hombre'): return v
    eng=v.get('engine') or ('eleven' if eleven_key(False) else 'edge')
    vid,name=DEFAULTS[eng][g];r={**v,'engine':eng,'id':vid,'name':name}
    if eng=='edge': r.setdefault('rate','+5%')
    print(f'voz por defecto ({g}): {name} · {"ElevenLabs" if eng=="eleven" else "edge-tts (gratis)"}');return r

def run(W):
    t0=time.time();S=json.load(open(os.path.join(W,'script.json')));v=resolve(S['voice']);lead=S.get('lead',.35)
    C=os.path.join(W,'voice','cache');os.makedirs(C,exist_ok=True)
    parts=[];words=[];beats=[];cur=lead;gen=0;SAY=[b.get('say') or b['text'] for b in S['beats']];EL=v.get('engine')=='eleven'
    if EL: print(f"ElevenLabs · voz {v['id']} · {v.get('model','eleven_multilingual_v2')} · el guion completo son {sum(map(len,SAY))} caracteres (solo se cobran los beats que cambian)")
    for i,b in enumerate(S['beats']):
        say=SAY[i];prev=SAY[i-1] if EL and i else None;nxt=SAY[i+1] if EL and i<len(SAY)-1 else None
        key=hashlib.sha1(json.dumps([v,say,prev,nxt],sort_keys=True).encode()).hexdigest()[:16]
        mp3,wj=os.path.join(C,key+'.mp3'),os.path.join(C,key+'.json')
        if not(os.path.exists(mp3) and os.path.exists(wj)):
            ws=eleven(say,v,mp3,prev,nxt) if EL else edge_tts(say,v,mp3);json.dump(ws,open(wj,'w'),ensure_ascii=False);gen+=1
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
    if total>tgt+6: print(f'⚠️  La voz dura {total:.0f} s (objetivo ≈{tgt} s). Acelerar ("rate" hasta +15% en edge, "speed" hasta 1.15 en ElevenLabs) o proponer recortes al usuario.')
    elif total<tgt-15: print(f'ℹ️  La voz dura {total:.0f} s: más corta que el objetivo ({tgt} s). Está bien si el guion es corto; no estirar.')
    timing.log(W,'Locución',time.time()-t0)

def voices(a):
    if a and a[0]=='eleven':
        acc=a[1] if len(a)>1 else 'argentine'
        for u,tag in [('https://api.elevenlabs.io/v1/voices','tuya'),(f'https://api.elevenlabs.io/v1/shared-voices?language=es&accent={acc}&page_size=40','biblioteca')]:
            d=json.loads(eleven_req(u))
            for x in d.get('voices',[]):
                lab=x.get('labels') or {};desc=(x.get('description') or lab.get('description') or '')[:50]
                print(f"{x['voice_id']}  {x['name'][:26]:26s} {(x.get('gender') or lab.get('gender') or ''):7s} {(x.get('accent') or lab.get('accent') or ''):12s} ({tag}{', pública: '+x['public_owner_id'] if x.get('public_owner_id') else ''})  {desc}")
        return
    import edge_tts
    loc=(a[0] if a else 'es-AR').lower()
    for x in asyncio.run(edge_tts.list_voices()):
        if x['Locale'].lower().startswith(loc): print(f"{x['ShortName']:28s} {x['Gender']}")
def samples(out,text,ids):
    """Una muestra por voz (ids de edge como es-AR-ElenaNeural o voice_id de ElevenLabs) → <out>/NN_<voz>.mp3"""
    os.makedirs(out,exist_ok=True)
    for k,vid in enumerate(ids,1):
        edge=bool(re.match(r'^[a-z]{2}-[A-Z]{2}-',vid));f=os.path.join(out,f"{k:02d}_{'edge' if edge else 'eleven'}_{re.sub(r'[^A-Za-z0-9-]','',vid)[:24]}.mp3")
        edge_tts(text,{'id':vid,'rate':'+5%'},f) if edge else eleven(text,{'engine':'eleven','id':vid},f);print('✓',f)

if __name__=='__main__':
    a=sys.argv[1:]
    if not a or a[0] in('-h','--help'): print(__doc__)
    elif a[0]=='voices': voices(a[1:])
    elif a[0]=='samples': samples(a[1],a[2],a[3:])
    else: run(a[0])
