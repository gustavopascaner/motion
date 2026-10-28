#!/usr/bin/env python3
"""Cronómetro de la edición. Los scripts anotan solos cuánto tarda cada paso en <work>/timing.json;
el agente marca sus etapas y esperas en <work>/timing_fases.jsonl (solo se agrega, sin pisar).
uso: python3 -I timing.py start <work>              (al empezar: marca el inicio)
     python3 -I timing.py fase <work> "<etapa>"     (el agente empieza una etapa: Storyboard, Chequeo, Corrección: …)
     python3 -I timing.py espera <work> "<motivo>"  (antes de preguntarle algo al usuario; la próxima `fase` cierra la espera)
     python3 -I timing.py report <work>             (al terminar: tiempo total + desglose + cronología; también en timing.md)
"""
import os as _o,sys as _s,subprocess as _sp
if _o.name=='nt' and __name__=='__main__' and not _s.flags.utf8_mode: _s.exit(_sp.run([_s.executable,'-X','utf8','-I',_o.path.abspath(__file__),*_s.argv[1:]]).returncode)  # Windows: acentos en UTF-8
import json,os,sys,time,shutil
def _p(W): return os.path.join(W,'timing.json')
def _f(W): return os.path.join(W,'timing_fases.jsonl')
def _load(W):
    try: return json.load(open(_p(W)))
    except Exception: return {'start':None,'steps':[]}
def log(W,step,secs):
    if not os.path.isdir(W): return
    d=_load(W);d['steps'].append({'step':step,'secs':round(secs,1),'at':round(time.time())});json.dump(d,open(_p(W),'w'),indent=1)
def mark(W,kind,name):
    os.makedirs(W,exist_ok=True)
    with open(_f(W),'a',encoding='utf-8') as f: f.write(json.dumps({'kind':kind,'name':name,'at':round(time.time(),1)},ensure_ascii=False)+'\n')
def _marks(W):
    try: return sorted((json.loads(l) for l in open(_f(W),encoding='utf-8') if l.strip()),key=lambda m:m['at'])
    except Exception: return []
def fmt(s):
    s=int(round(s));return f'{s//3600} h {s%3600//60:02d} min' if s>=3600 else f'{s//60} min {s%60:02d} s' if s>=60 else f'{s} s'
def clock(s): s=int(max(0,s));return f'{s//60:02d}:{s%60:02d}'
def _video(W):
    "Duración del MP4 final y modo, para comparar videos entre sí."
    try: c=json.load(open(os.path.join(W,'config.json')))
    except Exception: return None,None
    mp4=os.path.join(c.get('out_dir',''),f"{c.get('name','')}.mp4");dur=None
    if shutil.which('ffprobe') and os.path.isfile(mp4):
        try: dur=float(_sp.run(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',mp4],capture_output=True,text=True,timeout=20).stdout.strip())
        except Exception: pass
    return dur,c.get('modo','placas')
def report(W):
    d=_load(W);now=time.time();st=d['start'] or (min([x['at']-x['secs'] for x in d['steps']]) if d['steps'] else now)
    tot=now-st;agg={};tools=[]
    for x in d['steps']:
        if x['at']>=st: agg[x['step']]=agg.get(x['step'],0)+x['secs'];tools.append((x['at']-x['secs'],x['at'],x['step']))
    proc=sum(agg.values())
    # Etapas del agente: cada marca dura hasta la siguiente; se descuenta lo que corrió una herramienta en ese tramo.
    ms=[m for m in _marks(W) if m['at']>=st];segs=[]
    if ms and ms[0]['at']-st>=1: segs.append(('fase','Sin marcar (antes de la primera etapa)',st,ms[0]['at']))
    segs+=[(m['kind'],m['name'],m['at'],ms[i+1]['at'] if i+1<len(ms) else now) for i,m in enumerate(ms)]
    ov=lambda a,b:sum(max(0,min(b,te)-max(a,ts)) for ts,te,_ in tools)
    fases={};esperas={};wait=0
    for k,n,a,b in segs:
        if k=='espera': esperas[n]=esperas.get(n,0)+(b-a);wait+=b-a
        else: t,c=fases.get(n,(0,0));fases[n]=(t+max(0,(b-a)-ov(a,b)),c+1)
    agent=max(0,tot-proc-wait);dur,modo=_video(W)
    lines=[f'**Tiempo total de procesamiento: {fmt(tot)}**']
    if wait: lines+=[f'**Sin contar esperas al usuario: {fmt(tot-wait)}**']
    if dur: lines+=['',f'Video: {fmt(dur)} · modo {modo} · {(tot-wait)/dur:.0f} s de procesamiento por segundo de video']
    lines+=['','| Paso | Tiempo |','|---|---|']
    lines+=[f'| {k} | {fmt(v)} |' for k,v in agg.items()]
    lines+=[f'| Análisis, decisiones y revisión del agente | {fmt(agent)} |']
    if wait: lines+=[f'| Esperando respuesta del usuario | {fmt(wait)} |']
    if ms:
        lines+=['','### Agente por etapa','','| Etapa | Tiempo | Veces |','|---|---|---|']
        lines+=[f'| {n} | {fmt(t)} | {c} |' for n,(t,c) in sorted(fases.items(),key=lambda x:-x[1][0])]
        lines+=[f'| ⏸ Esperando: {n} | {fmt(t)} | |' for n,t in esperas.items()]
        ev=[(a,'⏸ Esperando: '+n,b-a) if k=='espera' else (a,'🧠 '+n,max(0,(b-a)-ov(a,b))) for k,n,a,b in segs]+[(a,'⚙️ '+n,b-a) for a,b,n in tools]
        lines+=['','### Cronología','','| Desde el inicio | Qué | Duración |','|---|---|---|']
        lines+=[f'| {clock(a-st)} | {n} | {fmt(s)} |' for a,n,s in sorted(ev)]
    # Corrida completa (con Guion y beats) sin alguna etapa obligatoria: avisarlo, porque su tiempo se suma a la etapa anterior.
    req=['Guion y beats','Música','Historial y tratamiento' if modo=='libre' else 'Tratamiento y look','Storyboard y anim.js' if modo=='libre' else 'Storyboard','Chequeo','Revisión de director','Cierre y LEEME']
    falta=[n for n in req if n not in fases] if 'Guion y beats' in fases else []
    if falta: lines+=['',f'⚠️ Sin marcar: {", ".join(falta)} (su tiempo quedó sumado a la etapa anterior)']
    txt='\n'.join(lines);open(os.path.join(W,'timing.md'),'w',encoding='utf-8').write(txt+'\n');print(txt)
if __name__=='__main__':
    cmd,W=sys.argv[1],sys.argv[2]
    if cmd=='start':
        os.makedirs(W,exist_ok=True);json.dump({'start':time.time(),'steps':[]},open(_p(W),'w'),indent=1)
        if os.path.exists(_f(W)): os.remove(_f(W))
        print('⏱  cronómetro iniciado')
    elif cmd in('fase','espera'): mark(W,cmd,' '.join(sys.argv[3:]) or cmd)
    elif cmd=='report': report(W)
