#!/usr/bin/env python3
"""Golpes (beats) de la música del video, para que los cortes de escena caigan en el ritmo.
uso: $PY beats.py <work>   → <work>/beats.json {bpm, beats:[s], downbeats:[s]} en tiempo del VIDEO (ya descuenta music.offset y repite si la música loopea)
render.js corre los cortes al golpe más cercano si está a ≤ config.snap_beats segundos (default 0.15; false = no correr).
Sin dependencias: ffmpeg → PCM mono 11 kHz → envolvente de ataques → tempo por autocorrelación (70–180 BPM) → fase de la grilla.
"""
import os as _o,sys as _s,subprocess as _sp
if _o.name=='nt' and __name__=='__main__' and not _s.flags.utf8_mode: _s.exit(_sp.run([_s.executable,'-X','utf8','-I',_o.path.abspath(__file__),*_s.argv[1:]]).returncode)
import array,json,math,os,subprocess,sys

SR,HOP=11025,256          # ~23 ms por cuadro de análisis

def onsets(path,start,dur):
    raw=subprocess.run(['ffmpeg','-v','error','-ss',str(start),'-t',str(dur),'-i',path,'-ac','1','-ar',str(SR),'-f','s16le','-'],capture_output=True).stdout
    a=array.array('h');a.frombytes(raw[:len(raw)//2*2])
    en=[math.sqrt(sum(x*x for x in a[i:i+HOP])/HOP) for i in range(0,len(a)-HOP,HOP)]
    lg=[math.log1p(e) for e in en]
    od=[max(0.0,lg[i]-lg[i-1]) for i in range(1,len(lg))];od.insert(0,0.0)
    # restar la media local (1 s) para quedarse con los ataques
    W=int(SR/HOP);out=[]
    for i in range(len(od)):
        lo,hi=max(0,i-W//2),min(len(od),i+W//2);m=sum(od[lo:hi])/(hi-lo);out.append(max(0.0,od[i]-m))
    return out

def tempo(od):
    fps=SR/HOP;best=(0,0)
    for bpm10 in range(700,1801,5):
        lag=fps*60/(bpm10/10)
        L=int(round(lag));s=sum(od[i]*od[i+L] for i in range(len(od)-L))
        # preferir 90–140 BPM (evita elegir la mitad o el doble del tempo real)
        w=math.exp(-0.5*(math.log2((bpm10/10)/115)/0.9)**2)
        if s*w>best[0]: best=(s*w,bpm10/10)
    return best[1]

def grid(od,bpm):
    fps=SR/HOP;per=fps*60/bpm;best=(-1,0)
    for k in range(int(per)):
        ph=k;s=0;t=ph
        while t<len(od): s+=od[int(t)];t+=per
        if s>best[0]: best=(s,ph)
    ph=best[1];bts=[];t=ph
    while t<len(od): bts.append(t/fps);t+=per
    # compás: de las 4 fases posibles, la que tiene ataques más fuertes
    acc=[sum(od[int(b*fps)] for b in bts[j::4]) for j in range(4)];j=acc.index(max(acc))
    return bts,bts[j::4]

def main(WD):
    cfg=json.load(open(os.path.join(WD,'config.json')));m=cfg.get('music') or {}
    if not m.get('path') or not os.path.exists(m['path']): sys.exit('✗ config.json no tiene music.path (elegir la música primero)')
    tot=None
    try: tot=json.load(open(os.path.join(WD,'timing.json'))).get('duration')
    except Exception: pass
    if not tot:
        r=subprocess.run(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',os.path.join(WD,'voice.wav')],capture_output=True,text=True).stdout.strip()
        tot=float(r or 60)
    tot=float(tot)+float(cfg.get('tail',1.6))+1
    off=float(m.get('offset',0))
    r=subprocess.run(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',m['path']],capture_output=True,text=True).stdout.strip()
    mdur=float(r or 0)
    span=min(tot,max(1.0,mdur-off)) if mdur else tot
    od=onsets(m['path'],off,span);bpm=tempo(od);b,db=grid(od,bpm)
    # si la música es más corta que el video, mix.py la repite desde el principio del archivo (no desde offset): solo se marca el primer tramo
    out={'bpm':round(bpm,1),'source':m['path'],'offset':off,'beats':[round(x,3) for x in b if x<tot],'downbeats':[round(x,3) for x in db if x<tot]}
    json.dump(out,open(os.path.join(WD,'beats.json'),'w'),indent=1)
    print(f"✓ beats.json · {out['bpm']} BPM · {len(out['beats'])} golpes, {len(out['downbeats'])} de compás (hasta {span:.1f} s)")

if __name__=='__main__':
    if len(sys.argv)<2: print(__doc__);sys.exit(1)
    main(os.path.abspath(sys.argv[1]))
