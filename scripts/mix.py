#!/usr/bin/env python3
"""Mezcla final: video.mp4 (render.js) + voz + música (con volumen automático) + SFX → <out_dir>/<NAME>.mp4
uso: $PY mix.py <work>          (rápido: si cambia la música o el volumen, no hace falta volver a renderizar)
config.json → "music": {"path": ..., "offset": 12, "intro": -8, "bed": -21, "outro": -10, "lift": 4, "gap": 1.2}
  intro = dB de la música antes de que arranque la voz · bed = debajo de la voz · outro = en la cola final
  lift = cuántos dB sube la música en los silencios de la voz de más de `gap` s (0 = sin subidas)
  La sonoridad final se ajusta en dos pasadas (medir → aplicar) para llegar a −14 LUFS exactos sin bombeo.
  (la música se normaliza a −16 LUFS antes de aplicar esos niveles; la voz ya viene a −16 LUFS)
"""
import os as _o,sys as _s,subprocess as _sp
if _o.name=='nt' and __name__=='__main__' and not _s.flags.utf8_mode: _s.exit(_sp.run([_s.executable,'-X','utf8','-I',_o.path.abspath(__file__),*_s.argv[1:]]).returncode)
import json,os,subprocess,sys,time
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)));import timing

def ramp(pts):
    """pts=[(t,dB)…] → expresión de volumen de ffmpeg (lineal en dB entre puntos)"""
    e=f'{pts[-1][1]}'
    for (t0,a),(t1,b) in reversed(list(zip(pts,pts[1:]))):
        e=f'if(lt(t,{t1:.3f}),{a}+({b}-({a}))*(t-{t0:.3f})/{max(.001,t1-t0):.3f},{e})'
    return f"pow(10,({e})/20)"

def music_points(vo,M,T,end=-40):
    """Curva de volumen de la música [(t,dB)…]: intro → bajo la voz (con subidas en los silencios largos) → cierre → fade."""
    vs,ve=vo['beats'][0]['s'],vo['voice_end'];intro,bed,outro=M.get('intro',-8),M.get('bed',-21),M.get('outro',-10)
    lift,gap=M.get('lift',4),max(1.0,M.get('gap',1.2))   # subidas de al menos ~0,5 s
    pts=[(0,intro),(max(.01,vs-.15),intro),(vs+.5,bed)]
    ws=vo['words']
    if lift:
        for a,b in zip(ws,ws[1:]):
            if b['s']-a['e']>=gap and a['e']+.15>pts[-1][0]:
                pts+=[(a['e']+.15,bed),(a['e']+.4,bed+lift),(b['s']-.3,bed+lift),(b['s']-.1,bed)]
    pts+=[(max(ve,pts[-1][0]+.01),bed),(ve+.7,outro),(max(ve+.8,T-1.6),outro),(T,end)]
    return pts

def loudnorm2(args,fc,target='I=-14:TP=-1.5:LRA=11'):
    """Dos pasadas: mide la mezcla y devuelve el filtro loudnorm lineal con esas medidas (cae a una pasada si no puede medir)."""
    import re
    a=[x if x!='error' else 'info' for x in args]   # loudnorm imprime las medidas en nivel info
    r=subprocess.run(a+['-hide_banner','-nostats','-filter_complex',fc+f',loudnorm={target}:print_format=json[x]','-map','[x]','-f','null','-'],capture_output=True,text=True,errors='replace')
    m=re.search(r'\{[^{}]*"input_i"[^{}]*\}',r.stderr)
    if not m: print('⚠️  no pude medir la sonoridad: normalizo en una pasada');return f'loudnorm={target}'
    d=json.loads(m.group(0))
    return (f"loudnorm={target}:measured_I={d['input_i']}:measured_TP={d['input_tp']}:measured_LRA={d['input_lra']}"
            f":measured_thresh={d['input_thresh']}:offset={d['target_offset']}:linear=true")

def main(W):
    t0=time.time();c=json.load(open(os.path.join(W,'config.json')));vo=json.load(open(os.path.join(W,'words.json')))
    tl=json.load(open(os.path.join(W,'timeline.json')));sfx=json.load(open(os.path.join(W,'sfx.json')))
    T=tl['total'];name=c['name'];out_dir=c['out_dir'];os.makedirs(out_dir,exist_ok=True)
    vid=os.path.join(W,'video.mp4')
    if not os.path.exists(vid): raise SystemExit('Falta video.mp4: correr render.js primero')
    args=['ffmpeg','-v','error','-y','-i',vid,'-i',os.path.join(W,'voice.wav')];fc=[];mix=['[v]']
    fc.append(f"[1]atrim=0:{T:.3f},apad=whole_dur={T:.3f},aresample=48000,aformat=channel_layouts=stereo,volume=1.0[v]")
    m=c.get('music') or {};k=2
    if m.get('path'):
        pts=music_points(vo,m,T)
        args+=['-stream_loop','-1','-ss',str(m.get('offset',0)),'-i',m['path']]
        fc.append(f"[{k}]atrim=0:{T:.3f},asetpts=PTS-STARTPTS,aresample=48000,aformat=channel_layouts=stereo,loudnorm=I=-16:TP=-2:LRA=11,aresample=48000,"
                  f"afade=t=in:d=0.25,volume='{ramp(pts)}':eval=frame[m]");mix.append('[m]');k+=1
    else: print('ℹ️  sin música (config.music.path vacío)')
    for i,x in enumerate(sfx):
        args+=['-i',x['file']];ms=int(x['start']*1000)
        fc.append(f"[{k}]atrim={x['sin']}:{x['sin']+x['dur']:.3f},asetpts=PTS-STARTPTS,aresample=48000,aformat=channel_layouts=stereo,{'afade=t=in:d=0.04,' if x['sin']>0 else ''}volume={x['gain']},adelay={ms}|{ms}[s{i}]");mix.append(f'[s{i}]');k+=1
    pre=';'.join(fc+[''.join(mix)+f"amix=inputs={len(mix)}:normalize=0:duration=first"])
    fc=[pre+','+loudnorm2(args,pre)+f",aresample=48000,atrim=0:{T:.3f}[a]"]
    final=os.path.join(out_dir,name+'.mp4')
    r=subprocess.run(args+['-filter_complex',';'.join(fc),'-map','0:v','-map','[a]','-c:v','copy','-c:a','aac','-b:a','192k','-movflags','+faststart','-t',f'{T:.3f}',final])
    if r.returncode: raise SystemExit('falló la mezcla')
    d=float(subprocess.run(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',final],capture_output=True,text=True,errors='replace').stdout or 0)
    print(f'✓ {final} ({d:.1f} s) · {len(sfx)} SFX');timing.log(W,'Mezcla de audio',time.time()-t0)

if __name__=='__main__':
    if len(sys.argv)<2 or sys.argv[1] in('-h','--help'): print(__doc__)
    else: main(sys.argv[1])
